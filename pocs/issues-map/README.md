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
  pixels de planche (421 × 744). Ils sont posés à la main, pour l'épopée #12 Transparence seulement.

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

- **L'arbre** : les 6 épopées, puis leurs issues et sous-issues, avec pour chacune son statut,
  son itération, la personne assignée et ses étiquettes. Filtres : statut, domaine front, back ou
  data, « libres et Ready » (prêtes et personne dessus), fermées.
- **La vue maquettes** : l'épopée #12 sur 4 planches (carte, fiche d'une opération, liste,
  accueil), 19 issues en repères numérotés ; un clic ouvre l'issue. Les issues ouvertes de
  l'épopée sans écran évident sont listées à part.

Limites :

- Un instantané, pas du direct : il faut relancer `pnpm refresh` pour voir les changements.
- Les vignettes Penpot datent de la dernière modification du fichier, pas du moment du téléchargement.
- Les repères se posent à la main dans `maquettes.json` : il faut les reprendre quand une planche change.

## La suite

- Si l'outil sert aux tech leads et au produit : poser les autres épopées sur leurs maquettes.
- Lire GitHub en direct plutôt qu'un instantané, si le besoin se confirme.
