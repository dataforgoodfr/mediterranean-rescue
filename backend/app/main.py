"""L'application FastAPI. Sa doc interactive est sur /api/docs quand le serveur tourne."""

from typing import Literal

from fastapi import FastAPI
from pydantic import BaseModel

# Tout est sous /api : c'est le seul chemin que Vite (en dev) et Clever Cloud (en prod) envoient à
# l'API. https://fastapi.tiangolo.com/tutorial/metadata/#docs-urls
app = FastAPI(
    title="Rescue Atlas",
    docs_url="/api/docs",
    redoc_url=None,
    openapi_url="/api/openapi.json",
)


class Sante(BaseModel):
    status: Literal["ok"]


@app.get("/api/health")
def health() -> Sante:
    """Répond tant que le serveur tourne, sans toucher à la base."""
    return Sante(status="ok")
