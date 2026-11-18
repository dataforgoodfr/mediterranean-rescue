"""Les tables de la base. Les champs et leur sens : docs/donnees.md."""

import datetime
from enum import StrEnum
from typing import Self

from pydantic import model_validator
from sqlalchemy import Engine, String
from sqlmodel import Field, SQLModel


class OperationType(StrEnum):
    """Les types d'opération. Ils sont rangés comme du texte dans la base : un nouveau type
    (l'évacuation médicale, par exemple) n'est qu'une ligne de plus ici, sans migration."""

    rescue = "rescue"
    transfer = "transfer"


class Operation(SQLModel, table=True):
    """Une opération : un sauvetage ou un transfert. Une valeur inconnue reste vide (None),
    jamais 0. On ne garde que le nombre de nationalités, jamais leur détail."""

    id: int | None = Field(default=None, primary_key=True)
    date: datetime.date
    operation_type: OperationType = Field(sa_type=String)
    nb_ops: int = Field(ge=1)
    nb_survivor: int | None = None
    male: int | None = None
    female: int | None = None
    under_18: int | None = None
    under_18_unacc: int | None = None
    under_5: int | None = None
    pregnant_women: int | None = None
    # En degrés décimaux (WGS 84), nord et est positifs.
    latitude: float | None = None
    longitude: float | None = None
    wind_force: int | None = Field(default=None, ge=0, le=12)  # échelle de Beaufort
    wave_height: float | None = None  # en mètres
    boat_type: str | None = None
    nb_nationalities: int | None = None
    transfer_type: str | None = None
    port_disembarkation: str | None = None
    image_src: str | None = None
    video_src: str | None = None
    testimony_name: str | None = None
    testimony_src: str | None = None

    # Un modèle de table ne se valide pas à la construction (Operation(...)) : passer par
    # Operation.model_validate(...) pour que ces règles s'appliquent (tests/test_operations.py).
    @model_validator(mode="after")
    def position_in_the_mediterranean(self) -> Self:
        """Une première règle, volontairement simple : une position a ses deux coordonnées, et elle
        est au nord de l'équateur. Elle se resserrera avec la carte de la Méditerranée et des eaux
        territoriales (#82)."""
        if (self.latitude is None) != (self.longitude is None):
            raise ValueError("a position needs both latitude and longitude")
        if self.latitude is not None and not 0 < self.latitude <= 90:
            raise ValueError("the position must be in the northern hemisphere")
        return self


def create_tables(engine: Engine) -> None:
    """Crée les tables qui manquent, sans toucher à celles qui existent."""
    SQLModel.metadata.create_all(engine)
