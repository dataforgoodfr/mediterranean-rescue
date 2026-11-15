"""Génère un fichier de données fictives et le push dans backend/fixtures/"""

import argparse
import csv
import random
import string
from datetime import date, timedelta
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, Field


class OperationModel(BaseModel):
    # Date stockée au format "dd/mm/yyyy"
    date: str
    type_ops: Literal["Rescue", "Transfer"]
    nb_ops: int = Field(ge=1)
    nb_survivor: int | None = None
    male: int | None = None
    female: int | None = None
    under_18: int | None = None
    under_18_unacc: int | None = None
    under_5: int | None = None
    pregnant_women: int | None = None
    latitude: str | None = None
    longitude: str | None = None
    wind_force: int | None = Field(default=None, ge=0)
    wave_height: float | None = Field(default=None, ge=0)
    boat_type: str | None = None
    nb_nationalities: int | None = Field(default=None, ge=0)
    type_nationalities: str | None = None
    transfer_type: Literal["To Aquarius", "To OV"] | None = None
    port_disembarkation: str | None = None
    image_src: str | None = None
    video_srv: str | None = None
    testimony_name: str | None = None
    testimony_src: str | None = None
    fictif: Literal["FICTIF"] = "FICTIF"


def get_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Génère des données fictives et les écrit dans backend/fixtures/"
    )
    parser.add_argument(
        "-seed",
        type=str,
        help="Graine pour générer les mêmes données (défaut: Data4Good)",
        default="Data4Good",
    )
    parser.add_argument(
        "-nb_lines", type=int, help="Nombre de lignes à générer (défaut 3)", default=3
    )
    return parser.parse_args()


def generate_random_date(
    start_date: date = date(2016, 1, 1), end_date: date = date(2026, 10, 30)
) -> date:
    delta_days = (end_date - start_date).days
    random_days = random.randint(0, delta_days)
    return start_date + timedelta(days=random_days)


def generate_survivor_counts() -> tuple[
    int, int | None, int | None, int | None, int | None, int | None, int | None
]:
    nb_survivor = random.randint(0, 100)
    empty_detail_threshold = 0.3
    if random.random() < empty_detail_threshold:
        return nb_survivor, None, None, None, None, None, None
    male = random.randint(0, nb_survivor)
    female = random.randint(0, nb_survivor - male)
    if random.random() < empty_detail_threshold:
        return nb_survivor, male, female, None, None, None, None
    under_18 = random.randint(0, nb_survivor)
    under_18_unacc = random.randint(0, under_18)
    if random.random() < empty_detail_threshold:
        return nb_survivor, male, female, under_18, under_18_unacc, None, None
    under_5 = random.randint(0, under_18)
    if random.random() < empty_detail_threshold:
        return nb_survivor, male, female, under_18, under_18_unacc, under_5, None
    pregnant_women = random.randint(0, female)
    return nb_survivor, male, female, under_18, under_18_unacc, under_5, pregnant_women


def generate_fictive_coordinates() -> tuple[str, str]:
    """Génère des coordonnées fictives au format degrés/minutes décimales."""

    def to_dms(value: float) -> str:
        degrees = int(value)
        minutes = (abs(value) - abs(degrees)) * 60
        return f"{degrees}° {minutes:.1f}"

    latitude = to_dms(random.uniform(33.35, 35.4))
    longitude = to_dms(random.uniform(12.6, 21.6))
    return latitude, longitude


def generate_nationalities(nb_nationalities: int) -> str:
    nationalities = []
    for _ in range(nb_nationalities):
        length = random.randint(1, 2)
        nationalities.append("".join(random.choices(string.ascii_lowercase, k=length)))
    return ";".join(nationalities)


def generate_fictive_data(seed: str, nb_lines: int) -> list[OperationModel]:
    random.seed(seed)
    data = []
    for _ in range(nb_lines):
        nb_survivor, male, female, under_18, under_18_unacc, under_5, pregnant_women = (
            generate_survivor_counts()
        )
        latitude, longitude = generate_fictive_coordinates()
        nb_nationalities = random.randint(0, 27)
        op = OperationModel(
            date=generate_random_date().strftime("%d/%m/%Y"),
            type_ops=random.choice(["Rescue", "Transfer"]),
            nb_ops=random.randint(1, 7),
            nb_survivor=nb_survivor,
            male=male,
            female=female,
            under_18=under_18,
            under_18_unacc=under_18_unacc,
            under_5=under_5,
            pregnant_women=pregnant_women,
            latitude=latitude,
            longitude=longitude,
            wind_force=random.choice([random.randint(0, 10), None]),
            wave_height=random.choice([round(random.uniform(0, 5), 2), None]),
            boat_type=random.choice(["Rubber Boat", "Wooden Boat", None]),
            nb_nationalities=nb_nationalities,
            type_nationalities=generate_nationalities(nb_nationalities),
            transfer_type=random.choice(["To Aquarius", "To OV", None]),
            port_disembarkation=random.choice(["Marseille", "Venise", "La Valette", None]),
            image_src=random.choice([f"image_{random.randint(1, 100)}.jpg", None]),
            video_srv=random.choice([f"video_{random.randint(1, 100)}.mp4", None]),
            testimony_name=random.choice([f"Testimony {random.randint(1, 100)}", None]),
            testimony_src=random.choice([f"testimony_{random.randint(1, 100)}.txt", None]),
            fictif="FICTIF",
        )
        data.append(op)
    return data


def export_to_csv(data: list[OperationModel], fixture_directory: Path) -> Path:
    filename = f"{len(data)}_fictive_data.csv"
    with open(fixture_directory / filename, "w") as f:
        writer = csv.DictWriter(f, fieldnames=OperationModel.model_fields.keys())
        writer.writeheader()
        for op in data:
            writer.writerow(op.model_dump())
    return fixture_directory / filename


def generate_fictive_data_file(fixture_directory: Path, seed: str, nb_lines: int) -> Path:
    fictive_data = generate_fictive_data(seed, nb_lines)
    return export_to_csv(fictive_data, fixture_directory)


if __name__ == "__main__":
    args = get_args()
    script_directory = Path(__file__).parent
    fixture_directory = script_directory.parent / "fixtures"
    fixture_directory.mkdir(parents=True, exist_ok=True)
    generate_fictive_data_file(fixture_directory, args.seed, args.nb_lines)
