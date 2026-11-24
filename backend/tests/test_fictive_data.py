import datetime
from pathlib import Path

import pytest
from sqlmodel import Session, col, select

from app.models import Operation, OperationType
from scripts.generate_fictive_data import generate_fictive_data_file
from scripts.load_fictive_data import load_fictive_data

FIXTURE = Path(__file__).parents[1] / "fixtures" / "3_fictive_data.csv"


def test_generate_always_the_same_fictive_data_file(tmp_path: Path) -> None:
    input_line_nb = 42
    input_seed = "RandomSeed"
    input_fixture_directory = tmp_path / "input_fixtures"
    input_fixture_directory.mkdir(parents=True, exist_ok=True)
    expected_generated_file = input_fixture_directory / "42_fictive_data.csv"

    actual_generated_file = generate_fictive_data_file(
        input_fixture_directory, input_seed, input_line_nb
    )
    assert actual_generated_file == expected_generated_file
    assert expected_generated_file.exists()
    generated_file_content = expected_generated_file.read_text()

    generate_fictive_data_file(input_fixture_directory, input_seed, input_line_nb)
    assert expected_generated_file.exists()
    actual_generated_file_content = expected_generated_file.read_text()
    assert generated_file_content == actual_generated_file_content


def test_generate_fictive_data_file_with_missing_data(tmp_path: Path) -> None:
    input_line_nb = 42
    input_seed = "RandomSeed"
    input_fixture_directory = tmp_path / "input_fixtures"
    input_fixture_directory.mkdir(parents=True, exist_ok=True)
    expected_generated_file = input_fixture_directory / "42_fictive_data.csv"

    generate_fictive_data_file(input_fixture_directory, input_seed, input_line_nb)
    actual_generated_file_content = expected_generated_file.read_text()
    assert ",," in actual_generated_file_content  # une donnée manquante donne un champ vide


def test_generate_fictive_data_file_with_FICTIF_value(tmp_path: Path) -> None:
    input_line_nb = 42
    input_seed = "RandomSeed"
    input_fixture_directory = tmp_path / "input_fixtures"
    input_fixture_directory.mkdir(parents=True, exist_ok=True)
    expected_generated_file = input_fixture_directory / "42_fictive_data.csv"

    generate_fictive_data_file(input_fixture_directory, input_seed, input_line_nb)
    with open(expected_generated_file) as f:
        actual_generated_file_content = f.readlines()
    for line in actual_generated_file_content[1:]:  # Skip header line
        assert line.strip().endswith("FICTIF"), (
            "Cette ligne ne se termine pas par 'FICTIF' :\n" + line
        )


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
