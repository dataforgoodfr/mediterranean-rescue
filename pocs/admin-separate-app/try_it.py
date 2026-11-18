# /// script
# requires-python = ">=3.12"
# dependencies = ["fastapi[standard]>=0.162.0"]
# ///
"""Construit les deux apps et vérifie ce que chacune expose. Lancer : `uv run try_it.py`."""

import sys

from app import create_app
from fastapi.testclient import TestClient

CASES = [
    # (app, chemin, code attendu)
    ("publique", "/api/operations", 200),
    ("publique", "/api/admin/operations", 404),
    ("publique", "/docs", 200),
    ("admin", "/api/operations", 200),
    ("admin", "/api/admin/operations", 200),
]

clients = {
    "publique": TestClient(create_app(admin_enabled=False)),
    "admin": TestClient(create_app(admin_enabled=True)),
}
results = []
for name, path, expected in CASES:
    status = clients[name].get(path).status_code
    ok = status == expected
    results.append(ok)
    print(f"{'OK ' if ok else 'KO '} app {name}, {path} : {status}")

# Le schéma OpenAPI de l'app publique ne mentionne aucune route d'admin.
paths = clients["publique"].get("/openapi.json").json()["paths"]
hidden = not any(path.startswith("/api/admin") for path in paths)
results.append(hidden)
print(
    f"{'OK ' if hidden else 'KO '} app publique, OpenAPI sans /api/admin : {sorted(paths)}"
)
sys.exit(0 if all(results) else 1)
