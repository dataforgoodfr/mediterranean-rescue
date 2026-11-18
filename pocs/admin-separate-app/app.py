# /// script
# requires-python = ">=3.12"
# dependencies = ["fastapi[standard]>=0.162.0"]
# ///
"""POC : un seul code, deux apps. Les routes du back-office n'existent que si ADMIN_ENABLED=true.

Sur Clever Cloud, ce seraient deux applications construites depuis le même dépôt : l'API
publique (ADMIN_ENABLED absent) et l'admin, sur sa propre adresse (ADMIN_ENABLED=true).
"""

import os

from fastapi import APIRouter, FastAPI

public = APIRouter(prefix="/api")
admin = APIRouter(prefix="/api/admin")


@public.get("/operations")
def published_operations() -> list[dict[str, str]]:
    return [{"id": "FICTIF-1", "status": "published"}]


@admin.get("/operations")
def operations_to_check() -> list[dict[str, str]]:
    return [{"id": "FICTIF-2", "status": "to_check"}]


def create_app(admin_enabled: bool) -> FastAPI:
    app = FastAPI(title="POC : admin dans une app séparée")
    app.include_router(public)
    # Le routeur d'admin n'est même pas monté : rien à attaquer sur l'app publique.
    if admin_enabled:
        app.include_router(admin)
    return app


app = create_app(os.environ.get("ADMIN_ENABLED", "false").lower() == "true")
