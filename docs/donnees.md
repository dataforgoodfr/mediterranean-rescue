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

## Le Monster : la feuille de suivi des sauvetages

SOS MEDITERRANEE suit chaque rotation dans un classeur Excel, le « Main rescue data sheet », que
l'équipe appelle « the Monster ». Ce sera la source de la carte à venir. Le gabarit a été reçu le
6 novembre 2026. Il peut encore contenir des données réelles : il ne va ni dans Git, ni chez un
bénévole, ni dans une IA. Seuls les noms des onglets et des colonnes sont décrits ici, relevés le
18 novembre 2026, sans aucune valeur. **Non validé par SOS MEDITERRANEE** : à relire avec l'équipe
des opérations.

### Le chemin de la donnée

À bord, deux formulaires Kobo sont remplis : un enregistrement par personne secourue, et un rapport
par sauvetage, écrit par l'équipe de sauvetage. Leur export brut arrive dans les onglets « Raw »,
des formules le nettoient dans les onglets « Clean », puis l'équipe reporte une ligne par sauvetage
dans `Rescues` et une ligne par transfert dans `Transfers`. C'est ce que dit la structure du fichier
(tableaux, formules, tableaux croisés) ; à confirmer avec l'équipe des opérations.

Trois identifiants relient les onglets : `ID-rotation-patrouille` (rotation et patrouille),
`ID-rot-pat-resc` (plus le numéro du sauvetage) et le numéro de bracelet de chaque personne.

### Les onglets

| Onglet | Une ligne, c'est | Colonnes | Pour la carte |
|---|---|---|---|
| `Dates` | une rotation : début, fin, numéro, débarquement | 5 | Oui : relier une opération à sa rotation |
| `Registration Form - Raw` | une personne secourue, export brut du formulaire d'enregistrement | 45 | Non : données personnelles |
| `Registration Form - Clean` | la même personne, avec des indicateurs calculés (moins de 18 ans, moins de 5 ans, non accompagné, femme seule) | 34 | Non : données personnelles. Seuls ses totaux comptent, par `Registration - Query` |
| `Registration - Query` | un sauvetage : les totaux de l'enregistrement | 12 | Oui, les totaux seulement |
| `SAR Form - Raw` | un sauvetage, export brut du rapport de l'équipe de sauvetage | 153 | Non : rapport d'opération interne |
| `SAR Form - Clean` | le même rapport, nettoyé | 156 | Non : rapport d'opération interne |
| `Rescues` | un sauvetage, la synthèse | 64 | Oui : la source principale |
| `Transfers` | un transfert reçu d'un autre navire | 74 nommées, 11 sans nom | Oui |
| `Nationalities`, `Nationalities - per rescue` | tableaux croisés des nationalités, sur `Registration Form - Clean` | - | Non : on ne publie que le nombre de nationalités |
| `Settings` | des listes de choix | 1 | Non |

Les colonnes écartées le sont en bloc : celles des formulaires d'enregistrement (âge, genre,
famille, pays, vulnérabilités de chaque personne) sont des données personnelles, et celles du
rapport de sauvetage (état du bateau, déroulé, équipements, incidents, photos) décrivent le travail
interne de l'équipe. Rien de tout cela ne va sur la carte.

### `Rescues` et `Transfers` : ce que la carte reprend

| Colonne du Monster | Dans la carte actuelle | Remarque |
|---|---|---|
| `Date` | `date` | |
| `ID-rot-pat-resc` | (nouveau) | L'identifiant du sauvetage, pour relier les onglets. Pas publié |
| onglet `Rescues` ou `Transfers` | `type_ops` | Le type vient de l'onglet |
| `Nb. Ops.` | `nb_ops` | |
| `Total Pers. rescued`, `Total Pers. transferred` | `nb_survivor` | |
| `Male`, `Female` | `male`, `female` | |
| `< 18`, `< 18 Unacc.`, `< 5` | `under_18`, `under_18_unacc`, `under_5` | |
| `Pregnant Women` | `pregnant_women` | |
| `Latitude`, `Longitude` | `latitude`, `longitude` | Format à vérifier (degrés et minutes ou décimaux) |
| `Wind force (bft)` | `wind_force` | Confirme l'échelle de Beaufort |
| `Wave height (m)` | `wave_height` | Confirme les mètres |
| `Type of boat in distress` | `boat_type` | |
| `Port of disembarkation` | `Port_disembarkation` | |
| `Type` (dans `Transfers`) | `transfer_type` | L'onglet a deux colonnes `Type`, autour de `Name` : laquelle est le type de transfert, à vérifier |
| colonnes par pays (dans `Transfers`), `Nationalities - per rescue` | `nb_nationalities` | Le nombre seulement, jamais le détail |

`Rescues` ajoute des colonnes que la carte actuelle n'a pas : les personnes vulnérables (`Single
women - adults`, `Single women (adults and minor) with a child`, `Disabled`), les blessés graves
(`Injured/heavy medical case`), les morts constatés (`Dead witnessed`), les personnes tombées à l'eau
(`Man overboard (MoB)`), le vent (`Wind direction (°)`), le lieu, la date et l'heure de départ
déclarés, les totaux sauvetages et transferts additionnés. Les publier ou non est à décider avec
SOS MEDITERRANEE.

Restent internes : la référence MSF, le cas SAR, les embarcations de sauvetage engagées
(`RIB 1` à `RIB 3`), les navires présents, l'alerte (source, heure, position reçue), les garde-côtes
libyens sur place, les durées d'opération, les commentaires. Dans `Transfers`, le nom et le MMSI du
navire qui transfère ne sont pas publiés.

### Ce qui reste à vérifier

- Des formules sont cassées (`#REF!`) : la colonne `ID-rot-pat-resc` de `Rescues` et de
  `Transfers` pointe vers `Registration - Query`, et une colonne de `Registration Form - Clean`
  vers une colonne disparue.
- `Registration - Query` n'a aucune formule : ses totaux semblent recopiés à la main, ou venir
  d'une requête qui n'est pas dans le fichier.
- Les 11 colonnes sans nom de `Transfers`.

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
