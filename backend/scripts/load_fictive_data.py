"""Charge un jeu fictif de backend/fixtures/ dans la base. Depuis backend/ :

    uv run python -m scripts.load_fictive_data fixtures/3_fictive_data.csv

Chaque ligne doit être marquée FICTIF, sinon rien n'est chargé.
"""

import argparse
import csv
from datetime import datetime
from pathlib import Path

from sqlmodel import Session

from app.db import engine
from app.models import Operation, OperationType, create_tables
from scripts.generate_fictive_data import OperationModel


def fixture_position(text: str | None) -> float | None:
    """Le format exact du générateur, `33° 59.8`, en degrés décimaux. La lecture complète des
    positions de l'ancienne carte (toutes ses formes) est l'issue #65."""
    if text is None:
        return None
    degrees, minutes = text.split("°")
    return int(degrees) + float(minutes) / 60


def to_operation(row: OperationModel) -> Operation:
    # model_validate, et non Operation(...) : c'est lui qui applique les règles du modèle.
    return Operation.model_validate(
        dict(
            date=datetime.strptime(row.date, "%d/%m/%Y").date(),
            operation_type=OperationType(row.type_ops.lower()),
            nb_ops=row.nb_ops,
            nb_survivor=row.nb_survivor,
            male=row.male,
            female=row.female,
            under_18=row.under_18,
            under_18_unacc=row.under_18_unacc,
            under_5=row.under_5,
            pregnant_women=row.pregnant_women,
            latitude=fixture_position(row.latitude),
            longitude=fixture_position(row.longitude),
            wind_force=row.wind_force,
            wave_height=row.wave_height,
            boat_type=row.boat_type,
            nb_nationalities=row.nb_nationalities,
            transfer_type=row.transfer_type,
            port_disembarkation=row.port_disembarkation,
            image_src=row.image_src,
            video_src=row.video_srv,
            testimony_name=row.testimony_name,
            testimony_src=row.testimony_src,
        )
    )


def load_fictive_data(session: Session, path: Path) -> int:
    """Ajoute les opérations du fichier et rend leur nombre. Une ligne invalide, ou qui n'est
    pas marquée FICTIF, lève ValueError avant tout ajout."""
    with path.open(newline="") as f:
        # Une case vide est une valeur inconnue : None, jamais 0 ni texte vide.
        rows = [
            OperationModel.model_validate({k: v or None for k, v in row.items()})
            for row in csv.DictReader(f)
        ]
    operations = [to_operation(row) for row in rows]
    session.add_all(operations)
    session.commit()
    return len(operations)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Charge un jeu fictif dans la base.")
    parser.add_argument("path", type=Path, help="le CSV, par exemple fixtures/3_fictive_data.csv")
    args = parser.parse_args()
    create_tables(engine)
    with Session(engine) as session:
        print(f"{load_fictive_data(session, args.path)} opérations chargées")
