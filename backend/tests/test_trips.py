from datetime import date, timedelta


def payload(**over):
    base = {
        "destination": "Paris",
        "departure_date": (date.today() + timedelta(days=30)).isoformat(),
        "return_date": (date.today() + timedelta(days=37)).isoformat(),
        "travelers": 2,
        "budget": 1500,
    }
    base.update(over)
    return base


def test_valid_request_saved_and_id_returned(client):
    r = client.post("/trips", json=payload())
    assert r.status_code == 201
    body = r.json()
    assert isinstance(body["id"], int)
    assert body["destination"] == "Paris"
    assert client.get(f"/trips/{body['id']}").json()["budget"] == 1500


def test_destination_case_insensitive(client):
    assert client.post("/trips", json=payload(destination="  rome ")).json()["destination"] == "Rome"


def test_past_departure_rejected(client):
    r = client.post("/trips", json=payload(
        departure_date=(date.today() - timedelta(days=1)).isoformat()))
    assert r.status_code == 422


def test_return_before_departure_rejected(client):
    r = client.post("/trips", json=payload(
        return_date=(date.today() + timedelta(days=10)).isoformat()))
    assert r.status_code == 422


def test_zero_or_negative_budget_rejected(client):
    assert client.post("/trips", json=payload(budget=0)).status_code == 422
    assert client.post("/trips", json=payload(budget=-50)).status_code == 422


def test_unknown_destination_rejected(client):
    assert client.post("/trips", json=payload(destination="Atlantide")).status_code == 422


def test_travelers_bounds(client):
    assert client.post("/trips", json=payload(travelers=0)).status_code == 422
    assert client.post("/trips", json=payload(travelers=11)).status_code == 422


def test_trip_not_found(client):
    assert client.get("/trips/9999").status_code == 404
