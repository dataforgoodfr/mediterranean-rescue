"""L'application FastAPI. Sa doc interactive est sur /api/docs quand le serveur tourne."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Literal

from fastapi import FastAPI
from pydantic import BaseModel

from app.db import engine
from app.migrate import upgrade_database
from app.routers import operations


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    # La base est mise à jour au démarrage (app/migrate.py) :
    # https://fastapi.tiangolo.com/advanced/events/#lifespan
    upgrade_database(engine)
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


# Chaque domaine a ses routes dans app/routers/ : https://fastapi.tiangolo.com/tutorial/bigger-applications/
app.include_router(operations.router)
