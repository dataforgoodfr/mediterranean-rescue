"""Reading positions written in free text."""

import re
from dataclasses import dataclass


@dataclass(frozen=True)
class TextPosition:
    """A position read from a text, in decimal degrees (WGS84).

    A half missing from the text stays None. `ambiguous` is true when the reading is not
    certain. The returned value is then one possible reading, not the only one."""

    latitude: float | None
    longitude: float | None
    text: str
    ambiguous: bool


@dataclass(frozen=True)
class _Half:
    value: float
    is_latitude: bool
    ambiguous: bool
    start: int
    end: int


# The dictionary below accounts for french notation, ie. "O" -> "Ouest" -> "West"
_SIGNS = {"N": 1, "S": -1, "E": 1, "W": -1, "O": -1}

# The hemisphere letter is mandatory. Without it, times or headings (COG 272°) would match.
# Digits after the prime (33°12’4) read as 12.4 minutes or as 12 minutes 4 seconds. Such a
# reading is flagged ambiguous.
_HALF = re.compile(
    r"""
    (?<![\w.,])
    (?P<deg>\d{1,3})
    (?:\s*°\s*|\s+)
    (?P<min>\d{1,2}(?:[.,]\d+)?)
    (?:\s*['’′](?P<extra>\d+)?)?
    \s*
    (?P<hem>[NSEWO])
    \b
    """,
    re.VERBOSE,
)


def _read_half(match: re.Match[str]) -> _Half | None:
    degrees = int(match["deg"])
    minutes_text = match["min"].replace(",", ".")
    extra = match["extra"]

    # Digits after the prime are read as tenths of a minute: 12’4 gives 12.4. It is one of
    # two possible readings, so the half is flagged ambiguous. If the minutes already have
    # decimals (12.4’5), the extra digits are dropped.
    if extra is not None and "." not in minutes_text:
        minutes_text = f"{minutes_text}.{extra}"
    minutes = float(minutes_text)

    hemisphere = match["hem"]
    is_latitude = hemisphere in "NS"

    # Out-of-range values mean the text is not a position. Skip it rather than raise.
    if minutes >= 60 or degrees > (90 if is_latitude else 180):
        return None

    return _Half(
        value=_SIGNS[hemisphere] * (degrees + minutes / 60),
        is_latitude=is_latitude,
        ambiguous=extra is not None,
        start=match.start(),
        end=match.end(),
    )


def positions_in_text(text: str) -> list[TextPosition]:
    """Return every position found in the text, in order, with the excerpt that was read.

    A latitude followed by a longitude, separated only by whitespace, forms one position. A
    lone half is returned with the other one set to None. A text without a position returns
    an empty list, never (0, 0)."""
    halves = [half for match in _HALF.finditer(text) if (half := _read_half(match))]
    positions: list[TextPosition] = []
    i = 0
    while i < len(halves):
        first = halves[i]
        second = halves[i + 1] if i + 1 < len(halves) else None

        # A latitude directly followed by a longitude, with only whitespace between them,
        # forms one position. A text can hold several, like the start and end of a journey.
        if (
            first.is_latitude
            and second is not None
            and not second.is_latitude
            and not text[first.end : second.start].strip()
        ):
            positions.append(
                TextPosition(
                    latitude=first.value,
                    longitude=second.value,
                    text=text[first.start : second.end],
                    ambiguous=first.ambiguous or second.ambiguous,
                )
            )
            i += 2
            continue

        # Any other half stands alone: a lone latitude, a lone longitude, or a pair in the
        # wrong order or split by other words. The missing side stays None.
        positions.append(
            TextPosition(
                latitude=first.value if first.is_latitude else None,
                longitude=None if first.is_latitude else first.value,
                text=text[first.start : first.end],
                ambiguous=first.ambiguous,
            )
        )
        i += 1

    return positions
