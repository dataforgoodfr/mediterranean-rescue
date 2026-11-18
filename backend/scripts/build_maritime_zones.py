"""Construit les GeoJSON des eaux territoriales et de la zone contiguë de la Méditerranée centrale.

Source : Marine Regions (Flanders Marine Institute), version 4, CC-BY 4.0.
"""

import argparse
import json
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import urlopen

from shapely import get_parts, make_valid, set_precision, unary_union
from shapely.geometry import MultiPolygon, Polygon, box, mapping, shape

# Le service WFS de Marine Regions : il sert les couches en GeoJSON, sans formulaire.
WFS_URL = "https://geo.vliz.be/geoserver/MarineRegions/wfs"

# La Méditerranée centrale : longitude min, latitude min, longitude max, latitude max (degrés).
CENTRAL_MEDITERRANEAN_BBOX = (8.0, 29.5, 23.0, 40.0)

# Les couches à télécharger : eaux territoriales (0 à 12 milles), zone contiguë (12 à 24 milles).
TERRITORIAL_SEAS_LAYER = "MarineRegions:eez_12nm"
CONTIGUOUS_ZONES_LAYER = "MarineRegions:eez_24nm"

# Pour que chaque fichier reste sous 500 Ko (pre-commit refuse les plus gros) : les contours sont
# simplifiés à environ 50 m près et les coordonnées arrondies à 4 décimales (environ 11 m).
SIMPLIFY_TOLERANCE_DEGREES = 0.0005
COORDINATE_GRID_DEGREES = 0.0001

# Les attributs gardés : le nom de la zone, le territoire et l'État dont il dépend (nom et code
# ISO), et l'identifiant Marine Regions, qui retrouve le polygone sur marineregions.org.
KEPT_PROPERTIES = ("geoname", "territory1", "iso_ter1", "sovereign1", "iso_sov1", "mrgid")

# Le fichier écrit pour chaque couche.
OUTPUT_FILES = {
    TERRITORIAL_SEAS_LAYER: "territorial_seas.geojson",
    CONTIGUOUS_ZONES_LAYER: "contiguous_zones.geojson",
}


def fetch_layer(layer: str) -> dict[str, object]:
    """Télécharge les polygones de la couche qui touchent la Méditerranée centrale."""
    query = urlencode(
        {
            "service": "WFS",
            "version": "1.0.0",
            "request": "GetFeature",
            "typeName": layer,
            "outputFormat": "application/json",
            "bbox": ",".join(str(value) for value in CENTRAL_MEDITERRANEAN_BBOX),
        }
    )
    with urlopen(f"{WFS_URL}?{query}", timeout=120) as response:
        layer_data: dict[str, object] = json.load(response)
    return layer_data


def clip_features(layer_data: dict[str, object]) -> list[dict[str, object]]:
    """Coupe chaque polygone au cadre de la Méditerranée centrale.

    Le filtre `bbox` du WFS choisit les pays qui touchent le cadre, mais les renvoie entiers.
    """
    features = layer_data["features"]
    if not isinstance(features, list):
        raise ValueError("La réponse du WFS n'a pas de liste `features`.")
    frame = box(*CENTRAL_MEDITERRANEAN_BBOX)
    clipped = []
    for feature in features:
        # `make_valid` : certains polygones de la source se croisent eux-mêmes (le 24 milles
        # italien), et une intersection sur un polygone invalide peut perdre des morceaux.
        geometry = make_valid(shape(feature["geometry"])).intersection(frame)
        # La découpe peut laisser des lignes ou des points le long du cadre, à côté des
        # surfaces : on ne garde que les surfaces, sinon QGIS ou la carte n'affichent rien.
        geometry = unary_union(
            [part for part in get_parts(geometry) if isinstance(part, Polygon | MultiPolygon)]
        )
        # Un pays qui touche à peine le cadre peut n'y laisser aucune surface.
        if geometry.is_empty:
            continue
        clipped.append(
            {"type": "Feature", "properties": feature["properties"], "geometry": mapping(geometry)}
        )
    return clipped


def shrink_features(features: list[dict[str, object]]) -> list[dict[str, object]]:
    """Allège les polygones : contours simplifiés, coordonnées arrondies."""
    shrunk = []
    for feature in features:
        # `preserve_topology` : un polygone simplifié ne se croise jamais lui-même.
        geometry = shape(feature["geometry"]).simplify(
            SIMPLIFY_TOLERANCE_DEGREES, preserve_topology=True
        )
        geometry = set_precision(geometry, COORDINATE_GRID_DEGREES)
        shrunk.append({**feature, "geometry": mapping(geometry)})
    return shrunk


def keep_properties(feature: dict[str, object]) -> dict[str, object]:
    properties = feature["properties"]
    if not isinstance(properties, dict):
        raise ValueError("Un polygone du WFS n'a pas d'attributs.")
    return {**feature, "properties": {key: properties[key] for key in KEPT_PROPERTIES}}


def write_geojson(features: list[dict[str, object]], path: Path) -> None:
    collection = {"type": "FeatureCollection", "features": features}
    # Sans espaces pour gagner de la place ; le saut de ligne final, pour le hook end-of-file-fixer.
    path.write_text(json.dumps(collection, separators=(",", ":")) + "\n")


def get_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Télécharge les eaux territoriales et la zone contiguë de la Méditerranée "
        "centrale (Marine Regions) et les écrit en GeoJSON"
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path(__file__).parent.parent / "data",
        help="Le dossier où écrire les fichiers (défaut : backend/data/)",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = get_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)
    for layer, filename in OUTPUT_FILES.items():
        features = shrink_features(clip_features(fetch_layer(layer)))
        path = args.output_dir / filename
        write_geojson([keep_properties(feature) for feature in features], path)
        print(f"{path} : {len(features)} polygones, {path.stat().st_size // 1024} Ko")
