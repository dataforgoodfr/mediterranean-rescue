"""L'application FastAPI. Sa doc interactive est sur /api/docs quand le serveur tourne."""

from fastapi import FastAPI

# Tout est sous /api : c'est le seul chemin que Vite (en dev) et Traefik (en prod) envoient à
# l'API. https://fastapi.tiangolo.com/tutorial/metadata/#docs-urls
app = FastAPI(
    title="Rescue Atlas",
    docs_url="/api/docs",
    redoc_url=None,
    openapi_url="/api/openapi.json",
)


@app.get("/api/health")
def health() -> dict[str, str]:
    """Répond tant que le serveur tourne, sans toucher à la base."""
    return {"status": "ok"}
