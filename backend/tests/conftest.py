"""Les fixtures des tests : une base SQLite en mémoire, neuve pour chaque test, à la place de
Postgres. Le motif officiel : https://sqlmodel.tiangolo.com/tutorial/fastapi/tests/
Un test qui a besoin de la base demande `session` ou `client` en paramètre.
"""

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from app.db import get_session
from app.main import app


@pytest.fixture(name="session")
def session_fixture():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    SQLModel.metadata.create_all(engine)  # les tables des modèles importés
    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(session: Session):
    app.dependency_overrides[get_session] = lambda: session
    yield TestClient(app)
    app.dependency_overrides.clear()
