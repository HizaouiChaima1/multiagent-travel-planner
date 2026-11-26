import json
import time
from datetime import date
from pathlib import Path

import pytest

from app.agents.planner import collect_candidates
from app.main import app
from app.routers.itineraries import planner_llm
from app.schemas import Itinerary
from tests.fake_llm import FakeLLM, pick_first

CONTRACTS = Path(__file__).resolve().parents[2] / "contracts"


def make_trip(client, **over):
    body = {"destination": "Rome", "departure_date": "2026-12-10", "return_date": "2026-12-14",
            "travelers": 2, "budget": 1500}
    body.update(over)
    r = client.post("/trips", json=body)
    assert r.status_code == 201, r.text
    return r.json()["id"]


@pytest.fixture()
def with_llm():
    def _set(llm):
        app.dependency_overrides[planner_llm] = lambda: llm
    yield _set
    app.dependency_overrides.pop(planner_llm, None)


def rome_candidates():
    return collect_candidates({"destination": "Rome", "departure_date": date(2026, 12, 10),
                               "return_date": date(2026, 12, 14)})


def test_generate_returns_201_and_contract_schema(client, with_llm):
    with_llm(FakeLLM(pick_first(rome_candidates())))
    trip_id = make_trip(client)
    started = time.perf_counter()
    r = client.post("/itineraries/generate", json={"trip_id": trip_id})
    assert time.perf_counter() - started < 30
    assert r.status_code == 201
    body = r.json()
    it = Itinerary.model_validate(body)
    assert it.id >= 1 and it.trip_id == trip_id
    assert set(body) == set(Itinerary.model_fields)
    assert body["outbound_flight"]["origin"] == "Tunis"
    assert body["return_flight"]["destination"] == "Tunis"
    assert len(body["days"]) == body["nights"] + 1 == 5
    assert body["cost"]["total"] == (
        body["cost"]["flights"] + body["cost"]["hotel"] + body["cost"]["activities"])
    assert body["cost"]["flights"] == (
        body["outbound_flight"]["price"] + body["return_flight"]["price"]) * 2
    assert body["cost"]["hotel"] == body["hotel"]["price_per_night"] * 4


def test_each_generation_gets_its_own_id(client, with_llm):
    with_llm(FakeLLM(pick_first(rome_candidates())))
    trip_id = make_trip(client)
    a = client.post("/itineraries/generate", json={"trip_id": trip_id}).json()["id"]
    b = client.post("/itineraries/generate", json={"trip_id": trip_id}).json()["id"]
    assert a != b


def test_unknown_trip_returns_404(client, with_llm):
    with_llm(FakeLLM())
    r = client.post("/itineraries/generate", json={"trip_id": 9999})
    assert r.status_code == 404
    assert r.json() == {"detail": "Voyage introuvable."}


def test_invalid_body_returns_422(client, with_llm):
    with_llm(FakeLLM())
    assert client.post("/itineraries/generate", json={"trip_id": 0}).status_code == 422
    assert client.post("/itineraries/generate", json={}).status_code == 422


def test_dates_without_flights_return_422_with_message(client, with_llm):
    with_llm(FakeLLM())
    trip_id = make_trip(client, departure_date="2027-03-01", return_date="2027-03-05")
    r = client.post("/itineraries/generate", json={"trip_id": trip_id})
    assert r.status_code == 422
    assert "Aucun vol" in r.json()["detail"]


def test_unusable_llm_falls_back_to_mock_data(client, with_llm):
    with_llm(FakeLLM(ValueError("n'importe quoi")))
    trip_id = make_trip(client)
    r = client.post("/itineraries/generate", json={"trip_id": trip_id})
    assert r.status_code == 201
    assert "données simulées" in r.json()["steps"][0]["message"]


def test_missing_api_key_falls_back_to_mock_data(client, monkeypatch):
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    monkeypatch.delenv("PLANNER_MOCK", raising=False)  # indépendant du terminal de l'utilisateur
    trip_id = make_trip(client)
    r = client.post("/itineraries/generate", json={"trip_id": trip_id})
    assert r.status_code == 201
    Itinerary.model_validate(r.json())


def test_endpoint_documented_in_openapi(client):
    assert "/itineraries/generate" in client.get("/openapi.json").json()["paths"]


def test_pydantic_schema_accepts_shared_contract_example():
    example = CONTRACTS / "itinerary.response.json"
    if not example.exists():
        pytest.skip("dossier contracts/ absent (exécution dans l'image Docker)")
    Itinerary.model_validate(json.loads(example.read_text(encoding="utf-8")))


def test_mock_mode_works_without_api_key(client, monkeypatch):
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    monkeypatch.setenv("PLANNER_MOCK", "1")
    trip_id = make_trip(client)
    r = client.post("/itineraries/generate", json={"trip_id": trip_id})
    assert r.status_code == 201
    Itinerary.model_validate(r.json())

def test_generated_itinerary_has_programme_and_agent_log(client, monkeypatch):
    monkeypatch.setenv("PLANNER_MOCK", "1")
    trip_id = make_trip(client)
    body = client.post("/itineraries/generate", json={"trip_id": trip_id}).json()
    assert [s["agent"] for s in body["steps"]][:3] == ["planificateur", "programme", "budget"]
    assert sum(len(d["activities"]) for d in body["days"]) > 0


def test_saved_itinerary_can_be_read_back(client, monkeypatch):
    monkeypatch.setenv("PLANNER_MOCK", "1")
    trip_id = make_trip(client)
    assert client.get(f"/trips/{trip_id}/itinerary").status_code == 404
    created = client.post("/itineraries/generate", json={"trip_id": trip_id}).json()
    assert client.get(f"/itineraries/{created['id']}").json() == created
    assert client.get(f"/trips/{trip_id}/itinerary").json()["id"] == created["id"]
    assert client.get("/itineraries/9999").status_code == 404
