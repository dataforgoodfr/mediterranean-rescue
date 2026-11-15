from pathlib import Path

from scripts.generate_fictive_data import generate_fictive_data_file


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
    assert ",," in actual_generated_file_content  # missing data is represented by empty fields


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
            "The following line does not end with 'FICTIF':\n" + line
        )
