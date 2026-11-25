"""Les fixtures des tests : une base SQLite en mémoire, neuve pour chaque test, à la place de
Postgres. Le motif officiel : https://sqlmodel.tiangolo.com/tutorial/fastapi/tests/
Avec `TEST_DATABASE_URL`, les tests tournent sur cette base Postgres (c'est le cas dans la CI).
Un test qui a besoin de la base demande `session` ou `client` en paramètre.
"""

import os
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import Engine
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

# Forcer le mode développement pour les tests,
# avant les imports pour que ce soit pris en compte pour les endpoints en cours de dev.
os.environ["DEV"] = "true"
from app.db import engine as app_engine
from app.db import get_session
from app.main import app

# Une base réservée aux tests : ses tables sont créées au début et supprimées à la fin.
TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL")


@pytest.fixture(name="engine", scope="session")
def engine_fixture() -> Iterator[Engine]:
    if TEST_DATABASE_URL is None:
        # Le SQLite en mémoire ne vit que le temps de l'unique connexion du moteur.
        yield create_engine(
            "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
        )
        return
    engine = create_engine(TEST_DATABASE_URL)
    # Les tables y sont supprimées : jamais sur la base de l'app.
    if (engine.url.host, engine.url.port, engine.url.database) == (
        app_engine.url.host,
        app_engine.url.port,
        app_engine.url.database,
    ):
        raise RuntimeError("TEST_DATABASE_URL must not point to the app's DATABASE_URL")
    # Supprimées d'abord aussi : un lancement coupé avant la fin laisse des tables que
    # create_all garderait telles quelles, même si un modèle a changé depuis.
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)  # les tables des modèles importés
    yield engine
    SQLModel.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture(name="session")
def session_fixture(engine: Engine) -> Iterator[Session]:
    if TEST_DATABASE_URL is None:
        SQLModel.metadata.create_all(engine)
        with Session(engine) as session:
            yield session
        SQLModel.metadata.drop_all(engine)
        return
    # Postgres garde ses données d'un test à l'autre : chaque test tourne dans une transaction
    # annulée à la fin. Un `commit()` du code testé ne valide qu'un point de sauvegarde.
    # https://docs.sqlalchemy.org/en/21/orm/session_transaction.html#joining-a-session-into-an-external-transaction-such-as-for-test-suites
    with engine.connect() as connection:
        transaction = connection.begin()
        with Session(bind=connection, join_transaction_mode="create_savepoint") as session:
            yield session
        transaction.rollback()


@pytest.fixture(name="client")
def client_fixture(session: Session) -> Iterator[TestClient]:
    app.dependency_overrides[get_session] = lambda: session
    yield TestClient(app)
    app.dependency_overrides.clear()
