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


@pytest.mark.parametrize("scheme", ["postgresql", "postgres"])
def test_a_plain_postgres_url_uses_psycopg(monkeypatch: pytest.MonkeyPatch, scheme: str) -> None:
    # Un hébergeur donne l'adresse en postgresql:// (ou postgres://) : pilote psycopg 3.
    monkeypatch.setenv("DATABASE_URL", f"{scheme}://user:pass@db.example:5432/staging")

    settings = Settings(_env_file=None)

    assert settings.database_url == "postgresql+psycopg://user:pass@db.example:5432/staging"
