"""La lecture des dates de l'ancienne carte."""

import datetime


def parse_sheet_date(text: str) -> datetime.date | None:
    """Lit une date du Sheet, en jj/mm/aaaa ou en ISO aaaa-mm-jj.
    Renvoie None pour un texte vide, un format inconnu ou une date impossible."""
    # Format DMY
    try:
        return datetime.datetime.strptime(text, "%d/%m/%Y").date()
    except ValueError:
        pass

    # Format ISO
    try:
        return datetime.date.fromisoformat(text)
    except ValueError:
        return None
