from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import Enum, String, inspect
from sqlmodel import Session, col, select

from app.models import Operation
from scripts.load_fictive_data import load_fictive_data

FIXTURE = Path(__file__).parents[1] / "fixtures" / "3_fictive_data.csv"


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


VALID: dict[str, object] = {"date": "2023-02-17", "operation_type": "rescue", "nb_ops": 1}


def test_a_valid_operation_passes_validation() -> None:
    operation = Operation.model_validate({**VALID, "latitude": 34.5, "longitude": 15.2})
    assert operation.latitude == 34.5


@pytest.mark.parametrize("wind_force", [-1, 13])
def test_a_wind_force_outside_the_beaufort_scale_is_refused(wind_force: int) -> None:
    with pytest.raises(ValueError):
        Operation.model_validate({**VALID, "wind_force": wind_force})


def test_a_position_in_the_southern_hemisphere_is_refused() -> None:
    # Première validation, volontairement simple : la Méditerranée est au nord de l'équateur.
    with pytest.raises(ValueError):
        Operation.model_validate({**VALID, "latitude": -34.5, "longitude": 15.2})


def test_a_position_with_only_one_coordinate_is_refused() -> None:
    with pytest.raises(ValueError):
        Operation.model_validate({**VALID, "latitude": 34.5})


def test_the_loader_applies_the_model_rules(session: Session, tmp_path: Path) -> None:
    lines = FIXTURE.read_text().splitlines()
    header, first = lines[0], lines[1].split(",")
    first[header.split(",").index("wind_force")] = "13"
    bad = tmp_path / "bad.csv"
    bad.write_text("\n".join([header, ",".join(first)]) + "\n")

    with pytest.raises(ValueError):
        load_fictive_data(session, bad)
    assert session.exec(select(Operation)).all() == []


def test_the_api_lists_no_operation_for_an_empty_database(client: TestClient) -> None:
    response = client.get("/api/operations")
    assert response.status_code == 200
    assert response.json() == []


def test_the_api_lists_the_fictive_published_operations(
    client: TestClient, session: Session
) -> None:
    load_fictive_data(session, FIXTURE)

    operations = client.get("/api/operations").json()

    # De la plus ancienne à la plus récente.
    assert [operation["date"] for operation in operations] == [
        "2017-08-12",
        "2023-02-17",
    ]
    latest = operations[-1]
    assert latest["operation_type"] == "rescue"
    assert (latest["nb_ops"], latest["nb_survivor"]) == (2, 38)
    # 33° 59.8 et 17° 13.8, renvoyés en degrés décimaux.
    assert latest["latitude"] == pytest.approx(33 + 59.8 / 60)
    assert latest["longitude"] == pytest.approx(17 + 13.8 / 60)
    assert isinstance(latest["id"], int)
    # Inconnu reste vide, jamais zéro, jusque dans la réponse.
    assert operations[0]["under_18"] is None


def test_the_operations_route_is_documented(client: TestClient) -> None:
    assert "/api/operations" in client.get("/api/openapi.json").json()["paths"]
