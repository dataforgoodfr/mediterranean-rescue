# /// script
# requires-python = ">=3.12"
# dependencies = ["psycopg[binary]>=3.2"]
# ///
"""Essaie ce que chaque rôle peut faire dans la base. Lancer : `uv run try_it.py`."""

import os
import sys
import time

import psycopg

PORT = os.environ.get("DB_PORT", "55433")


def connect(role: str) -> psycopg.Connection[tuple[object, ...]]:
    dsn = f"postgresql://{role}:fictif@localhost:{PORT}/rescue_atlas_poc"
    for _ in range(30):
        try:
            return psycopg.connect(dsn, autocommit=True)
        except psycopg.OperationalError:
            time.sleep(1)
    sys.exit(f"Postgres ne répond pas pour {role}")


def attempt(conn: psycopg.Connection[tuple[object, ...]], sql: str) -> str:
    try:
        cursor = conn.execute(sql)
        rows = cursor.fetchall() if sql.lstrip().startswith("SELECT") else []
        return f"accepté {rows}" if rows else "accepté"
    except psycopg.errors.InsufficientPrivilege as error:
        return f"refusé ({error.diag.message_primary})"


public = connect("public_api")
admin = connect("admin_api")

CASES = [
    # (rôle, requête, début de réponse attendu, ce que le cas montre)
    (
        public,
        "SELECT id FROM published_operation ORDER BY id",
        "accepté",
        "public lit la vue",
    ),
    (public, "SELECT id FROM operation", "refusé", "public lit la table"),
    (
        public,
        "UPDATE published_operation SET label = 'x'",
        "refusé",
        "public modifie la vue",
    ),
    (public, "DELETE FROM operation", "refusé", "public supprime"),
    (
        admin,
        "UPDATE operation SET status = 'published' WHERE id = 'FICTIF-3'",
        "accepté",
        "admin publie FICTIF-3",
    ),
    (
        public,
        "SELECT id FROM published_operation ORDER BY id",
        "accepté",
        "public voit FICTIF-3 publiée",
    ),
    (admin, "DROP TABLE operation", "refusé", "admin supprime la table"),
    (
        admin,
        "UPDATE operation SET status = 'to_check' WHERE id = 'FICTIF-3'",
        "accepté",
        "admin remet FICTIF-3 à vérifier",
    ),
]

results = []
for conn, sql, expected, label in CASES:
    answer = attempt(conn, sql)
    ok = answer.startswith(expected)
    results.append(ok)
    print(f"{'OK ' if ok else 'KO '} {label} : {answer}")
sys.exit(0 if all(results) else 1)
