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