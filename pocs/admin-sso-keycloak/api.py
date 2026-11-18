# /// script
# requires-python = ">=3.12"
# dependencies = ["fastapi[standard]>=0.162.0", "pyjwt[crypto]>=2.15.1"]
# ///
"""POC : protéger les routes d'admin de l'API par un jeton Keycloak (OIDC).

L'API ne gère aucun mot de passe : elle vérifie seulement le jeton que Keycloak a signé
(signature, émetteur, audience, expiration), puis le rôle. Lancer : `uv run api.py`.
"""

import os
from typing import Annotated

import jwt
import uvicorn
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

ISSUER = os.environ.get(
    "KEYCLOAK_ISSUER", "http://localhost:8081/realms/rescue-atlas-poc"
)
AUDIENCE = "rescue-atlas-api"
ADMIN_ROLE = "data-provider"

# Les clés publiques de Keycloak, mises en cache par PyJWT :
# https://pyjwt.readthedocs.io/en/stable/usage.html
jwks = jwt.PyJWKClient(f"{ISSUER}/protocol/openid-connect/certs")
bearer = HTTPBearer(auto_error=False)
app = FastAPI(title="POC : back-office protégé par Keycloak")


def unauthorized(detail: str) -> HTTPException:
    return HTTPException(
        status.HTTP_401_UNAUTHORIZED, detail, headers={"WWW-Authenticate": "Bearer"}
    )


def token_claims(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
) -> dict[str, object]:
    if credentials is None:
        raise unauthorized("Jeton manquant")
    token = credentials.credentials
    try:
        key = jwks.get_signing_key_from_jwt(token)
        claims: dict[str, object] = jwt.decode(
            token, key, algorithms=["RS256"], audience=AUDIENCE, issuer=ISSUER
        )
    except jwt.PyJWTError as error:
        raise unauthorized(f"Jeton refusé : {error}") from error
    return claims


def realm_roles(claims: dict[str, object]) -> list[str]:
    # Keycloak range les rôles du realm dans `realm_access.roles`.
    realm_access = claims.get("realm_access")
    if not isinstance(realm_access, dict):
        return []
    roles = realm_access.get("roles")
    if not isinstance(roles, list):
        return []
    return [role for role in roles if isinstance(role, str)]


def data_provider(
    claims: Annotated[dict[str, object], Depends(token_claims)],
) -> dict[str, object]:
    if ADMIN_ROLE not in realm_roles(claims):
        raise HTTPException(status.HTTP_403_FORBIDDEN, f"Rôle {ADMIN_ROLE} requis")
    return claims


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/admin/me")
def admin_me(
    claims: Annotated[dict[str, object], Depends(data_provider)],
) -> dict[str, object]:
    return {"user": claims.get("preferred_username"), "roles": realm_roles(claims)}


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=int(os.environ.get("API_PORT", "8090")))
