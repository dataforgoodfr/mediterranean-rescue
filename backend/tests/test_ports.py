from collections import Counter
from pathlib import Path

from app.ports import check_ports_in_dump, load_ports, match_port

# Des ports fictifs
PORTS = frozenset({"Portalba", "Marenzo", "Castel Brina"})
ALIASES = {"Portalbo": "Portalba"}


def test_known_port_is_matched() -> None:
    assert match_port("Marenzo", PORTS, ALIASES) == (["Marenzo"], [])


def test_alias_resolves_to_its_port() -> None:
    assert match_port("Portalbo", PORTS, ALIASES) == (["Portalba"], [])


def test_several_ports_split_on_ampersand_with_spaces() -> None:
    assert match_port("Castel Brina & Portalba", PORTS, ALIASES) == (
        ["Castel Brina", "Portalba"],
        [],
    )


def test_unknown_variant_is_unmatched() -> None:
    # S'il existe au moins 1 port qui est non identifié, on ne rattache rien.
    assert match_port("Marenzo & Atlantis", PORTS, ALIASES) == ([], ["Atlantis"])
    # on vérifie que l'ordre n'a aucun impact sur la détection
    assert match_port("Atlantis & Marenzo", PORTS, ALIASES) == ([], ["Atlantis"])
    # on vérifie le case de 2 variantes inconnues
    known, unknown = match_port("Atlantis & Maralago", PORTS, ALIASES)
    assert set(unknown) == {"Atlantis", "Maralago"}


def test_empty_cell_gives_nothing() -> None:
    assert match_port("", PORTS, ALIASES) == ([], [])


def test_check_ports_in_dump_counts_rows(tmp_path: Path) -> None:
    dump = tmp_path / "operations.csv"
    dump.write_text(
        "date,Port_disembarkation\n"
        "01/01/2020,Portalba\n"
        "02/01/2020,\n"
        "03/01/2020,Portalba & Marenzo\n"
        "04/01/2020,Atlantis\n",
        encoding="utf-8",
    )

    matched, unmatched = check_ports_in_dump(dump, PORTS)

    assert matched == Counter({"Portalba": 2, "Marenzo": 1})
    assert unmatched == Counter({"Atlantis": 1})


def test_load_ports_reads_the_nom_column(tmp_path: Path) -> None:
    data = tmp_path / "Data_ports.csv"
    data.write_text(
        '"nom","latitude","longitude"\n'
        '"Portalba","37° 3.41","15° 17.40"\n'
        '" Marenzo ","38° 0.43","12° 30.20"\n'
        '"","",""\n',
        encoding="utf-8",
    )

    assert load_ports(data) == frozenset({"Portalba", "Marenzo"})
