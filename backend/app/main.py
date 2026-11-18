"""L'application FastAPI. Sa doc interactive est sur /api/docs quand le serveur tourne."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Literal

from fastapi import FastAPI
from pydantic import BaseModel

from app.db import engine
from app.models import create_tables


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    # Les tables sont créées au démarrage : https://fastapi.tiangolo.com/advanced/events/#lifespan
    create_tables(engine)
    yield


# Tout est sous /api : c'est le seul chemin que Vite (en dev) et Clever Cloud (en prod) envoient à
# l'API. https://fastapi.tiangolo.com/tutorial/metadata/#docs-urls
app = FastAPI(
    lifespan=lifespan,
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
