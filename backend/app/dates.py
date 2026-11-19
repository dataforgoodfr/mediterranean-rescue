"""La lecture des dates de l'ancienne carte."""

import datetime


def parse_sheet_date(text: str) -> datetime.date | None:
    """Lit une date du Sheet, en jj/mm/aaaa (zéros facultatifs) ou en ISO aaaa-mm-jj, en ignorant
    les espaces autour. Renvoie None pour un texte vide. Lève ValueError pour un format inconnu ou
    une date impossible (31/02/2021) : jamais une date voisine."""
    # Dates vides ou avec espaces autour
    text = text.strip()
    if not text:
        return None

    # Format DMY
    try:
        return datetime.datetime.strptime(text, "%d/%m/%Y").date()
    except ValueError:
        pass

    # Format ISO
    try:
        return datetime.date.fromisoformat(text)
    except ValueError:
        pass

    raise ValueError(f"Invalid or unreadable date: {text!r}")
