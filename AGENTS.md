# AGENTS.md

Consignes pour un assistant de code qui travaille dans ce dépôt. Elles complètent
[CONTRIBUTING.md](CONTRIBUTING.md), qui reste la règle.

- La pile : FastAPI dans `backend/`, React dans `frontend/`, Postgres. Détail dans
  [TECHNICAL.md](TECHNICAL.md).
- Avant de proposer un changement, lance les vérifications de TECHNICAL.md : elles doivent passer.
- Une issue à la fois. Ne touche que la zone de l'issue.
- Aucune donnée réelle, aucun secret, ni dans le code, ni dans les tests, ni dans les exemples.
- Le code en anglais ; les commentaires et la documentation en français.
- Un texte affiché passe par une clé et `t()` (`frontend/src/i18n/`), jamais en dur. Une
  langue que tu ne maîtrises pas reste absente, avec l'étiquette `traduction` : CONTRIBUTING.md
  (« Les langues »).
- Les mots du métier sont dans [docs/glossaire.md](docs/glossaire.md) : reprends-les.
- FastAPI : suis la doc officielle de la version installée (https://fastapi.tiangolo.com/).
  `Annotated` pour les dépendances, `lifespan` pour le démarrage (pas `on_event`, déprécié).
- React : pas de `useMemo` ni `useCallback` par défaut, seulement pour un besoin mesuré. Les
  appels à l'API passent par `frontend/src/api.ts` et TanStack Query, avec les types générés
  depuis le schéma de l'API (jamais écrits à la main : TECHNICAL.md, « Le contrat »). Les autres
  conventions sont dans TECHNICAL.md (« Les conventions »).
- **Les types ne se contournent jamais** : ni `any`, ni `as`, ni `!`, ni `@ts-ignore` en
  TypeScript ; ni `Any`, ni `cast`, ni `# type: ignore` en Python. Un type faux se corrige.
  Règles et outils : TECHNICAL.md (« Les types : aucun contournement »).
- Interface : suis [docs/design-system.md](docs/design-system.md). Les variables de
  `frontend/src/design/tokens.css`, jamais une valeur en dur ; `<Logo />` et `<Picto />` pour le
  logo et les pictos. « SOS MEDITERRANEE » s'écrit en majuscules, sans accent.
