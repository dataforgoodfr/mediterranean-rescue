# Cartographie des opérations historiques

POC associé au [ticket #64](https://github.com/dataforgoodfr/mediterranean-rescue/issues/64)

## La question

Peut-on reconstruire la carte historique des opérations de SOS MEDITERRANEE entre 2016 et 2024 et identifier les éventuelles anomalies spatiales et temporelles des données ?

## Ce que j'ai essayé

Avec Pandas, GeoPandas, Folium et Matplotlib : téléchargement et nettoyage du CSV, conversion des données en WGS84 (EPSG:4326), carte interactive avec filtres par année et type d'opération, analyse temporelle et recherche de doublons.

### Sources

- Données historiques des opérations de SOS MEDITERRANEE : Google Sheets public, onglet `Data_operations`. [Export CSV](https://docs.google.com/spreadsheets/d/1opF61Qq2DgrJIP-kQD5-KHzC4xZkp2u_zqigTGk3V0I/export?format=csv&gid=0). Licence inconnue.
- Fond cartographique : OpenStreetMap ([attribution et licence](https://www.openstreetmap.org/copyright), [conditions d'utilisation des tuiles](https://operations.osmfoundation.org/policies/tiles/))

### Exécution

Prérequis : `uv`. Depuis la racine du dépôt :

```bash
uv run --locked pocs/legacy-map/legacy_map.py
```

L'option `--refresh` force le téléchargement du CSV. Les données brutes (`data/legacy-map/raw/`) et les résultats (`data/legacy-map/output/`) sont ignorés par Git.

Résultats : carte `operations.html`, export `operations.geojson`, graphique `temporal_analysis.png`, statistiques `yearly_counts.csv` et `monthly_counts.csv`, doublons `potential_duplicates.csv`.

## La réponse

- **Complétude :** 370 enregistrements (403 opérations déclarées), du 7 mars 2016 au 6 février 2024. Les 358 positions renseignées sont numériquement valides (308 Rescue, 50 Transfer). Les 12 positions manquantes concernent uniquement des transferts. Aucune date ni géométrie invalide détectée.
- **Analyse temporelle :** baisse des enregistrements en 2018-2020, aucun transfert enregistré depuis 2020, 29 mois sans enregistrement sur 96, dont 10 consécutifs (octobre 2018 à juillet 2019). Ces absences ne prouvent pas une lacune de collecte.
- **Doublons :** aucune paire de lignes sources ne sont strictement identiques, 29 enregistrements partagent une position, dont 23 partagent également une date et un type d'opération.
- **Inspection visuelle :** un point de type `Transfer` se situe proche d'un port (Record ID 269, à date du 07 mai 2018). Un point de type `Rescue` se trouve hors de la zone habituelle d'opération (Record ID 358, à date du 02 novembre 2023). Aucun point trouvé sur les terres.
- **Validation :** exécution du pipeline et génération des exports vérifiées, contrôles pre-commit réussis.

## La suite

Valider les doublons potentiels, les périodes creuses et les positions atypiques avec SOS Méditteranée.
