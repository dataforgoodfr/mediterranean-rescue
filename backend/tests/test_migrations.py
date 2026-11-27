"""Les migrations (app/migrate.py) : une base vide comme une base créée avant Alembic arrivent au
schéma des modèles, sans perdre leurs données.

Elles tournent sur un SQLite en mémoire, même dans la CI : chaque test a besoin d'une base neuve,
que la base Postgres partagée des autres tests ne donne pas.
"""

from collections.abc import Iterator

import pytest
from alembic.autogenerate import compare_metadata
from alembic.runtime.migration import MigrationContext
from alembic.script import ScriptDirectory
from sqlalchemy import Engine, text
from sqlmodel import Session, SQLModel, create_engine, select
from sqlmodel.pool import StaticPool

from app.migrate import INITIAL_REVISION, alembic_config, upgrade_database
from app.models import Operation


@pytest.fixture(name="empty_engine")
def empty_engine_fixture() -> Iterator[Engine]:
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    yield engine
    engine.dispose()


def schema_differences(engine: Engine) -> list[object]:
    """Ce qui sépare la base des modèles, selon Alembic : vide si elle les suit."""
    with engine.connect() as connection:
        return list(compare_metadata(MigrationContext.configure(connection), SQLModel.metadata))


def current_revision(engine: Engine) -> str | None:
    with engine.connect() as connection:
        return MigrationContext.configure(connection).get_current_revision()


def head_revision() -> str | None:
    return ScriptDirectory.from_config(alembic_config()).get_current_head()


def test_migrations_build_the_models_schema_on_an_empty_database(empty_engine: Engine) -> None:
    upgrade_database(empty_engine)

    assert schema_differences(empty_engine) == []
    assert current_revision(empty_engine) == head_revision()


def test_a_database_created_before_alembic_is_upgraded_and_keeps_its_data(
    empty_engine: Engine,
) -> None:
    # On crée la base jusqu'à la première migration, comme si elle existait avant Alembic.
    upgrade_database(empty_engine, INITIAL_REVISION)
    with empty_engine.connect() as connection:
        # on drop la table Alembic pour simuler une base créée avant Alembic
        connection.execute(text("DROP TABLE alembic_version"))
        # on insère manuellement pour correspondre au modèle de la révision initiale
        connection.execute(
            text(
                "INSERT INTO operation (date, operation_type, nb_ops) "
                "VALUES ('2026-01-02', 'rescue', 1)"
            )
        )
        connection.commit()

    upgrade_database(empty_engine)

    assert current_revision(empty_engine) == head_revision()
    assert schema_differences(empty_engine) == []
    with Session(empty_engine) as session:
        assert len(session.exec(select(Operation)).all()) == 1


def test_upgrading_twice_changes_nothing(empty_engine: Engine) -> None:
    upgrade_database(empty_engine)
    upgrade_database(empty_engine)

    assert current_revision(empty_engine) == head_revision()
