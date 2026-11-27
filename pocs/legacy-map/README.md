# Cartographie des opérations historiques

POC associé au [ticket #64](https://github.com/dataforgoodfr/mediterranean-rescue/issues/64)

## La question

Peut-on reconstruire la carte historique des opérations de SOS Méditerranée entre 2016 et 2024 et identifier les éventuelles anomalies spatiales et temporelles des données ?

## Ce que j'ai essayé

Avec Pandas, GeoPandas, Folium et Matplotlib : téléchargement et nettoyage du CSV, conversion des données en degrés décimaux (WGS84, EPSG:4326), carte interactive avec filtres par année et type d'opération, analyse temporelle et identification des positions partagées.

### Sources

- Données historiques des opérations de SOS Méditerranée : Google Sheets public, onglet `Data_operations`. [Export CSV](https://docs.google.com/spreadsheets/d/1opF61Qq2DgrJIP-kQD5-KHzC4xZkp2u_zqigTGk3V0I/export?format=csv&gid=0). Licence inconnue.
- Fond cartographique : OpenStreetMap ([attribution et licence](https://www.openstreetmap.org/copyright), [conditions d'utilisation des tuiles](https://operations.osmfoundation.org/policies/tiles/))

### Exécution

Prérequis : `uv`. Depuis la racine du dépôt :

```bash
uv run --locked pocs/legacy-map/legacy_map.py
```

Pour afficher la carte :

```bash
uv run --no-project python -m http.server 8000 --bind 127.0.0.1 -d data/legacy-map/output
```

Ouvrir [http://localhost:8000/operations.html](http://localhost:8000/operations.html). L'ouvertude directe du HTML peut entraîner un blocage des tuiles OpenStreetMap. Arrêter le serveur avec `Ctrl+C`.

L'option `--refresh` force le téléchargement du CSV. Les données brutes (`data/legacy-map/raw/`) et les résultats (`data/legacy-map/output/`) sont ignorés par Git.

Résultats : carte `operations.html`, export `operations.geojson`, graphique `temporal_analysis.png`, statistiques `yearly_counts.csv` et `monthly_counts.csv`, analyse des positions partagées `shared_positions.csv`.

## La réponse

- **Complétude :** 370 enregistrements (403 opérations déclarées), du 7 mars 2016 au 6 février 2024. Les 358 positions renseignées sont numériquement valides (308 Rescue, 50 Transfer). Les 12 positions manquantes concernent uniquement des transferts. Aucune date ni géométrie invalide détectée.
- **Analyse temporelle :** baisse des enregistrements en 2018-2020. L'absence de transferts enregistrés depuis 2020 correspond à une erreur de saisie signalée dans la documentation du Monster sur Outline. Sur les 96 mois couverts, 29 sont sans enregistrement, dont 10 consécutifs (octobre 2018 à juillet 2019). Cette période correspond à l'interruption des missions en l'Aquarius et l'Ocean Viking (confirmé depuis le site SOS Méditerranée).
- **Positions partagées :** aucun doublon stricte sur l'ensemble des colonnes sources. 29 enregistrements partagent une position, dont 23 partagent également une date et un type d'opération. Aucun doublon potentiel n'est identifié après ajout du nombre de rescapés à la clé de comparaison.
- **Positions répétées :** 10 enregistrements de type 'Rescue', répartis en trois groupes de 6, 2 et 2 enregistrements, partagent des positions identiques à des dates différentes. Ces répétitions suggèrent une possible réutilisation des coordonnées ou un effet de leur précision, à confirmer par une validation métier.
- **Inspection visuelle :** un point de type 'Transfer' se situe proche d'un port (Record ID 269, à date du 07 mai 2018). Deux points de type 'Rescue' se trouve largement à l'écart de la zone habituelle d'opération (Record ID 149, à date du 17 août 2018 et Record ID 358, à date du 02 novembre 2023). Aucun point terrestre identifié visuellement.
- **Validation :** exécution du pipeline et génération des exports vérifiées, contrôles pre-commit réussis.

## La suite

Valider les positions répétées et positions atypiques avec SOS Méditerranée.
