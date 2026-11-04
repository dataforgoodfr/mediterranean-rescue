from fastapi.testclient import TestClient
from sqlmodel import Session, text

from app.db import engine


def test_health_answers_ok(client: TestClient):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_api_docs_live_under_api(client: TestClient):
    # Traefik et Vite n'envoient que /api au backend : la doc doit y être.
    assert client.get("/api/docs").status_code == 200
    assert client.get("/api/openapi.json").json()["info"]["title"] == "Rescue Atlas"


def test_database_driver_is_psycopg():
    # Sans se connecter : la vraie base est configurée pour psycopg 3.
    assert engine.url.drivername == "postgresql+psycopg"


def test_test_session_is_a_database(session: Session):
    # La base des tests répond : un test de modèle pourra s'en servir tel quel.
    assert session.exec(text("select 1")).one()[0] == 1
