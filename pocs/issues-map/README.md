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

Pour relancer (il faut `gh` connecté, Node 24 ou plus et pnpm) :

```sh
cd pocs/issues-map
pnpm install
pnpm refresh   # instantané GitHub + vignettes Penpot + contrôle des types + build
pnpm dev       # la page en local
```

`pnpm build` produit un seul fichier HTML, `dist/index.html`, qui embarque l'instantané et les
vignettes : on le publie tel quel, sans API derrière.

## La réponse

Oui, et sans service à faire tourner :

- **L'accueil, ce sont les maquettes.** En haut, les 6 objectifs (les épopées) avec leur
  avancement. Pour l'objectif choisi, ses planches Penpot portent les issues en pastilles
  numérotées, d'une couleur par état : à prendre, en cours, à préciser, faite. Un clic sur une
  pastille ouvre sa fiche à côté (qui est dessus, sur quel écran, statut du tableau) et le lien
  vers GitHub. Les issues sans écran sont listées sous les planches, celles à prendre d'abord.
  L'épopée #12 Transparence est posée sur 4 planches. L'épopée #11 Data management n'a pas encore
  de maquette du back-office (#104) : ses issues sont posées sur un schéma de travail du chemin de
  la donnée (sources, base, back-office, carte, analyses), dessiné dans `src/DataFlow.tsx` à partir
  des titres d'issues, à faire vérifier par l'équipe produit. Les autres épopées montrent leur liste.
- **La liste complète** : l'arbre des épopées, issues et sous-issues, avec filtres (statut,
  domaine front, back ou data, libres et Ready, fermées).

« À prendre » veut dire Ready et personne dessus ; une issue Ready déjà assignée compte « en cours ».

Limites :

- Un instantané, pas du direct : il faut relancer `pnpm refresh` pour voir les changements.
- Les vignettes Penpot datent de la dernière modification du fichier, pas du moment du téléchargement.
- Les repères se posent à la main dans `maquettes.json` : il faut les reprendre quand une planche change.

## La suite

- Si l'outil sert aux tech leads et au produit : poser les autres épopées sur leurs maquettes.
- Lire GitHub en direct plutôt qu'un instantané, si le besoin se confirme.
