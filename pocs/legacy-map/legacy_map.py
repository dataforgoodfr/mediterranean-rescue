# /// script
# requires-python = ">=3.12"
# dependencies = [
#     "folium>=1.0.0",
#     "geopandas>=1.2.0",
#     "mapclassify>=2.11.0",
#     "matplotlib>=3.11.2",
#     "pandas>=3.1.1",
#     "pyproj>=3.8.0",
#     "requests>=2.34.2",
# ]
# ///


import argparse
import math
import re
from pathlib import Path

import folium
import geopandas as gpd
import matplotlib.pyplot as plt
import pandas as pd
import requests
from branca.element import MacroElement, Template

DATA_DIR = Path(__file__).resolve().parents[2] / "data" / "legacy-map"
RAW_DIR = DATA_DIR / "raw"
OUTPUT_DIR = DATA_DIR / "output"

OPERATIONS_URL = (
    "https://docs.google.com/spreadsheets/d/"
    "1opF61Qq2DgrJIP-kQD5-KHzC4xZkp2u_zqigTGk3V0I/"
    "export?format=csv&gid=0"
)
OPERATION_COLORS = {"Rescue": "#D55E00", "Transfer": "#0072B2"}

GEOGRAPHIC_CRS = "EPSG:4326"

REQUIRED_COLUMNS = [
    "date",
    "type_ops",
    "nb_ops",
    "nb_survivor",
    "latitude",
    "longitude",
    "Port_disembarkation",
]

COORDINATE_PATTERN = re.compile(r"\s*(\d+)\s*°\s*(\d+(?:[.,]\d+)?)\s*['′]?\s*")


def report(title: str, *items: object) -> None:
    """Affiche une section du diagnostic."""

    print(f"\n--- {title} ---", *items, sep="\n")


def download_csv(url: str, path: Path, refresh: bool = False) -> Path:
    """Télécharge la source ou réutilise la copie locale."""

    if path.exists() and not refresh:
        print(f"Using cached file: {path}")

        return path

    print(f"Downloading: {url}")

    response = requests.get(url, timeout=60)
    response.raise_for_status()

    if "text/html" in response.headers.get("Content-Type", "").lower():
        raise ValueError("Expected a CSV file, received HTML.")

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(response.content)

    print(f"File saved to: {path}")

    return path


def explore_operations(df: pd.DataFrame) -> None:
    """Décrit les données brutes sans les modifier."""

    report("DATASET DIMENSIONS", f"Rows: {len(df)}", f"Columns: {len(df.columns)}")
    report("COLUMN NAMES", df.columns.tolist())
    report("COLUMN TYPES", df.dtypes.to_string())

    missing = df.isna().sum()

    report(
        "MISSING VALUES",
        pd.DataFrame(
            {
                "missing_count": missing,
                "missing_pct": (missing / len(df) * 100).round(2),
            }
        ).to_string(),
    )
    report("OPERATION TYPES", df["type_ops"].value_counts(dropna=False))

    lat, lon = df["latitude"].isna(), df["longitude"].isna()

    report(
        "MISSING COORDINATES",
        f"Missing latitude: {lat.sum()}",
        f"Missing longitude: {lon.sum()}",
        f"Missing at least one coordinate: {(lat | lon).sum()}",
        f"Missing both coordinates: {(lat & lon).sum()}",
    )

    for column in ("date", "latitude", "longitude"):
        report(f"SAMPLE {column.upper()} VALUES", df[column].dropna().head(10).tolist())

    report("OPERATION COUNTS", df["nb_ops"].value_counts(dropna=False))
    report("EXACT DUPLICATES", f"Duplicated rows: {df.duplicated().sum()}")


def parse_coordinate(value: object, max_degrees: int) -> float:
    """Convertit les degrés et minutes décimales en degrés décimaux."""

    match = COORDINATE_PATTERN.fullmatch(str(value))

    if not match:
        return math.nan

    degrees, minutes = int(match[1]), float(match[2].replace(",", "."))
    coordinate = degrees + minutes / 60

    return coordinate if 0 <= minutes < 60 and coordinate <= max_degrees else math.nan


def clean_operations(df: pd.DataFrame) -> pd.DataFrame:
    """Normalise les données sans supprimer de ligne."""

    missing_columns = set(REQUIRED_COLUMNS) - set(df.columns)

    if missing_columns:
        raise ValueError(f"Missing required columns: {sorted(missing_columns)}")

    data = (
        df[REQUIRED_COLUMNS]
        .rename(
            columns={
                "latitude": "latitude_raw",
                "longitude": "longitude_raw",
                "Port_disembarkation": "port_disembarkation",
            }
        )
        .copy()
    )

    data.insert(0, "record_id", range(1, len(data) + 1))
    data["date"] = pd.to_datetime(data["date"], format="%d/%m/%Y", errors="coerce")

    for column in ("type_ops", "port_disembarkation"):
        data[column] = data[column].str.strip()

    for column in ("nb_ops", "nb_survivor"):
        numeric = pd.to_numeric(data[column], errors="coerce")
        data[column] = numeric.where(numeric.ge(0) & numeric.mod(1).eq(0)).astype(
            "Int64"
        )

    for column, limit in (("latitude", 90), ("longitude", 180)):
        data[column] = data[f"{column}_raw"].map(
            lambda value, limit=limit: parse_coordinate(value, limit)
        )

    raw = data[["latitude_raw", "longitude_raw"]]
    missing = (
        raw.isna() | raw.apply(lambda col: col.str.strip().eq("")).fillna(False)
    ).any(axis=1)

    data["position_status"] = "valid"
    data.loc[data[["latitude", "longitude"]].isna().any(axis=1), "position_status"] = (
        "invalid"
    )
    data.loc[missing, "position_status"] = "missing"

    return data


def build_geodataframe(data: pd.DataFrame) -> gpd.GeoDataFrame:
    """Construit les points WGS84 pour les positions valides."""

    valid = data.loc[data["position_status"].eq("valid")].copy()

    return gpd.GeoDataFrame(
        valid,
        geometry=gpd.points_from_xy(valid["longitude"], valid["latitude"]),
        crs=GEOGRAPHIC_CRS,
    )


def validate_operations(data: pd.DataFrame, gdf: gpd.GeoDataFrame) -> None:
    """Affiche les diagnostics tabulaires et géographiques."""

    report("CLEANED DATASET", f"Rows: {len(data)}", f"Columns: {len(data.columns)}")
    report("CLEANED COLUMN TYPES", data.dtypes.to_string())
    report("POSITION STATUS", data["position_status"].value_counts())

    report(
        "DATE VALIDATION",
        f"Invalid dates: {data['date'].isna().sum()}",
        f"First date: {data['date'].min()}",
        f"Last date: {data['date'].max()}",
    )
    report(
        "OPERATION TYPE VALIDATION",
        f"Invalid operation types: {(~data['type_ops'].isin(OPERATION_COLORS)).sum()}",
    )
    report(
        "NUMERICAL VALIDATION",
        f"Missing operation counts: {data['nb_ops'].isna().sum()}",
        f"Non-positive operation counts: {data['nb_ops'].le(0).sum()}",
        f"Total operations: {data['nb_ops'].sum()}",
        f"Missing survivor counts: {data['nb_survivor'].isna().sum()}",
    )

    report(
        "GEOGRAPHICAL BOUNDS",
        *(
            f"{col}: {gdf[col].min():.6f} to {gdf[col].max():.6f}"
            for col in ("latitude", "longitude")
        ),
    )

    invalid = data.loc[
        data["position_status"].eq("invalid"),
        ["record_id", "latitude_raw", "longitude_raw"],
    ]

    report(
        "INVALID COORDINATES",
        "No invalid coordinates." if invalid.empty else invalid.to_string(index=False),
    )
    report(
        "GEODATAFRAME",
        f"Rows: {len(gdf)}",
        f"Columns: {len(gdf.columns)}",
        f"CRS: {gdf.crs}",
    )
    report("GEOMETRY TYPES", gdf.geom_type.value_counts())
    report(
        "GEOMETRY VALIDATION",
        f"Missing geometries: {gdf.geometry.isna().sum()}",
        f"Empty geometries: {gdf.geometry.is_empty.sum()}",
        f"Invalid geometries: {(~gdf.geometry.is_valid).sum()}",
    )
    report(
        "SPATIAL EXTENT",
        *(
            f"{name}: {value:.6f}"
            for name, value in zip(
                (
                    "Minimum longitude",
                    "Minimum latitude",
                    "Maximum longitude",
                    "Maximum latitude",
                ),
                gdf.total_bounds,
                strict=True,
            )
        ),
    )
    report("MAPPABLE RECORDS BY TYPE", gdf["type_ops"].value_counts())


def create_map(gdf: gpd.GeoDataFrame, output_path: Path) -> None:
    """Génère la carte avec filtres indépendants par année et type."""

    if gdf.empty:
        raise ValueError("No valid positions to display.")

    fields = ["record_id", "date", "type_ops", "nb_ops", "nb_survivor"]
    data = gdf[[*fields, "geometry"]].copy()

    data["year"] = data["date"].dt.year
    data["date"] = data["date"].dt.strftime("%d/%m/%Y")
    years = sorted(data["year"].dropna().astype(int).unique().tolist())

    map_object = folium.Map(
        tiles="OpenStreetMap", control_scale=True, prefer_canvas=True
    )

    layers = []

    for (year, operation_type), subset in data.groupby(["year", "type_ops"]):
        if operation_type not in OPERATION_COLORS:
            continue

        layer = folium.GeoJson(
            subset.to_json(),
            name=f"{year} - {operation_type}",
            control=False,
            marker=folium.CircleMarker(radius=5, fill=True),
            style_function=lambda feature, c=OPERATION_COLORS[operation_type]: {
                "color": "#333333",
                "fillColor": c,
                "weight": 0.8,
                "fillOpacity": 0.85,
            },
            tooltip=folium.GeoJsonTooltip(
                fields=fields,
                aliases=[
                    "Record ID",
                    "Date",
                    "Operation type",
                    "Number of operations",
                    "Number of survivors",
                ],
            ),
        ).add_to(map_object)
        layers.append(
            f'{{year: "{int(year)}", type: "{operation_type}", '
            f"layer: {layer.get_name()}, count: {len(subset)}}}"
        )

    min_x, min_y, max_x, max_y = gdf.total_bounds
    map_object.fit_bounds([[min_y, min_x], [max_y, max_x]])

    options = '<option value="all">All years</option>' + "".join(
        f'<option value="{year}">{year}</option>' for year in years
    )
    checks = "".join(
        f'<label><input type="checkbox" value="{kind}" checked> '
        f'<span style="color:{color}">●</span> {kind}</label><br>'
        for kind, color in OPERATION_COLORS.items()
    )
    map_object.get_root().html.add_child(
        folium.Element(f"""
        <div id="operation-filters" style="position:fixed;top:20px;right:20px;
            z-index:9999;background:white;color:#333;padding:15px;
            border:1px solid #999;border-radius:6px;min-width:180px;font-size:13px">
            <strong>Historical operations</strong><hr>
            <label for="year-filter">Year</label><br>
            <select id="year-filter" style="width:100%">{options}</select><hr>
            <strong>Operation type</strong><br>{checks}<hr>
            Visible records: <strong id="visible-count">0</strong>
        </div>
    """)
    )

    # Le contrôleur est rendu après les couches Leaflet.
    controller = MacroElement()
    controller.layers_js = "[" + ",".join(layers) + "]"
    controller._template = Template("""
        {% macro script(this, kwargs) %}
        const map = {{ this._parent.get_name() }};
        const layers = {{ this.layers_js }};
        const panel = document.getElementById("operation-filters");
        function update() {
            const year = panel.querySelector("select").value;
            const types = [...panel.querySelectorAll("input:checked")].map(el => el.value);
            let count = 0;
            for (const item of layers) {
                if ((year === "all" || year === item.year) && types.includes(item.type)) {
                    map.addLayer(item.layer);
                    count += item.count;
                } else {
                    map.removeLayer(item.layer);
                }
            }
            panel.querySelector("#visible-count").textContent = count;
        }
        panel.addEventListener("change", update);
        L.DomEvent.disableClickPropagation(panel);
        L.DomEvent.disableScrollPropagation(panel);
        update();
        {% endmacro %}
    """)

    controller.add_to(map_object)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    map_object.save(str(output_path))

    print(f"Map saved to: {output_path}")


def analyze_temporal(data: pd.DataFrame, output_dir: Path) -> None:
    """Exporte les statistiques annuelles et mensuelles et leur graphique."""

    data = data.loc[data["date"].notna()].copy()

    if data.empty:
        raise ValueError("No valid dates to analyze.")

    data["year"] = data["date"].dt.year
    data["month"] = data["date"].dt.to_period("M")

    for kind in OPERATION_COLORS:
        data[f"{kind.lower()}_records"] = data["type_ops"].eq(kind)

    for status in ("valid", "missing", "invalid"):
        data[f"{status}_positions"] = data["position_status"].eq(status)

    counts = {
        "record_count": ("record_id", "size"),
        "operation_count": ("nb_ops", "sum"),
    }

    yearly = (
        data.groupby("year")
        .agg(
            **counts,
            **{
                col: (col, "sum")
                for col in (
                    "rescue_records",
                    "transfer_records",
                    "valid_positions",
                    "missing_positions",
                    "invalid_positions",
                )
            },
        )
        .reindex(
            range(int(data["year"].min()), int(data["year"].max()) + 1), fill_value=0
        )
    )

    yearly.index.name = "year"
    yearly["position_coverage_pct"] = (
        100 * yearly["valid_positions"] / yearly["record_count"].replace(0, math.nan)
    ).round(2)

    monthly = (
        data.groupby("month")
        .agg(**counts)
        .reindex(
            pd.period_range(data["month"].min(), data["month"].max(), freq="M"),
            fill_value=0,
        )
    )

    monthly.index.name = "month"
    empty_months = monthly.loc[monthly["record_count"].eq(0)]

    report("YEARLY OPERATION COUNTS", yearly.to_string())
    report(
        "MONTHLY ANALYSIS",
        f"Number of months: {len(monthly)}",
        f"Months without records: {len(empty_months)}",
    )
    report("MONTHS WITHOUT RECORDS", empty_months.to_string())

    yearly.to_csv(output_dir / "yearly_counts.csv")
    monthly.to_csv(output_dir / "monthly_counts.csv")

    fig, ax = plt.subplots(figsize=(11, 5))

    ax.bar(
        yearly.index,
        yearly["rescue_records"],
        color=OPERATION_COLORS["Rescue"],
        label="Rescue",
    )

    ax.bar(
        yearly.index,
        yearly["transfer_records"],
        bottom=yearly["rescue_records"],
        color=OPERATION_COLORS["Transfer"],
        label="Transfer",
    )

    ax.set(
        title="Historical operation records by year",
        xlabel="Year",
        ylabel="Number of records",
        xticks=yearly.index,
    )

    ax.legend()
    ax.grid(axis="y", alpha=0.25)
    ax.set_axisbelow(True)

    fig.tight_layout()
    fig.savefig(output_dir / "temporal_analysis.png", dpi=150)

    plt.close(fig)


def analyze_shared_positions(
    gdf: gpd.GeoDataFrame,
    output_path: Path,
) -> None:
    """Identifie les positions partagées et les doublons potentiels."""

    data = pd.DataFrame(gdf.drop(columns="geometry"))

    keys = (
        data[["latitude", "longitude"]]
        .round(8)
        .assign(
            date=data["date"],
            type_ops=data["type_ops"],
            nb_survivor=data["nb_survivor"],
        )
    )

    spatial_keys = ["latitude", "longitude"]
    temporal_keys = [*spatial_keys, "date"]
    operation_keys = [*temporal_keys, "type_ops"]
    duplicate_keys = [*operation_keys, "nb_survivor"]

    # Identification des positions partagées
    for flag, columns, label in (
        ("same_position", spatial_keys, "position"),
        ("same_position_date", temporal_keys, "position and date"),
        (
            "same_position_date_type",
            operation_keys,
            "position, date and type",
        ),
    ):
        data[flag] = keys.duplicated(subset=columns, keep=False)
        print(f"Records sharing the same {label}: {data[flag].sum()}")

    # Un effectif inconnu ne permet pas de confirmer une égalité
    complete = keys[duplicate_keys].notna().all(axis=1)

    data["potential_duplicate"] = False
    data.loc[complete, "potential_duplicate"] = keys.loc[complete].duplicated(
        subset=duplicate_keys,
        keep=False,
    )

    print(f"Potential duplicate records: {data['potential_duplicate'].sum()}")

    # Nombre de dates distinctes pour chaque position
    data["distinct_dates"] = keys.groupby(spatial_keys)["date"].transform("nunique")

    data["same_position_different_dates"] = data["distinct_dates"].gt(1)

    shared = data.loc[data["same_position"]].copy()

    report(
        "POSITIONS SHARED ACROSS DIFFERENT DATES",
        f"Records: {data['same_position_different_dates'].sum()}",
    )

    repeated = shared.loc[shared["same_position_different_dates"]].sort_values(
        ["latitude", "longitude", "date"]
    )

    print(
        repeated[["record_id", "date", "type_ops", "distinct_dates"]].to_string(
            index=False
        )
    )

    shared.to_csv(output_path, index=False)

    print(f"Shared positions saved to: {output_path}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Explore historical SOS MEDITERRANEE operations."
    )
    parser.add_argument(
        "--refresh", action="store_true", help="Download the source CSV again."
    )

    args = parser.parse_args()

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    path = download_csv(
        OPERATIONS_URL, RAW_DIR / "operations.csv", refresh=args.refresh
    )

    df = pd.read_csv(path, dtype=str, encoding="utf-8-sig")

    explore_operations(df)

    cleaned = clean_operations(df)
    gdf = build_geodataframe(cleaned)

    validate_operations(cleaned, gdf)

    gdf.to_file(OUTPUT_DIR / "operations.geojson", driver="GeoJSON", index=False)

    create_map(gdf, OUTPUT_DIR / "operations.html")

    analyze_temporal(cleaned, OUTPUT_DIR)

    report("SHARED POSITIONS")

    analyze_shared_positions(gdf, OUTPUT_DIR / "shared_positions.csv")

    print(f"\nAll results saved to: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
