# Atlas des issues

## La question

Peut-on rendre les issues du projet lisibles d'un coup d'œil, sans quitter GitHub comme source :
les épopées, leurs issues et sous-issues sur tous les niveaux, et les issues posées sur les
maquettes Penpot, comme on le faisait dans l'ancien FigJam ?

## Ce que j'ai essayé

Une petite page React, Vite et TypeScript (les versions de `frontend/`), en lecture seule.

- **Les issues** : `scripts/snapshot.mjs` lit ce dépôt et le [tableau 44](https://github.com/orgs/dataforgoodfr/projects/44)
  avec `gh api graphql` (issue parente, sous-issues, type d'issue, champs Status, Iteration et Size),
  et écrit un instantané JSON. Il n'écrit jamais dans GitHub.
- **Les maquettes** : Penpot garde une vignette PNG de chaque planche. `scripts/boards.mjs` les
  télécharge par leur identifiant d'asset, listé dans `maquettes.json`. Trouver ces identifiants
  demande d'être connecté à Penpot : `scripts/penpot-assets.js`, à coller dans la console du
  navigateur. L'instance ne délivre pas de jeton d'accès.
- **Les repères** : `maquettes.json` dit, pour chaque issue placée, sa planche et sa position en
  pixels de planche (421 × 744), posés à la main ; pour le schéma de la donnée, seulement sa zone.

Les fichiers téléchargés vont dans `data/issues-map/` à la racine du dépôt, que Git ignore.

`pnpm check` (lancé avant chaque build) vérifie que `maquettes.json` colle encore à GitHub : une
issue posée qui n'existe plus, une planche ou une zone inconnue arrêtent le build ; une issue
posée hors de son objectif s'affiche en avertissement.

Pour relancer (il faut `gh` connecté, Node 24 ou plus et pnpm) :

```sh
cd pocs/issues-map
pnpm install
pnpm refresh   # instantané GitHub + vignettes Penpot + contrôle des types + build
pnpm dev       # la page en local
```

`pnpm build` produit un seul fichier HTML, `dist/index.html`, qui embarque l'instantané et les
vignettes : on le publie tel quel, sans API derrière.

### Mise à jour automatique, chaque heure

Le workflow `.github/workflows/issues-map.yml` relance `pnpm refresh` chaque heure et publie la page
sur GitHub Pages. Il ne fait rien tant que ces réglages manquent ; un admin de `dataforgoodfr` les
pose une fois :

1. **Créer une GitHub App** dans l'organisation (Settings > Developer settings > GitHub Apps), sans
   webhook, avec en lecture seule : *Organization permissions > Projects* et *Repository
   permissions > Issues* (*Metadata* suit). La doc GitHub recommande une App pour lire un projet
   d'organisation depuis un workflow, le `GITHUB_TOKEN` n'y ayant pas accès.
2. **L'installer** sur le seul dépôt `mediterranean-rescue`.
3. Dans le dépôt, *Settings > Secrets and variables > Actions* : la variable
   `ISSUES_MAP_APP_CLIENT_ID` (le Client ID de l'App) et le secret `ISSUES_MAP_APP_PRIVATE_KEY` (sa
   clé privée).
4. *Settings > Pages > Source* : « GitHub Actions ».

Ce qui reste à la main : poser une nouvelle issue sur une maquette ou un schéma (`maquettes.json`),
compléter les fiches d'écran, et mettre à jour les identifiants des vignettes Penpot quand une
planche change (`scripts/penpot-assets.js`). Une issue pas encore posée apparaît quand même dans
« Sans écran ». Si une vignette Penpot n'est plus servie, le run échoue et la page publiée reste
celle de l'heure d'avant.

## La réponse

Oui, et sans service à faire tourner :

- **L'accueil, ce sont les maquettes.** En haut, les 6 objectifs (les épopées) avec leur
  avancement. Pour l'objectif choisi, ses planches Penpot portent les issues en pastilles
  numérotées, d'une couleur par état : à prendre, en cours, à préciser, faite. Un clic sur une
  pastille ouvre sa fiche à côté (qui est dessus, sur quel écran, statut du tableau) et le lien
  vers GitHub. Les issues sans écran sont listées sous les planches, celles à prendre d'abord.
  L'épopée #12 Transparence est posée sur 6 planches (4 de téléphone, 2 d'ordinateur), et #14 Levée
  de fonds sur la maquette de la carte. Les objectifs sans maquette d'écran sont posés sur des schémas
  de travail dessinés dans `src/Schemas.tsx` à partir des titres d'issues, à faire vérifier par
  l'équipe produit : #11 Data management sur le chemin de la donnée, #15 Cybersécurité en calque sur
  ce même chemin, #77 Socle sur le chemin d'une contribution, #13 Plaidoyer sur le parcours d'un
  lecteur, de la carte à l'argument.
- **Sous chaque maquette, ce qu'il faut pour que l'écran existe** (suggestion de Julien) : la source
  des données réelles, les données fictives, la maquette validée ou non, les tickets d'API back-end
  et de front. API, front et maquette se déduisent des étiquettes `back`, `front` et `design` des
  issues posées sur l'écran, complétées à la main dans `maquettes.json` (`ecran`). Ce que personne
  n'a renseigné s'affiche « inconnu ».
- **Les jalons** (P0 · MVP, P1, P2, P3, dans l'ordre de leur échéance) : un clic estompe tout ce qui
  n'est pas dans le jalon, pour voir ce qu'on fait en premier.
- **La liste complète** : l'arbre des épopées, issues et sous-issues, avec les mêmes quatre états
  et les mêmes jalons que les maquettes, plus les blocages, le domaine et les issues fermées.
- **Un lien vers chaque vue** : l'objectif, l'issue ouverte et les filtres vivent dans l'adresse
  (`#maquettes?o=11&i=58&j=P0 · MVP`). Un lien s'envoie tel quel, un rechargement garde la vue,
  le bouton Retour revient à l'objectif d'avant.

« À prendre » veut dire Ready et personne dessus ; une issue Ready déjà assignée compte « en cours ».

Pour guider de bout en bout :

- **Une visite guidée** en 11 étapes se lance à la première ouverture (puis par le bouton « Visite
  guidée ») : objectifs, jalons, couleurs, pastilles, fiche, prendre une issue, ce qu'il faut pour un écran,
  issues sans écran, liste complète, aide.
- **Un panneau d'aide** (bouton « Aide » ou touche « ? ») : lire la page, les quatre couleurs,
  prendre une issue, d'où viennent les données.
- **Des captures de GitHub** (`src/guide/`, prises le 22 novembre 2026 sur le dépôt et le tableau 44,
  sans être connecté) montrent dans la visite, l'aide et la fiche à quoi ressemble chaque geste :
  une épopée et ses sous-issues, le tableau, le côté d'une issue, la liste « Prête à prendre », un
  « Je prends ». À refaire quand GitHub change d'apparence.
- **Les blocages** : une issue qui attend une autre (« Blocked by » sur GitHub) porte un contour en
  pointillés, et sa fiche propose d'ouvrir celle qui la bloque.
- **Des aides en place** : infobulle au survol d'une pastille, « ? » à côté de la légende et des
  issues sans écran, et dans chaque fiche la prochaine action possible selon l'état.
- **La légende filtre** : un clic sur une couleur estompe les autres pastilles.
- **Des animations courtes** : l'entrée des planches puis des pastilles au premier chargement
  seulement, puis de simples fondus quand on change d'objectif ou de jalon ; des fondus seuls
  quand le système demande moins de mouvement.

Limites :

- Un instantané, pas du direct : il faut relancer `pnpm refresh` pour voir les changements.
- Les vignettes Penpot datent de la dernière modification du fichier, pas du moment du téléchargement.
- Les repères se posent à la main dans `maquettes.json` : il faut les reprendre quand une planche change.

## La suite

- Si l'outil sert aux tech leads et au produit : poser les autres épopées sur leurs maquettes.
- Lire GitHub en direct plutôt qu'un instantané, si le besoin se confirme.
