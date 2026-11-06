from pathlib import Path

import pytest

from app.config import Settings


def test_unknown_key_in_env_file_is_ignored(tmp_path: Path) -> None:
    # Un `.env` copié depuis la racine contient d'autres clés (DB_PORT…) : le backend démarre.
    env_file = tmp_path / ".env"
    env_file.write_text(
        "DB_PORT=55432\n"
        "DATABASE_URL=postgresql+psycopg://rescue:rescue@localhost:55432/rescue_atlas\n"
    )

    settings = Settings(_env_file=env_file)

    assert settings.database_url.endswith(":55432/rescue_atlas")


def test_reads_the_clever_cloud_database(monkeypatch: pytest.MonkeyPatch) -> None:
    # Clever Cloud donne la base liée dans POSTGRESQL_ADDON_URI, en postgresql:// (pilote psycopg2,
    # qu'on n'installe pas) : le backend la prend et passe au pilote psycopg 3.
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.setenv("POSTGRESQL_ADDON_URI", "postgresql://user:pass@db.example:5432/staging")

    settings = Settings(_env_file=None)

    assert settings.database_url == "postgresql+psycopg://user:pass@db.example:5432/staging"


def test_database_url_wins_over_clever_cloud(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("DATABASE_URL", "postgresql+psycopg://a:b@localhost:5432/local")
    monkeypatch.setenv("POSTGRESQL_ADDON_URI", "postgresql://user:pass@db.example:5432/staging")

    settings = Settings(_env_file=None)

    assert settings.database_url == "postgresql+psycopg://a:b@localhost:5432/local"
