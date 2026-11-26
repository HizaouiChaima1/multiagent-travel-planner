"""US06 (programme), US07 (budget) et US08 (orchestrateur), en mode sans LLM (déterministe)."""

from datetime import date, datetime

import pytest

from app.agents.activities import overlapping_slots
from app.agents.budget import review_budget
from app.agents.graph import plan_trip
from app.agents.planner import build_planner_graph

REQUESTS = [
    ("Rome", date(2026, 12, 12), date(2026, 12, 16), 2, 1500),
    ("Paris", date(2026, 12, 20), date(2026, 12, 24), 1, 1200),
    ("Lisbonne", date(2026, 12, 5), date(2026, 12, 9), 2, 2500),
    ("Marrakech", date(2027, 1, 10), date(2027, 1, 13), 3, 1800),
    ("Athènes", date(2026, 12, 2), date(2026, 12, 7), 2, 2000),
]


def trip(destination="Rome", dep=date(2026, 12, 12), ret=date(2026, 12, 16), travelers=2, budget=1500):
    return {
        "id": 1,
        "destination": destination,
        "departure_date": dep,
        "return_date": ret,
        "travelers": travelers,
        "budget": budget,
        "now": datetime(2026, 11, 26),
    }


@pytest.mark.parametrize("request_", REQUESTS, ids=[r[0] for r in REQUESTS])
def test_programme_respects_city_limits_and_no_overlap(request_):
    it = plan_trip(trip(*request_), llm=None)
    arrival, departure = it.outbound_flight.arrival_time, it.return_flight.departure_time
    seen = set()
    for day in it.days:
        assert len(day.activities) <= 4
        assert overlapping_slots(day) == []
        for slot in day.activities:
            assert slot.activity.city == it.destination
            assert slot.activity.id not in seen, "une activité n'est proposée qu'une fois"
            seen.add(slot.activity.id)
            start = datetime.combine(day.date, datetime.strptime(slot.start_time, "%H:%M").time())
            end = datetime.combine(day.date, datetime.strptime(slot.end_time, "%H:%M").time())
            assert start >= arrival, "pas d'activité avant l'atterrissage"
            assert end <= departure, "pas d'activité après le décollage"


def test_full_days_have_two_to_four_activities_with_comfortable_budget():
    it = plan_trip(trip(budget=1500), llm=None)
    full_days = it.days[1:-1]
    assert all(2 <= len(day.activities) <= 4 for day in full_days)


def test_activities_are_counted_in_cost():
    it = plan_trip(trip(budget=1500), llm=None)
    prices = sum(s.activity.price for d in it.days for s in d.activities)
    assert it.cost.activities == prices * it.travelers
    assert it.cost.total == it.cost.flights + it.cost.hotel + it.cost.activities


@pytest.mark.parametrize("budget", [1500, 900])
def test_generous_and_tight_budgets_stay_within_tolerance(budget):
    it = plan_trip(trip(budget=budget), llm=None)
    assert it.budget_status in ("within_budget", "adjusted")
    assert it.cost.total <= budget * 1.05
    assert it.budget_message is None


def test_impossible_budget_explains_the_gap():
    it = plan_trip(trip(budget=300), llm=None)
    assert it.budget_status == "over_budget"
    assert "300" in it.budget_message and "insuffisant" in it.budget_message
    assert it.cost.activities == 0, "seules des activités gratuites restent"


def test_budget_agent_swaps_expensive_hotel_first():
    # Itinéraire de départ avec l'hôtel le plus cher de Rome, puis un budget juste.
    planned = build_planner_graph(None).invoke({"trip": trip(budget=5000)})["itinerary"]
    from app.mock_data.hotels import get_hotels
    from app.schemas import Hotel

    priciest = Hotel.model_validate(max(get_hotels(city="Rome"), key=lambda h: h["price_per_night"]))
    expensive = planned.model_copy(update={"hotel": priciest, "budget": 700})
    decision = review_budget(expensive, trip(budget=700), mode="free", adjusted=False)
    assert decision.itinerary.hotel.price_per_night < priciest.price_per_night
    assert "hôtel remplacé" in decision.message


def test_budget_agent_asks_for_free_programme_when_activities_cost_too_much():
    it = plan_trip(trip(budget=1500), llm=None)
    squeezed = it.model_copy(update={"budget": it.cost.flights + it.cost.hotel})
    decision = review_budget(squeezed, trip(budget=squeezed.budget), mode="normal", adjusted=False)
    assert decision.next_mode == "free"


def test_orchestrator_logs_each_agent_in_order():
    it = plan_trip(trip(budget=1500), llm=None)
    assert [s.agent for s in it.steps] == ["planificateur", "programme", "budget"]
    assert all(s.message for s in it.steps)


def test_orchestrator_loop_is_bounded():
    it = plan_trip(trip(budget=300), llm=None)
    assert [s.agent for s in it.steps].count("programme") <= 2
