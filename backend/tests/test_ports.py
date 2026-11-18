from collections import Counter
from pathlib import Path

from app.ports import check_ports_in_dump, match_port


def test_known_port_is_matched() -> None:
    assert match_port("Pozzallo") == (["Pozzallo"], [])


def test_alias_resolves_to_its_port() -> None:
    assert match_port("Ravena") == (["Ravenna"], [])


def test_several_ports_split_on_ampersand_with_spaces() -> None:
    assert match_port("Porto Empedocle & Civitavecchia") == (
        ["Porto Empedocle", "Civitavecchia"],
        [],
    )


def test_unknown_variant_is_unmatched() -> None:
    assert match_port("Catania & Atlantis") == (["Catania"], ["Atlantis"])


def test_empty_cell_gives_nothing() -> None:
    assert match_port("") == ([], [])


def test_check_ports_in_dump_counts_rows(tmp_path: Path) -> None:
    dump = tmp_path / "operations.csv"
    dump.write_text(
        "date,Port_disembarkation\n"
        "01/01/2020,Augusta\n"
        "02/01/2020,\n"
        "03/01/2020,Augusta & Bari\n"
        "04/01/2020,Atlantis\n",
        encoding="utf-8",
    )

    matched, unmatched = check_ports_in_dump(dump)

    assert matched == Counter({"Augusta": 2, "Bari": 1})
    assert unmatched == Counter({"Atlantis": 1})
