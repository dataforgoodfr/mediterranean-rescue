# L'image de l'API, d'après le guide officiel d'uv : https://docs.astral.sh/uv/guides/integration/docker/
FROM python:3.15-slim

COPY --from=ghcr.io/astral-sh/uv:0.13.7 /uv /uvx /bin/

# Le Python de l'image, des fichiers .pyc prêts, et les paquets copiés plutôt que liés.
ENV UV_PYTHON_DOWNLOADS=0 UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy

WORKDIR /app

# Les dépendances d'abord : Docker garde cette couche tant que uv.lock ne change pas.
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --locked --no-dev

COPY . .

# L'API ne tourne pas en root (https://docs.docker.com/build/building/best-practices/#user).
RUN groupadd --system --gid 999 nonroot \
    && useradd --system --gid 999 --uid 999 --create-home nonroot
USER nonroot

ENV PATH="/app/.venv/bin:$PATH"
EXPOSE 8000
# Derrière le proxy de Clever Cloud : --proxy-headers, comme le recommande
# https://fastapi.tiangolo.com/deployment/docker/ . Par défaut, Uvicorn ne fait confiance
# qu'à 127.0.0.1 (https://uvicorn.dev/settings/) ; l'adresse du proxy n'est pas fixe, d'où
# « * ». Aucune route ne s'appuie encore sur l'IP du client ni sur le schéma.
CMD ["fastapi", "run", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips", "*"]
