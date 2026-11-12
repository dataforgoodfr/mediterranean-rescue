"""Écrire le schéma OpenAPI de l'API dans backend/openapi.json. Le frontend en tire ses types
(`pnpm api:types`) : le front et le back décrivent ainsi les mêmes données.

    uv run python -m app.openapi_schema

Le fichier est versionné, et un test vérifie qu'il suit l'API. Méthode de FastAPI :
https://fastapi.tiangolo.com/advanced/generate-clients/
"""

import json
from pathlib import Path

from app.main import app

SCHEMA_FILE = Path(__file__).resolve().parents[1] / "openapi.json"


def schema_as_text() -> str:
    # Clés triées et indentation fixe : le fichier ne change que si l'API change.
    return json.dumps(app.openapi(), indent=2, ensure_ascii=False, sort_keys=True) + "\n"


if __name__ == "__main__":
    SCHEMA_FILE.write_text(schema_as_text(), encoding="utf-8", newline="\n")
    print(f"schema written to {SCHEMA_FILE.name}")
