from app.mock_data.activities import ACTIVITIES, CITIES, _generate


def test_twelve_cities_fifteen_activities_each(client):
    assert len(CITIES) == 12
    for city in CITIES:
        r = client.get("/mock/activities", params={"city": city})
        assert r.status_code == 200
        assert len(r.json()) == 15


def test_activity_fields(client):
    for a in client.get("/mock/activities").json():
        assert {"id", "city", "name", "category", "price", "duration_hours", "setting"} <= a.keys()
        assert a["setting"] in ("indoor", "outdoor")
        assert a["price"] >= 0
        assert a["duration_hours"] > 0


def test_filter_city_case_insensitive(client):
    assert len(client.get("/mock/activities", params={"city": "paris"}).json()) == 15


def test_filter_max_price(client):
    data = client.get("/mock/activities", params={"city": "Rome", "max_price": 10}).json()
    assert data and all(a["price"] <= 10 for a in data)


def test_filter_setting_and_category(client):
    data = client.get(
        "/mock/activities", params={"city": "Tunis", "setting": "outdoor", "category": "nature"}
    ).json()
    assert data and all(a["setting"] == "outdoor" and a["category"] == "nature" for a in data)


def test_reproducible():
    assert _generate() == ACTIVITIES


def test_unique_ids():
    ids = [a["id"] for a in ACTIVITIES]
    assert len(ids) == len(set(ids))
