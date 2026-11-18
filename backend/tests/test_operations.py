import datetime
from pathlib import Path

import pytest
from sqlalchemy import Enum, String, inspect
from sqlmodel import Session, col, select

from app.models import Operation, OperationType
from scripts.load_fictive_data import load_fictive_data

FIXTURE = Path(__file__).parents[1] / "fixtures" / "3_fictive_data.csv"


def test_the_fictive_data_set_loads_into_the_database(session: Session) -> None:
    assert load_fictive_data(session, FIXTURE) == 3

    operations = session.exec(select(Operation).order_by(col(Operation.id))).all()
    assert len(operations) == 3
    first = operations[0]
    assert first.date == datetime.date(2023, 2, 17)
    assert first.operation_type == OperationType.rescue
    assert (first.nb_ops, first.nb_survivor, first.male, first.female) == (2, 38, 26, 9)
    assert first.nb_nationalities == 4
    assert first.transfer_type == "To Aquarius"
    # 33° 59.8 et 17° 13.8 : des degrés et des minutes, rangés en degrés décimaux.
    assert first.latitude == pytest.approx(33 + 59.8 / 60)
    assert first.longitude == pytest.approx(17 + 13.8 / 60)


def test_an_unknown_value_stays_empty_never_zero(session: Session) -> None:
    load_fictive_data(session, FIXTURE)

    third = session.exec(select(Operation).order_by(col(Operation.id))).all()[2]
    assert third.male is None
    assert third.wind_force is None
    assert third.image_src == "image_32.jpg"


def test_a_row_not_marked_fictif_is_refused(session: Session, tmp_path: Path) -> None:
    lines = FIXTURE.read_text().splitlines()
    real = tmp_path / "real.csv"
    real.write_text("\n".join([lines[0], lines[1].removesuffix(",FICTIF") + ","]) + "\n")

    with pytest.raises(ValueError):
        load_fictive_data(session, real)
    assert session.exec(select(Operation)).all() == []


def test_a_new_operation_type_needs_no_database_migration() -> None:
    # Le type est rangé comme un texte, pas comme un type énuméré de Postgres : ajouter
    # l'évacuation médicale ne demandera qu'une valeur de plus dans OperationType.
    column_type = inspect(Operation).columns["operation_type"].type
    assert isinstance(column_type, String)
    assert not isinstance(column_type, Enum)
