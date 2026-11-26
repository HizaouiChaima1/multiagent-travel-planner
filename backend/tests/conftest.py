import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db import Base, get_db
from app.main import app


@pytest.fixture()
def anon_client():
    """Client sans jeton, sur une base SQLite en mémoire propre à chaque test."""
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)

    def override_get_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def auth_headers(client, email="voyageur@example.com", password="motdepasse123"):
    """Inscrit puis connecte un utilisateur ; renvoie l'en-tête Authorization."""
    client.post("/auth/register", json={"email": email, "password": password})
    token = client.post("/auth/login", json={"email": email, "password": password}).json()
    return {"Authorization": f"Bearer {token['access_token']}"}


@pytest.fixture()
def client(anon_client):
    """Client connecté (US02) : les routes protégées l'acceptent."""
    anon_client.headers.update(auth_headers(anon_client))
    return anon_client
