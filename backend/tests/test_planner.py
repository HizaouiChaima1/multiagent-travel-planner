from datetime import date, datetime

import pytest

from app.agents.cost import compute_cost
from app.agents.errors import NoAvailabilityError, PlannerError
from app.agents.planner import (
    build_itinerary,
    build_planner_graph,
    cheapest_choice,
    collect_candidates,
)
from app.agents.tools import search_flights, search_hotels
from app.schemas import Flight, Hotel, PlannerChoice
from tests.fake_llm import FakeLLM, pick_first


def trip(**over):
    base = {
        "id": 1, "destination": "Rome", "departure_date": date(2026, 12, 10),
        "return_date": date(2026, 12, 14), "travelers": 2, "budget": 1500.0,
        "now": datetime(2026, 11, 23, 12, 0),
    }
    base.update(over)
    return base


# --- Outils LangChain ---

def test_search_flights_tool_returns_json_flights():
    flights = search_flights.invoke({"origin": "Tunis", "destination": "Rome", "day": "2026-12-10"})
    assert flights
    for f in flights:
        Flight.model_validate(f)  # respecte le schéma du contrat
        assert f["departure_time"].startswith("2026-12-10")


def test_search_hotels_tool_filters_by_city_and_price():
    hotels = search_hotels.invoke({"city": "rome"})
    assert 5 <= len(hotels) <= 8
    cheap = search_hotels.invoke({"city": "Rome", "max_price_per_night": 80})
    assert all(h["price_per_night"] <= 80 for h in cheap)
    Hotel.model_validate(hotels[0])


# --- Planificateur ---

def test_planner_builds_complete_itinerary():
    t = trip()
    candidates = collect_candidates(t)
    graph = build_planner_graph(FakeLLM(pick_first(candidates)))
    it = graph.invoke({"trip": t})["itinerary"]
    assert it.outbound_flight.origin == "Tunis" and it.outbound_flight.destination == "Rome"
    assert it.return_flight.origin == "Rome" and it.return_flight.destination == "Tunis"
    assert it.outbound_flight.departure_time.date() == date(2026, 12, 10)
    assert it.return_flight.departure_time.date() == date(2026, 12, 14)
    assert it.hotel.city == "Rome"
    assert it.nights == 4
    assert len(it.days) == it.nights + 1
    assert [d.date for d in it.days][0] == date(2026, 12, 10)


def test_cost_follows_contract_rules():
    outbound = Flight(id="F1", airline="A", origin="Tunis", destination="Rome",
                      departure_time=datetime(2026, 12, 10, 8), arrival_time=datetime(2026, 12, 10, 10),
                      price=95)
    inbound = outbound.model_copy(update={"id": "F2", "price": 105})
    hotel = Hotel(id="H", city="Rome", name="X", district="Y", price_per_night=85, rating=4)
    cost = compute_cost(outbound, inbound, hotel, nights=4, travelers=2)
    assert cost.flights == 400 and cost.hotel == 340 and cost.activities == 0
    assert cost.total == 740 and cost.currency == "EUR"


def test_invalid_ids_trigger_retry_then_success():
    t = trip()
    good = pick_first(collect_candidates(t))
    bad = PlannerChoice(outbound_flight_id="FLT-9999", return_flight_id="X", hotel_id="Y")
    llm = FakeLLM(bad, ValueError("JSON invalide"), good)
    it = build_planner_graph(llm).invoke({"trip": t})["itinerary"]
    assert llm.calls == 3
    assert it.outbound_flight.id == good.outbound_flight_id


def test_three_invalid_answers_raise_planner_error():
    bad = PlannerChoice(outbound_flight_id="FLT-9999", return_flight_id="X", hotel_id="Y")
    llm = FakeLLM(bad)
    with pytest.raises(PlannerError):
        build_planner_graph(llm).invoke({"trip": trip()})
    assert llm.calls == 3


def test_llm_errors_raise_planner_error():
    with pytest.raises(PlannerError):
        build_planner_graph(FakeLLM(TimeoutError())).invoke({"trip": trip()})


def test_dates_outside_flight_window_raise_no_availability():
    with pytest.raises(NoAvailabilityError):
        build_planner_graph(FakeLLM()).invoke({"trip": trip(
            departure_date=date(2026, 11, 25), return_date=date(2026, 11, 29))})


def test_same_day_return_must_leave_after_arrival():
    t = trip(return_date=date(2026, 12, 10))
    candidates = collect_candidates(t)
    out = candidates["outbound"][1]  # vol de l'après-midi
    early = min(candidates["return"], key=lambda f: f["departure_time"])
    choice = PlannerChoice(outbound_flight_id=out["id"], return_flight_id=early["id"],
                           hotel_id=candidates["hotels"][0]["id"])
    llm = FakeLLM(choice, pick_first(candidates))
    if early["departure_time"] <= out["arrival_time"]:
        build_planner_graph(llm).invoke({"trip": t})
        assert llm.calls == 2  # le choix incompatible a été refusé
    # dans tous les cas, l'itinéraire final est cohérent
    it = build_planner_graph(FakeLLM(cheapest_choice(candidates))).invoke({"trip": t})["itinerary"]
    assert it.return_flight.departure_time > it.outbound_flight.arrival_time
    assert it.nights == 0 and len(it.days) == 1


def test_expensive_llm_choice_falls_back_to_cheapest_and_over_budget_is_explained():
    t = trip(budget=200.0, travelers=1, destination="Paris")
    candidates = collect_candidates(t)
    priciest_hotel = max(candidates["hotels"], key=lambda h: h["price_per_night"])
    choice = PlannerChoice(
        outbound_flight_id=max(candidates["outbound"], key=lambda f: f["price"])["id"],
        return_flight_id=max(candidates["return"], key=lambda f: f["price"])["id"],
        hotel_id=priciest_hotel["id"],
    )
    it = build_planner_graph(FakeLLM(choice)).invoke({"trip": t})["itinerary"]
    cheapest = cheapest_choice(candidates)
    assert it.hotel.id == cheapest.hotel_id
    assert it.budget_status == "over_budget"
    assert "200" in it.budget_message and f"{it.cost.total:g}" in it.budget_message


def test_within_budget_has_no_message():
    t = trip(budget=5000.0)
    it = build_planner_graph(FakeLLM(pick_first(collect_candidates(t)))).invoke({"trip": t})["itinerary"]
    assert it.budget_status == "within_budget" and it.budget_message is None


def test_build_itinerary_is_deterministic():
    t = trip()
    c = collect_candidates(t)
    ch = pick_first(c)
    assert build_itinerary(t, c, ch) == build_itinerary(t, c, ch)


def test_rate_limit_waits_then_retries(monkeypatch):
    class MistralAIRateLimitError(Exception):
        pass

    pauses = []
    monkeypatch.setattr("app.agents.planner.time.sleep", pauses.append)
    t = trip()
    llm = FakeLLM(MistralAIRateLimitError(), pick_first(collect_candidates(t)))
    it = build_planner_graph(llm).invoke({"trip": t})["itinerary"]
    assert llm.calls == 2 and pauses == [2.0] and it.hotel.city == "Rome"
