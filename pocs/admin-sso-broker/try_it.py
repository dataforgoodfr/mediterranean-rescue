# /// script
# requires-python = ">=3.12"
# dependencies = ["httpx>=0.28", "pyjwt>=2.15.1"]
# ///
"""Joue la connexion d'une personne de SOS, comme un navigateur. Lancer : `uv run try_it.py`.

Parcours : le back-office demande une connexion à notre Keycloak, qui renvoie vers le
fournisseur de SOS (kc_idp_hint) ; la personne s'y connecte ; notre Keycloak crée son compte au
premier passage, lui donne ou non le rôle selon son groupe chez SOS, et rend un jeton.
"""

import base64
import hashlib
import html
import re
import secrets
import sys
import time
from urllib.parse import parse_qs, urljoin, urlparse

import httpx
import jwt

KEYCLOAK = "http://localhost:8082"
OURS = f"{KEYCLOAK}/realms/rescue-atlas-poc/protocol/openid-connect"
REDIRECT = "http://localhost:5173/callback"


def wait_for_keycloak() -> None:
    url = f"{KEYCLOAK}/realms/rescue-atlas-poc/.well-known/openid-configuration"
    for _ in range(60):
        try:
            if httpx.get(url).status_code == 200:
                return
        except httpx.TransportError:
            pass
        time.sleep(2)
    sys.exit(f"Keycloak ne répond pas sur {url}")


class Browser:
    """Un navigateur minimal : garde les cookies par chemin, comme un vrai.

    Keycloak marque ses cookies `Secure` ; httpx ne les renvoie pas sur http, alors qu'un
    navigateur le fait sur localhost. On les gère donc ici, à la main.
    """

    def __init__(self) -> None:
        self.client = httpx.Client()
        self.jar: dict[tuple[str, str], str] = {}

    def request(
        self, method: str, url: str, **kwargs: dict[str, str]
    ) -> httpx.Response:
        path = urlparse(url).path
        sent = {
            name: value
            for (prefix, name), value in self.jar.items()
            if path.startswith(prefix)
        }
        self.client.cookies.clear()
        headers = (
            {"Cookie": "; ".join(f"{k}={v}" for k, v in sent.items())} if sent else {}
        )
        response = self.client.request(method, url, headers=headers, **kwargs)
        for header in response.headers.get_list("set-cookie"):
            name, _, rest = header.partition("=")
            value = rest.split(";", 1)[0]
            match = re.search(r";\s*path=([^;]+)", header, re.IGNORECASE)
            key = (match.group(1).strip() if match else "/", name)
            if "max-age=0" in header.lower() or not value:
                self.jar.pop(key, None)
            else:
                self.jar[key] = value
        return response


def follow_until_callback(
    browser: Browser, response: httpx.Response
) -> str | httpx.Response:
    """Suit les redirections ; rend le code si on revient au back-office, sinon la page."""
    while response.is_redirect:
        location = urljoin(str(response.url), response.headers["location"])
        if location.startswith(REDIRECT):
            code = parse_qs(urlparse(location).query).get("code", [""])[0]
            return code
        response = browser.request("GET", location)
    return response


def login_through_sos(username: str) -> dict[str, object]:
    verifier = secrets.token_urlsafe(48)
    digest = hashlib.sha256(verifier.encode()).digest()
    challenge = base64.urlsafe_b64encode(digest).rstrip(b"=").decode()
    browser = Browser()
    start = browser.request(
        "GET",
        f"{OURS}/auth",
        params={
            "client_id": "rescue-atlas-admin",
            "response_type": "code",
            "redirect_uri": REDIRECT,
            "scope": "openid",
            "code_challenge": challenge,
            "code_challenge_method": "S256",
            "kc_idp_hint": "sos-fictif",
        },
    )
    page = follow_until_callback(browser, start)
    if isinstance(page, str):
        sys.exit("Connecté sans formulaire : il reste une session d'un essai précédent")
    if "/realms/sos-fictif/" not in str(page.url):
        sys.exit(f"Pas renvoyé vers le fournisseur de SOS : {page.url}")
    action = re.search(r'id="kc-form-login"[^>]*action="([^"]+)"', page.text)
    if action is None:
        sys.exit("Formulaire de connexion de SOS introuvable")
    posted = browser.request(
        "POST",
        html.unescape(action.group(1)),
        data={"username": username, "password": "fictif"},
    )
    code = follow_until_callback(browser, posted)
    if not isinstance(code, str) or not code:
        page_text = code.text[:300] if isinstance(code, httpx.Response) else ""
        sys.exit(f"Pas de retour au back-office pour {username} : {page_text}")
    tokens = browser.request(
        "POST",
        f"{OURS}/token",
        data={
            "grant_type": "authorization_code",
            "client_id": "rescue-atlas-admin",
            "code": code,
            "redirect_uri": REDIRECT,
            "code_verifier": verifier,
        },
    )
    tokens.raise_for_status()
    access_token = tokens.json()["access_token"]
    # Lecture seule du contenu, pour l'affichage : la vérification de la signature est
    # montrée dans pocs/admin-sso-keycloak.
    claims: dict[str, object] = jwt.decode(
        access_token, options={"verify_signature": False}
    )
    return claims


def roles(claims: dict[str, object]) -> list[str]:
    realm_access = claims.get("realm_access")
    values = realm_access.get("roles") if isinstance(realm_access, dict) else None
    return (
        [role for role in values if isinstance(role, str)]
        if isinstance(values, list)
        else []
    )


def set_magda_in_group(member: bool) -> None:
    """Ce que ferait l'admin de SOS chez lui : ajouter ou retirer magda du groupe."""
    admin = httpx.post(
        f"{KEYCLOAK}/realms/master/protocol/openid-connect/token",
        data={
            "grant_type": "password",
            "client_id": "admin-cli",
            "username": "admin",
            "password": "admin-fictif",
        },
    ).json()["access_token"]
    api = httpx.Client(
        base_url=f"{KEYCLOAK}/admin/realms/sos-fictif",
        headers={"Authorization": f"Bearer {admin}"},
    )
    user_id = api.get("/users", params={"username": "magda", "exact": "true"}).json()[
        0
    ]["id"]
    group_id = api.get(
        "/groups", params={"search": "rescue-atlas-data-providers"}
    ).json()[0]["id"]
    method = "PUT" if member else "DELETE"
    api.request(method, f"/users/{user_id}/groups/{group_id}").raise_for_status()


def check(label: str, username: str, expected: bool) -> bool:
    claims = login_through_sos(username)
    has_role = "data-provider" in roles(claims)
    ok = has_role == expected
    print(
        f"{'OK ' if ok else 'KO '} {label} : émetteur {claims.get('iss')}, "
        f"compte {claims.get('preferred_username')}, data-provider={has_role}"
    )
    return ok


wait_for_keycloak()
results = [
    check("magda, dans le groupe chez SOS", "magda", True),
    check("marin, hors du groupe chez SOS", "marin", False),
]
set_magda_in_group(False)
results.append(
    check("magda, retirée du groupe chez SOS, se reconnecte", "magda", False)
)
set_magda_in_group(True)
results.append(check("magda, remise dans le groupe, se reconnecte", "magda", True))
sys.exit(0 if all(results) else 1)
