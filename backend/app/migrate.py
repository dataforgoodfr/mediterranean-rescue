"""Met la base à jour au démarrage, avec les migrations d'Alembic (migrations/).

À la main, depuis backend/ : `uv run python -m app.migrate`.

Une base créée avant Alembic (par create_all) a déjà la table de la première migration, mais pas
la table `alembic_version` : elle est marquée à cette migration (stamp), puis mise à jour comme
les autres. Elle n'est ni vidée ni recréée.
"""

from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import Engine, inspect

# La configuration d'Alembic est dans pyproject.toml ([tool.alembic]).
PYPROJECT = Path(__file__).resolve().parent.parent / "pyproject.toml"

# La migration qui reproduit le schéma de create_all, et une table qu'elle crée.
INITIAL_REVISION = "0001"
INITIAL_TABLE = "operation"


def alembic_config() -> Config:
    return Config(toml_file=str(PYPROJECT))


def upgrade_database(engine: Engine, revision: str = "head") -> None:
    """Applique les migrations qui manquent, dans une seule transaction."""
    config = alembic_config()
    with engine.begin() as connection:
        config.attributes["connection"] = connection
        tables = inspect(connection)
        if not tables.has_table("alembic_version") and tables.has_table(INITIAL_TABLE):
            command.stamp(config, INITIAL_REVISION)
        command.upgrade(config, revision)


if __name__ == "__main__":
    from app.db import engine

    upgrade_database(engine)
    print(f"base à jour : {engine.url.render_as_string(hide_password=True)}")
