import pytest

from app.positions import TextPosition, positions_in_text


@pytest.mark.parametrize(
    ("text", "latitude", "longitude"),
    [
        pytest.param("34 06 N 011 43 E", 34.1, 11 + 43 / 60, id="since_2024_whole_minutes"),
        pytest.param(
            "34 20.8 N 011 50.5 E", 34 + 20.8 / 60, 11 + 50.5 / 60, id="since_2024_decimal_minutes"
        ),
        pytest.param(
            "34 15 42 N 012 48 31 E",
            34 + 15 / 60 + 42 / 3600,
            12 + 48 / 60 + 31 / 3600,
            id="seconds_without_symbols",
        ),
        pytest.param("34 11 N012 37 E", 34 + 11 / 60, 12 + 37 / 60, id="letter_stuck_to_longitude"),
        pytest.param("34 06N", 34.1, None, id="since_2024_letter_stuck"),
        pytest.param("34 06,5 N", 34 + 6.5 / 60, None, id="since_2024_decimal_comma"),
        pytest.param("33°12.4’N 013°05.2’E", 33 + 12.4 / 60, 13 + 5.2 / 60, id="older_apostrophe"),
        pytest.param("33°12.4′N 013°05.2′E", 33 + 12.4 / 60, 13 + 5.2 / 60, id="older_prime"),
        pytest.param("35 30 S 002 15 O", -35.5, -2.25, id="south_west_in_french"),
        pytest.param("011 43 E", None, 11 + 43 / 60, id="longitude_alone"),
    ],
)
def test_reads_each_form(text: str, latitude: float | None, longitude: float | None) -> None:
    [position] = positions_in_text(text)
    assert position.latitude == pytest.approx(latitude)
    assert position.longitude == pytest.approx(longitude)
    assert position.text == text


@pytest.mark.parametrize(
    ("text", "ambiguous"),
    [
        pytest.param("34 06 N 011 43 E", False, id="inside_the_box"),
        pytest.param("29 30 N 008 00 E", False, id="south_west_corner"),
        pytest.param("40 00 N 023 00 E", False, id="north_east_corner"),
        pytest.param("41 00 N 011 00 E", True, id="too_far_north"),
        pytest.param("34 00 N 024 00 E", True, id="too_far_east"),
        pytest.param("35 30 S 002 15 O", True, id="other_hemispheres"),
        pytest.param("34 06 N", True, id="latitude_alone"),
        pytest.param("011 43 E", True, id="longitude_alone"),
    ],
)
def test_flags_positions_outside_the_mediterranean_or_incomplete(
    text: str, ambiguous: bool
) -> None:
    [position] = positions_in_text(text)
    assert position.ambiguous is ambiguous


def test_keeps_only_the_position_from_a_sentence() -> None:
    [position] = positions_in_text("Cible repérée à 34 06 N 011 43 E vers midi.")
    assert position.text == "34 06 N 011 43 E"


def test_flags_an_ambiguous_reading() -> None:
    [position] = positions_in_text("33°12’4N 013°05.2’E")
    assert position.latitude == pytest.approx(33 + 12.4 / 60)
    assert position.ambiguous is True


def test_reads_several_positions_in_order() -> None:
    positions = positions_in_text("De 34 06 N 011 43 E à 33°12.4’N 013°05.2’E.")
    assert [p.text for p in positions] == ["34 06 N 011 43 E", "33°12.4’N 013°05.2’E"]


@pytest.mark.parametrize(
    "text",
    [
        pytest.param("", id="empty"),
        pytest.param("COG 272°", id="heading"),
        pytest.param("départ 12 30", id="time"),
        pytest.param("34 06", id="no_hemisphere_letter"),
        pytest.param("95 00 N", id="latitude_out_of_range"),
        pytest.param("34 75 N", id="minutes_out_of_range"),
        pytest.param("34 22 75 N", id="seconds_out_of_range"),
        pytest.param("34 06 Nord", id="letter_inside_a_word"),
    ],
)
def test_text_without_position_gives_nothing(text: str) -> None:
    assert positions_in_text(text) == list[TextPosition]()
