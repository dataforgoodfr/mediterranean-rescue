# /// script
# requires-python = ">=3.12"
# dependencies = ["httpx>=0.28"]
# ///
"""Rejoue les quatre cas du POC et affiche ce que répond l'API. Lancer : `uv run try_it.py`.

Le jeton est demandé avec le mot de passe (« direct access grant ») pour aller vite. Le vrai
back-office passera par la page de connexion de Keycloak (code d'autorisation et PKCE).
"""

import os
import sys
import time

import httpx

KEYCLOAK = os.environ.get("KEYCLOAK_URL", "http://localhost:8081")
REALM = "rescue-atlas-poc"
API = os.environ.get("API_URL", "http://localhost:8090")
TOKEN_URL = f"{KEYCLOAK}/realms/{REALM}/protocol/openid-connect/token"


def wait_for_keycloak() -> None:
    well_known = f"{KEYCLOAK}/realms/{REALM}/.well-known/openid-configuration"
    for _ in range(60):
        try:
            if httpx.get(well_known).status_code == 200:
                return
        except httpx.TransportError:
            pass
        time.sleep(2)
    sys.exit(f"Keycloak ne répond pas sur {well_known}")


def token_for(username: str) -> str:
    response = httpx.post(
        TOKEN_URL,
        data={
            "grant_type": "password",
            "client_id": "rescue-atlas-admin",
            "username": username,
            "password": "fictif",
        },
    )
    response.raise_for_status()
    token = response.json().get("access_token")
    if not isinstance(token, str):
        sys.exit(f"Pas de jeton pour {username}")
    return token


def call(label: str, token: str | None, expected: int) -> bool:
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    response = httpx.get(f"{API}/api/admin/me", headers=headers)
    ok = response.status_code == expected
    print(f"{'OK ' if ok else 'KO '} {label} : {response.status_code} {response.text}")
    return ok


wait_for_keycloak()
results = [
    call("sans jeton", None, 401),
    call("jeton trafiqué", token_for("magda-fictif")[:-4] + "abcd", 401),
    call("lecteur-fictif, sans le rôle", token_for("lecteur-fictif"), 403),
    call("magda-fictif, rôle data-provider", token_for("magda-fictif"), 200),
]
sys.exit(0 if all(results) else 1)
