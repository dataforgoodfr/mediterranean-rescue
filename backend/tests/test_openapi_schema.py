"""Le schéma OpenAPI versionné (backend/openapi.json) suit exactement l'API. Le frontend en
tire ses types : si l'API change sans que le fichier soit régénéré, ce test échoue."""

from app.openapi_schema import SCHEMA_FILE, schema_as_text


def test_committed_schema_matches_api() -> None:
    assert SCHEMA_FILE.read_text(encoding="utf-8") == schema_as_text(), (
        "backend/openapi.json is behind the API: run `uv run python -m app.openapi_schema`"
    )
