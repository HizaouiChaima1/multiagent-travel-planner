import re
from datetime import date, timedelta

from app.mock_data.activities import CITIES
from app.mock_data.flights import DAYS, FLIGHTS, HUB, START_DATE, _generate, get_flights


def test_at_least_300_flights():
    assert len(FLIGHTS) >= 300


def test_twelve_cities_covered():
    cities = {f["origin"] for f in FLIGHTS} | {f["destination"] for f in FLIGHTS}
    assert cities == set(CITIES)


def test_every_flight_goes_from_or_to_hub():
    for f in FLIGHTS:
        assert HUB in (f["origin"], f["destination"])
        assert f["origin"] != f["destination"]


def test_flight_fields_are_valid():
    for f in FLIGHTS:
        assert f["airline"]
        assert f["price"] > 0
        assert f["arrival_time"] > f["departure_time"]


def test_reproducible():
    assert _generate() == FLIGHTS


def test_unique_ids():
    ids = [f["id"] for f in FLIGHTS]
    assert len(ids) == len(set(ids))


def test_every_route_has_flights_every_day():
    covered = {(f["origin"], f["destination"], f["departure_time"].date()) for f in FLIGHTS}
    for city in CITIES:
        if city == HUB:
            continue
        for offset in range(DAYS):
            day = START_DATE + timedelta(days=offset)
            assert (HUB, city, day) in covered
            assert (city, HUB, day) in covered


def test_filter_origin_and_destination_case_insensitive():
    data = get_flights(origin="tunis", destination="ROME")
    assert data and all(f["origin"] == "Tunis" and f["destination"] == "Rome" for f in data)


def test_filter_date():
    day = date(2026, 12, 10)
    data = get_flights(origin="Tunis", destination="Rome", departure_date=day)
    assert data and all(f["departure_time"].date() == day for f in data)


def test_filter_max_price():
    data = get_flights(origin="Tunis", destination="Rome", max_price=90)
    assert data and all(f["price"] <= 90 for f in data)


def test_filters_combined_and_no_result():
    assert get_flights(origin="Tunis", destination="Rome", max_price=1) == []
    assert get_flights(origin="Paris", destination="Rome") == []




# --- Endpoint GET /mock/flights ---

FLIGHT_FIELDS = {
    "id", "airline", "origin", "destination", "departure_time", "arrival_time", "price"
}
NAIVE_DATETIME = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$")


def test_endpoint_follows_contract(client):
    r = client.get(
        "/mock/flights",
        params={"origin": "Tunis", "destination": "Rome", "date": "2026-12-10"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data
    for f in data:
        assert set(f) == FLIGHT_FIELDS
        assert NAIVE_DATETIME.match(f["departure_time"])
        assert NAIVE_DATETIME.match(f["arrival_time"])
        assert f["departure_time"].startswith("2026-12-10")


def test_endpoint_filters_are_case_insensitive_and_combined(client):
    r = client.get(
        "/mock/flights",
        params={"origin": "tunis", "destination": "rome", "max_price": 90},
    )
    data = r.json()
    assert r.status_code == 200
    assert data
    assert all(f["origin"] == "Tunis" and f["destination"] == "Rome" for f in data)
    assert all(f["price"] <= 90 for f in data)


def test_endpoint_without_filters_returns_all_flights(client):
    assert len(client.get("/mock/flights").json()) == len(FLIGHTS)


def test_endpoint_no_result_returns_empty_list(client):
    r = client.get("/mock/flights", params={"destination": "Rome", "max_price": 1})
    assert r.status_code == 200
    assert r.json() == []


def test_endpoint_rejects_invalid_date(client):
    assert client.get("/mock/flights", params={"date": "10-12-2026"}).status_code == 422


def test_endpoint_rejects_negative_max_price(client):
    assert client.get("/mock/flights", params={"max_price": -5}).status_code == 422


def test_endpoint_documented_in_openapi(client):
    paths = client.get("/openapi.json").json()["paths"]
    assert "/mock/flights" in paths