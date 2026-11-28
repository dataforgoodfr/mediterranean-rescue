"""La lecture des positions : texte libre et ancienne carte."""

import re
from dataclasses import dataclass


@dataclass(frozen=True)
class TextPosition:
    """Une position lue dans un texte, en degrés décimaux (WGS84).

    Une moitié absente du texte reste à None. `ambiguous` est vrai quand la position n'est pas
    sûre : lecture à double sens, moitié manquante, ou point hors de la boîte Méditerranée.
    La valeur rendue est alors une lecture possible, pas la seule."""

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

# Briques pour le format historique : chiffres puis lettre d'hémisphère (ex. 34 06 N).
# Des chiffres après le prime (33°12’4) se lisent 12,4 minutes ou 12 minutes 4 secondes :
# cette lecture est marquée ambiguë.
_DEG_A = r"(?P<deg_a>\d{1,3})"
_DEG_SEP = r"(?:\s*°\s*|\s+)"
_MIN_A = r"(?P<min_a>\d{1,2}(?:[.,]\d+)?)"
_SEC_A = r"(?:\s+(?P<sec_a>\d{1,2}(?:[.,]\d+)?))?"
_PRIME_A = r"(?:\s*['’′](?P<extra_a>\d+)?)?"
_HEM_AFTER = r"\s*(?P<hem_after>[NSEWO])(?![^\W\d_])"
_PATTERN_LETTER_AFTER = rf"{_DEG_A}{_DEG_SEP}{_MIN_A}{_SEC_A}{_PRIME_A}{_HEM_AFTER}"

# Briques pour le format avec lettre d'hémisphère avant les chiffres (ex. N 33 25,9).
# Tolère un 3e groupe jusqu'à 3 chiffres (millièmes de minute sans point, ex. N 35 29 796)
# et un 4e groupe (lecture incertaine à 4 groupes, ex. N34 07 50 97).
_HEM_BEFORE = r"(?<![^\W\d_])(?P<hem_before>[NSEWO])\s*"
_DEG_B = r"(?P<deg_b>\d{1,3})"
_MIN_B = r"(?P<min_b>\d{1,2}(?:[.,]\d+)?)"
_THIRD_B = r"(?:\s+(?P<third_b>\d{1,3}(?:[.,]\d+)?))?"
_FOURTH_B = r"(?:\s+(?P<fourth_b>\d{1,2}(?:[.,]\d+)?))?"
_PATTERN_LETTER_BEFORE = rf"{_HEM_BEFORE}{_DEG_B}{_DEG_SEP}{_MIN_B}{_THIRD_B}{_FOURTH_B}(?![\d.])"

# La lettre d'hémisphère est obligatoire pour ignorer les heures ou les caps (COG 272°).
_HALF = re.compile(
    rf"(?<![\d.,])(?:{_PATTERN_LETTER_AFTER}|{_PATTERN_LETTER_BEFORE})",
    re.VERBOSE,
)


def _read_half(match: re.Match[str]) -> _Half | None:
    hem_after = match["hem_after"]
    if hem_after is not None:
        raw_deg = match["deg_a"]
        raw_min = match["min_a"]
        raw_sec = match["sec_a"]
        extra = match["extra_a"]
        if raw_deg is None or raw_min is None:
            return None

        degrees = int(raw_deg)
        minutes_text = raw_min.replace(",", ".")

        # Les chiffres après le prime se lisent comme des dixièmes de minute : 12’4 donne 12,4.
        # C'est l'une de deux lectures possibles, d'où le marquage ambigu. Si les minutes ont
        # déjà des décimales (12.4’5), les chiffres en trop sont ignorés.
        if extra is not None and "." not in minutes_text:
            minutes_text = f"{minutes_text}.{extra}"
        minutes = float(minutes_text)
        seconds = float(raw_sec.replace(",", ".")) if raw_sec is not None else 0.0
        hemisphere = hem_after
        ambiguous = extra is not None
    else:
        hem_before = match["hem_before"]
        raw_deg = match["deg_b"]
        raw_min = match["min_b"]
        third = match["third_b"]
        fourth = match["fourth_b"]
        if hem_before is None or raw_deg is None or raw_min is None:
            return None

        degrees = int(raw_deg)
        minutes_text = raw_min.replace(",", ".")
        seconds = 0.0
        ambiguous = False

        if fourth is not None and third is not None:
            # 4 groupes de chiffres (ex. N34 07 50 97) : lecture incertaine (secondes et
            # centièmes sans séparateur décimal), toujours marquée ambiguë.
            minutes = float(minutes_text)
            seconds = float(f"{third.replace(',', '.')}.{fourth.replace(',', '.')}")
            ambiguous = True
        elif third is not None:
            if (
                len(third) == 3
                and "." not in third
                and "," not in third
                and "." not in minutes_text
            ):
                # 3 chiffres après les minutes (ex. N 35 29 796) : millièmes de minute
                # sans séparateur décimal (29,796'), lecture probable donc marquée ambiguë.
                minutes = float(f"{minutes_text}.{third}")
                ambiguous = True
            else:
                minutes = float(minutes_text)
                seconds = float(third.replace(",", "."))
        else:
            minutes = float(minutes_text)

        hemisphere = hem_before

    is_latitude = hemisphere in "NS"

    # Une valeur hors limites signifie que le texte n'est pas une position. On l'écarte sans
    # lever d'erreur.
    if minutes >= 60 or seconds >= 60 or degrees > (90 if is_latitude else 180):
        return None

    return _Half(
        value=_SIGNS[hemisphere] * (degrees + minutes / 60 + seconds / 3600),
        is_latitude=is_latitude,
        ambiguous=ambiguous,
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

    Une latitude suivie d'une longitude, séparées par des espaces, « / » ou « , », forment une
    position. Une moitié seule est rendue avec l'autre à None. Un texte sans position rend
    une liste vide, jamais (0, 0)."""
    halves = [half for match in _HALF.finditer(text) if (half := _read_half(match))]
    positions: list[TextPosition] = []
    i = 0
    while i < len(halves):
        first = halves[i]
        second = halves[i + 1] if i + 1 < len(halves) else None

        # Une latitude suivie directement d'une longitude, séparées par des espaces, « / » ou
        # « , », forment une position. Un texte peut en contenir plusieurs, comme le départ et
        # l'arrivée d'un trajet.
        if (
            first.is_latitude
            and second is not None
            and not second.is_latitude
            and text[first.end : second.start].strip() in ("", "/", ",")
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


# Une cellule de l'ancienne carte : des degrés, le signe degré, des minutes avec ou sans
# décimales. Pas de lettre d'hémisphère : tout y est nord et est.
_DEGREES_MINUTES = re.compile(r"(?P<deg>\d{1,3})\s*°\s*(?P<min>\d{1,2}(?:\.\d+)?)")


def degrees_minutes_to_decimal(text: str) -> float | None:
    """Convertit une position de l'ancienne carte (33° 12.4) en degrés décimaux.

    Un texte vide ou illisible rend None, jamais 0. Des minutes à 60 ou plus aussi."""
    match = _DEGREES_MINUTES.fullmatch(text.strip())
    if match is None:
        return None
    minutes = float(match["min"])
    if minutes >= 60:
        return None
    return int(match["deg"]) + minutes / 60
