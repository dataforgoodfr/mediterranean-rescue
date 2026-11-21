# /// script
# requires-python = ">=3.12"
# dependencies = ["fastapi[standard]>=0.162.0"]
# ///
"""Simule un proxy de Clever Cloud et un attaquant. Lancer : `uv run try_it.py`.

Toutes les adresses sont des adresses de documentation (RFC 5737), aucune n'est réelle.
"""

import sys

from app import create_app
from fastapi.testclient import TestClient

PROXY = "192.0.2.10"  # un proxy de Clever Cloud, listé dans CC_REVERSE_PROXY_IPS
OFFICE = "198.51.100.7"  # l'IP de sortie autorisée (le bureau de SOS, par exemple)
ATTACKER = "203.0.113.66"

app = create_app(trusted_proxies=[PROXY], admin_ips=[OFFICE])

CASES = [
    # (qui se connecte, X-Forwarded-For, code attendu, ce que le cas montre)
    (PROXY, OFFICE, 200, "le bureau, via le proxy"),
    (PROXY, ATTACKER, 403, "un inconnu, via le proxy"),
    (
        ATTACKER,
        OFFICE,
        403,
        "un inconnu qui écrit l'IP du bureau sans passer par le proxy",
    ),
    (
        PROXY,
        f"{OFFICE}, {ATTACKER}",
        403,
        "un inconnu qui glisse l'IP du bureau devant la sienne",
    ),
    (PROXY, None, 403, "le proxy lui-même, sans en-tête"),
]

results = []
for peer, forwarded, expected, label in CASES:
    client = TestClient(app, client=(peer, 50000))
    headers = {"X-Forwarded-For": forwarded} if forwarded else {}
    response = client.get("/api/admin/whoami", headers=headers)
    ok = response.status_code == expected
    results.append(ok)
    print(f"{'OK ' if ok else 'KO '} {label} : {response.status_code} {response.text}")
sys.exit(0 if all(results) else 1)
