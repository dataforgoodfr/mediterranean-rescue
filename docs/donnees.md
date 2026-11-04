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
| `male`, `female` | entier | 330 | Hommes, femmes |
| `under_18` | entier | 324 | Mineurs |
| `under_18_unacc` | entier | 315 | Mineurs non accompagnés |
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
- **`type_nationalities` ne contient pas de pays**, mais des lettres de colonnes (`m;n;ag`…),
  sans doute celles du tableau de suivi de SOS MEDITERRANEE, une par nationalité. Et
  `nb_nationalities` ne correspond au nombre de ces lettres que dans 42 lignes sur 259. À
  confirmer avec SOS MEDITERRANEE avant de s'en servir (issue sur la liste des pays).
- **Les ports** sont écrits librement dans les opérations (49 variantes) alors que `Data_ports`
  en liste 24 : il faudra les faire correspondre.
- **Les noms ne suivent pas une règle** : `video_srv` (pour vidéo), `Port_disembarkation` avec
  une majuscule, et `Incident` ou `incident` dans `type`. Le code de la carte actuelle lit même
  `transfertType` au lieu de `transfer_type`. Dans notre modèle, des noms en anglais, en
  `snake_case`, tous en minuscules.
