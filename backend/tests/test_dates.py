import datetime

import pytest

from app.dates import parse_sheet_date


@pytest.mark.parametrize(
    "input_date",
    [
        pytest.param("02/04/2021", id="dmy"),
        pytest.param("2/4/2021", id="dmy_without_zeros"),
        pytest.param("2021-04-02", id="iso"),
        pytest.param(" 02/04/2021  ", id="dmy_with_spaces"),
    ],
)
def test_correct_date_parsing_from_sheet(input_date: str) -> None:
    valid_date = datetime.date(year=2021, month=4, day=2)
    assert parse_sheet_date(input_date) == valid_date


@pytest.mark.parametrize(
    "input_date",
    [
        pytest.param("", id="empty"),
        pytest.param("   ", id="empty_with_blank_spaces"),
    ],
)
def test_empty_dates(input_date: str) -> None:
    assert parse_sheet_date(input_date) is None


@pytest.mark.parametrize(
    "input_date",
    [
        pytest.param("31/02/2021", id="dmy_impossible_day_in_month"),
        pytest.param("00/01/2020", id="dmy_zero_day"),
        pytest.param("02/13/2021", id="dmy_month_out_of_range"),
        pytest.param("-1/11/2020", id="dmy_negative_day"),
        pytest.param("2021-02-31", id="iso_impossible_day_in_month"),
        pytest.param("not a date", id="not_a_date"),
    ],
)
def test_wrong_dates(input_date: str) -> None:
    with pytest.raises(ValueError):
        parse_sheet_date(input_date)
