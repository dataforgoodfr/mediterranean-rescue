"""La lecture des positions écrites dans un texte libre."""

import re
from dataclasses import dataclass


@dataclass(frozen=True)
class TextPosition:
    """Une position lue dans un texte, en degrés décimaux (WGS84).

    Une moitié absente du texte reste à None. `ambiguous` est vrai quand la position ne peut
    pas être prise telle quelle : lecture incertaine, moitié manquante, ou point hors de la
    boîte Méditerranée. La valeur rendue est alors une lecture possible, pas la seule."""

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


# « O » est l'Ouest de la notation française, l'équivalent de « W ».
_SIGNS = {"N": 1, "S": -1, "E": 1, "W": -1, "O": -1}

# La zone d'opération en Méditerranée centrale. Une position hors de cette boîte est plus
# probablement une erreur de lecture ou de saisie qu'une vraie position. Elle est marquée
# ambiguë, pas écartée.
_MED_LATITUDES = (29.5, 40.0)
_MED_LONGITUDES = (8.0, 23.0)

# La lettre d'hémisphère est obligatoire. Sans elle, on attraperait des heures ou des caps
# (COG 272°). Des chiffres après le prime (33°12’4) se lisent 12,4 minutes ou 12 minutes
# 4 secondes. Cette lecture est marquée ambiguë.
_HALF = re.compile(
    r"""
    (?<![\d.,])
    (?P<deg>\d{1,3})
    (?:\s*°\s*|\s+)
    (?P<min>\d{1,2}(?:[.,]\d+)?)
    (?:\s+(?P<sec>\d{1,2}(?:[.,]\d+)?))?
    (?:\s*['’′](?P<extra>\d+)?)?
    \s*
    (?P<hem>[NSEWO])
    (?![^\W\d_])
    """,
    re.VERBOSE,
)


def _read_half(match: re.Match[str]) -> _Half | None:
    degrees = int(match["deg"])
    minutes_text = match["min"].replace(",", ".")
    extra = match["extra"]

    # Les chiffres après le prime se lisent comme des dixièmes de minute : 12’4 donne 12,4.
    # C'est l'une de deux lectures possibles, d'où le marquage ambigu. Si les minutes ont
    # déjà des décimales (12.4’5), les chiffres en trop sont ignorés.
    if extra is not None and "." not in minutes_text:
        minutes_text = f"{minutes_text}.{extra}"
    minutes = float(minutes_text)
    seconds = float(match["sec"].replace(",", ".")) if match["sec"] else 0.0

    hemisphere = match["hem"]
    is_latitude = hemisphere in "NS"

    # Une valeur hors limites signifie que le texte n'est pas une position. On l'écarte sans
    # lever d'erreur.
    if minutes >= 60 or seconds >= 60 or degrees > (90 if is_latitude else 180):
        return None

    return _Half(
        value=_SIGNS[hemisphere] * (degrees + minutes / 60 + seconds / 3600),
        is_latitude=is_latitude,
        ambiguous=extra is not None,
        start=match.start(),
        end=match.end(),
    )


def _in_mediterranean(latitude: float, longitude: float) -> bool:
    return (
        _MED_LATITUDES[0] <= latitude <= _MED_LATITUDES[1]
        and _MED_LONGITUDES[0] <= longitude <= _MED_LONGITUDES[1]
    )


def positions_in_text(text: str) -> list[TextPosition]:
    """Rend chaque position trouvée dans le texte, dans l'ordre, avec le morceau lu.

    Une latitude suivie d'une longitude, séparées par des espaces seulement, forment une
    position. Une moitié seule est rendue avec l'autre à None. Un texte sans position rend
    une liste vide, jamais (0, 0)."""
    halves = [half for match in _HALF.finditer(text) if (half := _read_half(match))]
    positions: list[TextPosition] = []
    i = 0
    while i < len(halves):
        first = halves[i]
        second = halves[i + 1] if i + 1 < len(halves) else None

        # Une latitude suivie directement d'une longitude, séparées par des espaces seulement,
        # forment une position. Un texte peut en contenir plusieurs, comme le départ et
        # l'arrivée d'un trajet.
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
                    ambiguous=first.ambiguous
                    or second.ambiguous
                    or not _in_mediterranean(first.value, second.value),
                )
            )
            i += 2
            continue

        # Toute autre moitié reste seule : une latitude seule, une longitude seule, ou une
        # paire dans le mauvais ordre ou coupée par d'autres mots. Le côté manquant reste à
        # None. Une moitié seule ne peut pas être placée dans la boîte Méditerranée, elle est
        # donc toujours ambiguë.
        positions.append(
            TextPosition(
                latitude=first.value if first.is_latitude else None,
                longitude=None if first.is_latitude else first.value,
                text=text[first.start : first.end],
                ambiguous=True,
            )
        )
        i += 1

    return positions
