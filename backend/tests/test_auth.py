"""US01 (inscription) et US02 (connexion, routes protégées)."""

import json
from pathlib import Path

import pytest
from sqlalchemy import select

from app.db import get_db
from app.main import app
from app.models import User
from tests.conftest import auth_headers

CONTRACTS = Path(__file__).resolve().parents[2] / "contracts"
CREDENTIALS = {"email": "voyageur@example.com", "password": "motdepasse123"}
TRIP = {
    "destination": "Rome",
    "departure_date": "2030-12-12",
    "return_date": "2030-12-16",
    "travelers": 2,
    "budget": 1500,
}


def test_register_returns_201_without_password(anon_client):
    r = anon_client.post("/auth/register", json=CREDENTIALS)
    assert r.status_code == 201
    body = r.json()
    assert body["email"] == CREDENTIALS["email"]
    assert set(body) == {"id", "email", "created_at"}


def test_register_matches_contract_example(anon_client):
    if not CONTRACTS.exists():
        pytest.skip("dossier contracts/ absent (exécution dans l'image Docker)")
    request = json.loads((CONTRACTS / "auth-register.request.json").read_text("utf-8"))
    expected = json.loads((CONTRACTS / "auth-register.response.json").read_text("utf-8"))
    body = anon_client.post("/auth/register", json=request).json()
    assert set(body) == set(expected)


def test_password_is_stored_hashed(anon_client):
    anon_client.post("/auth/register", json=CREDENTIALS)
    db = next(app.dependency_overrides[get_db]())
    user = db.scalar(select(User))
    assert user.password_hash != CREDENTIALS["password"]
    assert user.password_hash.startswith("$2")


def test_duplicate_email_is_refused_case_insensitive(anon_client):
    anon_client.post("/auth/register", json=CREDENTIALS)
    r = anon_client.post("/auth/register", json={**CREDENTIALS, "email": "Voyageur@Example.com"})
    assert r.status_code == 409


def test_short_password_or_bad_email_is_refused(anon_client):
    assert anon_client.post("/auth/register", json={**CREDENTIALS, "password": "court"}).status_code == 422
    assert anon_client.post("/auth/register", json={**CREDENTIALS, "email": "pas-un-email"}).status_code == 422


def test_login_returns_bearer_token(anon_client):
    anon_client.post("/auth/register", json=CREDENTIALS)
    r = anon_client.post("/auth/login", json=CREDENTIALS)
    assert r.status_code == 200
    assert r.json()["token_type"] == "bearer"
    assert r.json()["access_token"].count(".") == 2


def test_login_with_wrong_password_or_unknown_email_returns_401(anon_client):
    anon_client.post("/auth/register", json=CREDENTIALS)
    assert anon_client.post("/auth/login", json={**CREDENTIALS, "password": "mauvais123"}).status_code == 401
    assert anon_client.post("/auth/login", json={**CREDENTIALS, "email": "x@example.com"}).status_code == 401


def test_me_returns_connected_user(anon_client):
    r = anon_client.get("/auth/me", headers=auth_headers(anon_client))
    assert r.status_code == 200
    assert r.json()["email"] == CREDENTIALS["email"]


def test_protected_routes_refuse_missing_or_invalid_token(anon_client):
    bad = {"Authorization": "Bearer pas.un.jeton"}
    for headers in ({}, bad):
        assert anon_client.get("/trips", headers=headers).status_code == 401
        assert anon_client.post("/trips", json=TRIP, headers=headers).status_code == 401
        assert anon_client.get("/trips/1", headers=headers).status_code == 401
        assert anon_client.post("/itineraries/generate", json={"trip_id": 1}, headers=headers).status_code == 401
        assert anon_client.get("/auth/me", headers=headers).status_code == 401


def test_mock_catalogue_stays_public(anon_client):
    assert anon_client.get("/mock/cities").status_code == 200


def test_users_only_see_their_own_trips(anon_client):
    alice = auth_headers(anon_client, "alice@example.com")
    bob = auth_headers(anon_client, "bob@example.com")
    trip_id = anon_client.post("/trips", json=TRIP, headers=alice).json()["id"]

    assert [t["id"] for t in anon_client.get("/trips", headers=alice).json()] == [trip_id]
    assert anon_client.get("/trips", headers=bob).json() == []
    assert anon_client.get(f"/trips/{trip_id}", headers=bob).status_code == 404
    r = anon_client.post("/itineraries/generate", json={"trip_id": trip_id}, headers=bob)
    assert r.status_code == 404
    assert anon_client.get(f"/trips/{trip_id}/itinerary", headers=bob).status_code == 404
