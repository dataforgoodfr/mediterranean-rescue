"""Écrire le schéma OpenAPI de l'API dans backend/openapi.json. Le frontend en tire ses types
(`pnpm api:types`) : le front et le back décrivent ainsi les mêmes données.

    uv run python -m app.schema_openapi

Le fichier est versionné, et un test vérifie qu'il suit l'API. Méthode de FastAPI :
https://fastapi.tiangolo.com/advanced/generate-clients/
"""

import json
from pathlib import Path

from app.main import app

FICHIER = Path(__file__).resolve().parents[1] / "openapi.json"


def schema_en_texte() -> str:
    # Clés triées et indentation fixe : le fichier ne change que si l'API change.
    return json.dumps(app.openapi(), indent=2, ensure_ascii=False, sort_keys=True) + "\n"


if __name__ == "__main__":
    FICHIER.write_text(schema_en_texte(), encoding="utf-8", newline="\n")
    print(f"schéma écrit dans {FICHIER.name}")
