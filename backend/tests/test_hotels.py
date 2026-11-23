import re

from app.mock_data.activities import CITIES
from app.mock_data.hotels import CITY_DATA, HOTELS, _generate, get_hotels

HOTEL_ID = re.compile(r"^HOT-[A-Z]{3}-\d{2}$")


def test_five_to_eight_hotels_per_city():
    for city in CITIES:
        assert 5 <= len(get_hotels(city=city)) <= 8


def test_hotel_fields_are_valid():
    for h in HOTELS:
        assert HOTEL_ID.match(h["id"])
        assert h["name"]
        assert h["district"] in CITY_DATA[h["city"]][1]
        assert h["price_per_night"] > 0
        assert 0 <= h["rating"] <= 5


def test_unique_ids_and_names_per_city():
    ids = [h["id"] for h in HOTELS]
    assert len(ids) == len(set(ids))
    for city in CITIES:
        names = [h["name"] for h in get_hotels(city=city)]
        assert len(names) == len(set(names))


def test_reproducible():
    assert _generate() == HOTELS


def test_filter_city_case_insensitive():
    data = get_hotels(city="rOmE")
    assert data and all(h["city"] == "Rome" for h in data)


def test_filter_max_price():
    data = get_hotels(city="Rome", max_price=100)
    assert data and all(h["price_per_night"] <= 100 for h in data)


def test_filter_max_price_without_city():
    data = get_hotels(max_price=60)
    assert data and all(h["price_per_night"] <= 60 for h in data)


def test_no_result_and_unknown_city():
    assert get_hotels(city="Rome", max_price=1) == []
    assert get_hotels(city="Atlantide") == []