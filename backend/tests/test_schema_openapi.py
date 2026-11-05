"""Le schéma OpenAPI versionné (backend/openapi.json) suit exactement l'API. Le frontend en
tire ses types : si l'API change sans que le fichier soit régénéré, ce test échoue."""

from app.schema_openapi import FICHIER, schema_en_texte


def test_le_schema_versionne_est_celui_de_l_api() -> None:
    assert FICHIER.read_text(encoding="utf-8") == schema_en_texte(), (
        "backend/openapi.json est en retard sur l'API : lance `uv run python -m app.schema_openapi`"
    )
