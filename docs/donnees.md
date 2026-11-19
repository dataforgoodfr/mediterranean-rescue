# Les données de la carte actuelle

La carte actuelle lit un Google Sheet public, en trois onglets. C'est le point de départ du
modèle des opérations : on reprend ce schéma, sans rien de plus, et il évoluera quand les données
de SOS MEDITERRANEE arriveront. Relevé le 4 novembre 2026, sans recopier de valeurs ; les chiffres
ci-dessous comptent les cases remplies.

Le Sheet : `1opF61Qq2DgrJIP-kQD5-KHzC4xZkp2u_zqigTGk3V0I`, onglets `Data_operations`, `Other_data`,
`Data_ports`. Il n'est plus mis à jour depuis février 2024.

## Data_operations : les opérations (370 lignes, de mars 2016 à février 2024)

| Colonne | Type | Remplie | Sens |
|---|---|---|---|
| `date` | date `jj/mm/aaaa` | 370 | Le jour de l'opération |
| `type_ops` | `Rescue` ou `Transfer` | 370 | Sauvetage ou transfert (voir le glossaire) |
| `nb_ops` | entier, 1 à 7 | 370 | Le nombre d'opérations regroupées sur la ligne |
| `nb_survivor` | entier | 368 | Les personnes secourues |
| `male`, `female` | entier | 330 | Hommes, femmes (majeurs et mineurs) |
| `under_18` | entier | 324 | Mineurs (-18ans) |
| `under_18_unacc` | entier | 315 | Mineurs (-18ans) non accompagnés |
| `under_5` | entier | 311 | Enfants de moins de 5 ans |
| `pregnant_women` | entier | 273 | Femmes enceintes |
| `latitude`, `longitude` | texte, degrés et minutes (`33° 12.4`) | 358 | La position |
| `wind_force` | entier, 0 à 10 | 287 | La force du vent (sans doute l'échelle de Beaufort, à confirmer) |
| `wave_height` | décimal, 0 à 5 | 238 | La hauteur des vagues (sans doute en mètres, à confirmer) |
| `boat_type` | texte libre, 48 variantes | 306 | Le type d'embarcation secourue |
| `nb_nationalities` | entier, 0 à 27 | 306 | Le nombre de nationalités |
| `type_nationalities` | lettres séparées par `;` | 259 | Voir les pièges |
| `transfer_type` | texte, 2 variantes | 62 | Le type de transfert |
| `Port_disembarkation` | texte libre, 49 variantes | 307 | Le port de débarquement |
| `image_src`, `video_srv` | lien | 59, 28 | Photo et vidéo de l'opération |
| `testimony_name`, `testimony_src` | texte, lien | 4 | Un témoignage |
| trois colonnes sans nom | texte | 218 à 259 | Des copies de `type_nationalities` : à ignorer |

## Other_data : les autres événements (9 lignes, d'avril 2021 à juillet 2023)

| Colonne | Type | Sens |
|---|---|---|
| `date` | date `jj/mm/aaaa` | Le jour |
| `type` | `Shipwreck`, `Dead & Missing`, `Incident` | Naufrage, morts et disparus, incident |
| `latitude`, `longitude` | texte, degrés et minutes | La position |
| `wind_force`, `wave_height` | entier, décimal | La météo |
| `death_nb_people` | entier | Les morts et disparus |
| `inc_action` | texte | Ce qui s'est passé pendant l'incident |
| `shipwreck_nb` | entier | Le nombre de naufrages |
| `boat_involved` | texte | Les bateaux impliqués |
| `testimony_name`, `testimony_src`, `image_src`, `video_srv` | texte, liens | Témoignage, photo, vidéo |

`boat_type` existe mais est toujours vide ; les deux dernières colonnes n'ont ni nom ni valeur.

## Data_ports : les ports (24 lignes)

`nom`, `latitude`, `longitude` : le nom du port et sa position, en degrés et minutes.

## Les pièges

- **Inconnu reste vide, jamais zéro.** Beaucoup de cases sont vides (par exemple `pregnant_women`
  dans un quart des lignes) : une case vide n'est pas un zéro.
- **Les positions** sont en degrés et minutes décimales, sans N, S, E ni O : la carte actuelle les
  lit comme nord et est. À convertir en degrés décimaux pour la base.
- **Les nationalités** : SOS MEDITERRANEE ne publie que leur nombre, jamais leur détail. La base
  garde `nb_nationalities` et ne reprend pas `type_nationalities`, qui ne contient d'ailleurs pas
  de pays mais des lettres de colonnes (`m;n;ag`…).
- **Les ports** sont écrits librement dans les opérations (49 variantes) alors que `Data_ports`
  en liste 24 : il faudra les faire correspondre.
- **Les noms ne suivent pas une règle** : `video_srv` (pour vidéo), `Port_disembarkation` avec
  une majuscule, et `Incident` ou `incident` dans `type`. Le code de la carte actuelle lit même
  `transfertType` au lieu de `transfer_type`. Dans notre modèle, des noms en anglais, en
  `snake_case`, tous en minuscules.

## Données fictives

Des données fictives peuvent être générées avec [un script](../backend/scripts/generate_fictive_data.py).

Le fichier [backend/fixtures/3_fictive_data.csv](../backend/fixtures/3_fictive_data.csv) a été généré avec les commandes suivantes.

```bash
cd backend
uv run scripts/generate_fictive_data.py
```

On peut générer un fichier de `N` lignes avec une graine `graine` avec la commande

```bash
uv run scripts/generate_fictive_data.py -seed graine -nb_lines N
```

Cela va créer un fichier `backend/fixtures/N_fictive_data.csv`.

## Dans la base : la table `operation`

Le modèle `Operation` (`backend/app/models.py`) reprend les colonnes de `Data_operations`, avec
les mêmes noms, sauf :

- `type_ops` devient `operation_type`, en minuscules (`rescue`, `transfer`). Il est rangé comme
  du texte : un nouveau type, comme l'évacuation médicale, ne demandera pas de migration ;
- `video_srv` devient `video_src` ;
- `latitude` et `longitude` sont en degrés décimaux ;
- `type_nationalities` et ses copies ne sont pas repris (voir les pièges).

## Les eaux territoriales et la zone contiguë

Le script [build_maritime_zones.py](../backend/scripts/build_maritime_zones.py) télécharge deux
couches de Marine Regions et les écrit en GeoJSON, découpées à la Méditerranée centrale (8 à 23° E,
29,5 à 40° N) :

| Fichier | Couche | Zone |
|---|---|---|
| `territorial_seas.geojson` | Territorial Seas (12NM), version 4 | Les eaux territoriales, de 0 à 12 milles |
| `contiguous_zones.geojson` | Contiguous Zones (24NM), version 4 | La zone contiguë, une bande de 12 à 24 milles |

```bash
cd backend
uv run --group data python -m scripts.build_maritime_zones
```

Les fichiers ne sont pas encore dans le dépôt : où les mettre et que montrer du golfe de Syrte
attend une décision de SOS MEDITERRANEE (#82).

### La source

- Flanders Marine Institute (2023). Maritime Boundaries Geodatabase: Territorial Seas (12NM),
  version 4. Available online at https://www.marineregions.org/. https://doi.org/10.14284/633
- Flanders Marine Institute (2023). Maritime Boundaries Geodatabase: Contiguous Zones (24NM),
  version 4. Available online at http://www.marineregions.org/. https://doi.org/10.14284/630

Licence CC-BY 4.0 : réutilisation libre en citant la source. Marine Regions demande aussi de ne
pas redistribuer ses produits, et précise que ses limites n'ont aucune valeur juridique.

Le script passe par le service WFS de Marine Regions, qui sert la version 4 (vérifié le
18 novembre 2026 sur les identifiants et les surfaces des zones).

### Ce que le script change

- Les polygones sont découpés au cadre de la Méditerranée centrale, et réparés quand la source
  en donne un invalide (le 24 milles italien).
- Les contours sont simplifiés à environ 50 m près et les coordonnées arrondies à 4 décimales
  (environ 11 m), pour que chaque fichier reste sous 500 Ko.
- Seuls six attributs restent : `geoname`, `territory1`, `iso_ter1`, `sovereign1`, `iso_sov1`
  et `mrgid`, l'identifiant de la zone sur marineregions.org.

### Les pièges

- **La zone contiguë est une bande** : un point à moins de 24 milles est dans l'un **ou** l'autre
  fichier.
- **Le golfe de Syrte n'est dans aucun polygone.** Marine Regions trace les zones depuis les
  lignes de base que chaque État déclare, dont la ligne droite revendiquée par la Libye en
  travers du golfe (32°30' N), contestée par d'autres États. Tout le golfe derrière elle est un
  trou. Même chose, en plus petit, pour le golfe de Gabès.
