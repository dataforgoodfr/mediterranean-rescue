# /// script
# requires-python = ">=3.12"
# dependencies = ["fastapi[standard]>=0.162.0"]
# ///
"""POC : réserver l'admin à quelques adresses IP, derrière les proxys de Clever Cloud.

Derrière un proxy, l'IP qui se connecte est celle du proxy. La vraie IP du client arrive dans
l'en-tête X-Forwarded-For, que n'importe qui peut aussi écrire. On ne le croit donc que s'il
vient d'un proxy de confiance : Clever Cloud en donne la liste dans CC_REVERSE_PROXY_IPS.
C'est le middleware d'uvicorn qui fait ce tri (il garde la première IP non fiable en partant de
la droite) : on ne réécrit pas cette logique.
"""

import os
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, Request, status
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware


def split(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


def create_app(trusted_proxies: list[str], admin_ips: list[str]) -> FastAPI:
    app = FastAPI(title="POC : admin filtrée par IP")

    def allowed_ip(request: Request) -> str:
        client = request.client.host if request.client else ""
        if client not in admin_ips:
            raise HTTPException(status.HTTP_403_FORBIDDEN, f"IP refusée : {client}")
        return client

    @app.get("/api/admin/whoami")
    def whoami(client: Annotated[str, Depends(allowed_ip)]) -> dict[str, str]:
        return {"client": client}

    app.add_middleware(ProxyHeadersMiddleware, trusted_hosts=trusted_proxies)
    return app


app = create_app(
    split(os.environ.get("CC_REVERSE_PROXY_IPS", "127.0.0.1")),
    split(os.environ.get("ADMIN_ALLOWED_IPS", "")),
)
