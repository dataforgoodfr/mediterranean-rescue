"""Test fixtures. By default, an in-memory SQLite database, fresh for each test, stands in for
Postgres. The official pattern: https://sqlmodel.tiangolo.com/tutorial/fastapi/tests/
With `TEST_DATABASE_URL` set, the tests run on that Postgres database instead (as in CI).
A test that needs the database asks for `session` or `client` as a parameter.
"""

import os
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import Engine
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from app.db import engine as app_engine
from app.db import get_session
from app.main import app

# A database reserved for tests: its tables are created at the start and dropped at the end.
TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL")


@pytest.fixture(name="engine", scope="session")
def engine_fixture() -> Iterator[Engine]:
    if TEST_DATABASE_URL is None:
        # In-memory SQLite lives only as long as the engine's single connection.
        yield create_engine(
            "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
        )
        return
    engine = create_engine(TEST_DATABASE_URL)
    # The tables get dropped: never on the app's own database.
    if (engine.url.host, engine.url.port, engine.url.database) == (
        app_engine.url.host,
        app_engine.url.port,
        app_engine.url.database,
    ):
        raise RuntimeError("TEST_DATABASE_URL must not point to the app's DATABASE_URL")
    # Dropped first too: a run killed before its teardown leaves tables that create_all
    # would keep as they are, even if a model changed since.
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)  # the tables of the imported models
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
    # Postgres keeps its data between tests: each test runs inside a transaction rolled back at
    # the end. A `commit()` from the code under test only releases a savepoint.
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
