"""Le point d'entrée d'Alembic : il relie les migrations aux modèles et à la base.

Deux façons de l'appeler :
- `uv run alembic ...` dans backend/ : la base vient de DATABASE_URL (app/config.py) ;
- `upgrade_database(engine)` (app/migrate.py) : la connexion arrive par `config.attributes`,
  selon la recette officielle :
  https://alembic.sqlalchemy.org/en/latest/cookbook.html#sharing-a-connection-across-one-or-more-programmatic-migration-commands
"""

from typing import Literal

from alembic import context
from alembic.autogenerate.api import AutogenContext
from sqlalchemy import Connection
from sqlmodel import SQLModel, create_engine
from sqlmodel.sql.sqltypes import AutoString

import app.models  # noqa: F401 (enregistre les tables dans SQLModel.metadata)
from app.config import settings


def render_item(type_: str, obj: object, autogen_context: AutogenContext) -> str | Literal[False]:
    """Écrit le texte de SQLModel (AutoString) en `sa.String` dans une migration générée : le
    fichier n'a alors pas à importer sqlmodel, et reste lisible sans lui."""
    if type_ == "type" and isinstance(obj, AutoString):
        return f"sa.String(length={obj.length})" if obj.length else "sa.String()"
    return False  # le rendu par défaut d'Alembic


def run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=SQLModel.metadata,
        render_item=render_item,
        # SQLite (les tests) ne sait pas modifier une colonne : le mode « batch » recrée la table.
        # https://alembic.sqlalchemy.org/en/latest/batch.html
        render_as_batch=True,
    )
    with context.begin_transaction():
        context.run_migrations()


if context.is_offline_mode():
    raise RuntimeError("offline mode (--sql) is not supported: run against a database")

shared_connection = context.config.attributes.get("connection")
if isinstance(shared_connection, Connection):
    run_migrations(shared_connection)
else:
    engine = create_engine(settings.database_url)
    with engine.connect() as connection:
        run_migrations(connection)
    engine.dispose()
