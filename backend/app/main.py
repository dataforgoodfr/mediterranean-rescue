"""L'application FastAPI. Sa doc interactive est sur /api/docs quand le serveur tourne."""

from typing import Literal

from fastapi import FastAPI
from pydantic import BaseModel

# Tout est sous /api : c'est le seul chemin que Vite (en dev) et Traefik (en prod) envoient à
# l'API. https://fastapi.tiangolo.com/tutorial/metadata/#docs-urls
app = FastAPI(
    title="Rescue Atlas",
    docs_url="/api/docs",
    redoc_url=None,
    openapi_url="/api/openapi.json",
)


class Health(BaseModel):
    status: Literal["ok"]


@app.get("/api/health")
def health() -> Health:
    """Answers while the server runs, without touching the database."""
    return Health(status="ok")
