"""Confronter les ports de débarquement écrits à la main dans l'export de l'ancienne
carte (colonne `Port_disembarkation`, texte libre, docs/donnees.md) à la liste des
ports connus.

    uv run python -m app.ports \
        "../data/Data dashboard - Data_operations.csv" \
        "../data/Data dashboard - Data_ports.csv"

Le rapport liste les variantes non reconnues avec leur nombre de lignes : les plus
fréquentes sont les premières à ajouter dans ALIASES.
"""

import argparse
import csv
import io
from collections import Counter
from pathlib import Path

# Une variante écrite dans l'export, et le port qu'elle désigne.
ALIASES: dict[str, str] = {
    "Anconna": "Ancona",
    "Ravena": "Ravenna",
}

PORT_COLUMN = "Port_disembarkation"


def load_ports(path: Path) -> frozenset[str]:
    """Lit la colonne nom des ports, depuis un fichier CSV local."""
    text = path.read_text(encoding="utf-8")
    return frozenset(
        row["nom"].strip() for row in csv.DictReader(io.StringIO(text)) if row["nom"].strip()
    )


def match_port(
    written: str, ports: frozenset[str], aliases: dict[str, str] = ALIASES
) -> tuple[list[str], list[str]]:
    """Vérifie le contenu de l'entrée 'written' afin d'en extraire le(s) port(s).

    Une entrée peut nommer plusieurs ports, s'ils sont séparés par `&` comme par
    exemple : « Porto Empedocle & Civitavecchia ».
    """
    matched: list[str] = []
    unmatched: list[str] = []
    for part in written.split("&"):
        candidate = part.strip()
        if not candidate:
            continue
        if candidate in ports:
            matched.append(candidate)
        elif candidate in aliases:
            matched.append(aliases[candidate])
        else:
            unmatched.append(candidate)

    # Si 'unmatched' contient des éléments, on impose que le contenu de
    # matched soit vide, même si l'autre port est correctement identifié.
    if len(unmatched) > 0:
        matched = []

    return matched, unmatched


def check_ports_in_dump(path: Path, ports: frozenset[str]) -> tuple[Counter[str], Counter[str]]:
    """Compte, ligne par ligne, les ports reconnus et les variantes inconnues du fichier."""
    matched: Counter[str] = Counter()
    unmatched: Counter[str] = Counter()
    with open(path, encoding="utf-8", newline="") as file:
        for row in csv.DictReader(file):
            found, unknown = match_port(row[PORT_COLUMN], ports)
            matched.update(found)
            unmatched.update(unknown)
    return matched, unmatched


def main() -> None:
    # On a deux arguments
    parser = argparse.ArgumentParser(
        description=f"Check the {PORT_COLUMN} column of a CSV export against the known ports."
    )
    parser.add_argument(
        "operations", type=Path, help="export CSV de l'ancienne carte des opérations"
    )
    parser.add_argument("ports", type=Path, help="export CSV des ports ")

    args = parser.parse_args()
    path_operations: Path = args.operations
    path_ports: Path = args.ports

    # On récupère la liste des ports connus
    ports = load_ports(path_ports)

    matched, unmatched = check_ports_in_dump(path_operations, ports)
    print(f"Matched ports ({len(matched)}):")

    for port, count in matched.most_common():
        print(f"  {count:4}  {port}")

    print(f"\nUnmatched variants ({len(unmatched)}):")
    for variant, count in unmatched.most_common():
        print(f"  {count:4}  {variant}")


if __name__ == "__main__":
    main()
