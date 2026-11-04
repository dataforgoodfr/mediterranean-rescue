# Documentation technique

## La pile

- **FastAPI** et **SQLModel** pour le backend (l'API), **Postgres** pour la base.
- **React**, **Vite** et **TypeScript** pour le frontend, avec **TanStack Query** pour les appels à
  l'API et **React Router** pour les pages. La carte viendra avec **MapLibre**.
- **pre-commit**, **ruff**, **pytest**, **Oxlint**, **Vitest** et **Testing Library** pour les
  vérifications.

Le backend est une app FastAPI avec une seule route, `/api/health`, et la connexion à Postgres
prête à servir (`app/db.py`). Le frontend est l'app créée par `pnpm create vite --template
react-ts`, réduite à une page qui affiche l'état de l'API. Rien d'autre : chaque pièce arrive
par une issue.

Les conventions, pour que le code se ressemble :

- **Un appel à l'API** : une fonction dans `frontend/src/api.ts`, utilisée par `useQuery` (ou
  `useMutation`), jamais `fetch` dans un `useEffect`.
- **Une page** : un fichier dans `frontend/src/pages/` et une ligne dans `frontend/src/App.tsx`.
- **Pas de `any`** en TypeScript : le build refuse le `any` implicite, le lint le `any` écrit.
  `unknown` à la place, puis on vérifie le type.
- **Les tests du frontend** affichent un composant avec `renderAvecApp` (`frontend/src/test-utils.tsx`),
  qui fournit le cache de l'API et le routeur.
- **Les tests du backend** demandent `client` ou `session` (`backend/tests/conftest.py`) : une
  base SQLite en mémoire, neuve pour chaque test, remplace Postgres.

Pourquoi ces choix :

- **Le front et le back séparés**, pour qu'on puisse travailler sur l'un sans toucher à l'autre.
- **MapLibre** est libre et ne demande ni compte ni clé payante.
- **Docker** lance tout le projet avec une seule commande, quelle que soit la machine.

## Lancer le projet avec Docker

Il faut seulement [Git](https://git-scm.com/downloads) et
[Docker](https://docs.docker.com/get-started/get-docker/) :

```sh
git clone https://github.com/dataforgoodfr/mediterranean-rescue.git
cd mediterranean-rescue
docker compose -f docker-compose.dev.yaml up
```

Le premier lancement télécharge les images et prend quelques minutes. Ensuite :

- le site sur http://localhost:5173 : la page doit afficher « API : ok » ;
- l'API sur http://localhost:8000, et sa doc sur http://localhost:8000/api/docs (pas sur `/docs`,
  que la console de `fastapi dev` affiche) ;
- Postgres sur `localhost:5432`.

Un port déjà pris (« port is already allocated », souvent un Postgres déjà installé) ? Choisis-en
un autre dans un fichier `.env` à la racine, par exemple `DB_PORT=55432`. Les autres se
règlent de la même façon : `API_PORT` et `WEB_PORT` (modèle : `.env.example`). Sans Docker,
mets aussi ce port dans le `DATABASE_URL` de `backend/.env` (modèle : `backend/.env.example`).

Le code est monté dans les conteneurs : une modification relance l'API ou recharge la page.
Après un changement de dépendances, reconstruis les images et leurs paquets :
`docker compose -f docker-compose.dev.yaml up --build --renew-anon-volumes`.

Sous Linux, Docker crée `backend/.venv` et `frontend/node_modules` au nom de root : si `uv` ou
`pnpm` refusent ensuite d'y écrire sur ta machine, supprime-les (`sudo rm -rf backend/.venv
frontend/node_modules`).

`docker-compose.prod.yaml` sert au déploiement sur le Coolify de Data for Good : son mode
d'emploi est en tête du fichier. Dans Coolify, remplace l'adresse http générée dans « Domains »
par `https://rescue-atlas.services.d4g.fr`, celle des labels Traefik.

## Lancer le projet sans Docker

Pour les tests et l'éditeur, il faut de toute façon les outils sur ta machine :
[uv](https://docs.astral.sh/uv/getting-started/installation/) (il installe Python 3.15, celui
du projet), Node.js 26, la version LTS (22.22.2+ et 24.15+ marchent aussi, pas 23 ni 25, que les
outils de test refusent), et [pnpm](https://pnpm.io/installation) 12.

```sh
docker compose -f docker-compose.dev.yaml up -d db   # la base seule, ou ton propre Postgres

cd backend && uv sync && uv run fastapi dev          # http://127.0.0.1:8000/api/docs
```

Puis, depuis la racine, dans un autre terminal :

```sh
cd frontend && pnpm install && pnpm dev              # http://localhost:5173
```

Installe aussi les contrôles avant commit, une seule fois : `cd backend && uv run pre-commit install`.
Ils vérifient aussi le frontend : lance d'abord `pnpm install` dans `frontend/`, ou ajoute
`SKIP=oxlint` devant `git commit` si tu ne touches qu'au backend.

## Vérifier avant de pousser

```sh
# Dans backend/
uv run pre-commit run --all-files
uv run pytest

# Dans frontend/
pnpm lint
pnpm test
pnpm build
```

La CI relance sur chaque pull request ce qu'elle touche (backend, frontend, images Docker), et
pre-commit partout. On merge quand « CI terminée » et « titre » sont verts : le second vérifie que le
titre de la pull request suit les commits conventionnels. Chaque mois, Dependabot propose la
mise à jour des dépendances.

## Où est quoi

| Chemin | Rôle |
|---|---|
| `backend/app/` | L'API : `main.py` (les routes), `db.py` (la base), `config.py` (les réglages) |
| `backend/tests/` | Les tests du backend ; `conftest.py` fournit la base des tests |
| `frontend/src/` | L'app React : `App.tsx` (les pages), `pages/`, `api.ts` (les appels à l'API) |
| `frontend/src/design/` | Le design system : couleurs et tailles en variables, `Logo`, `Picto` ([docs/design-system.md](docs/design-system.md)) |
| `frontend/src/assets/` | Le logo, les 53 pictos, la police Raleway et sa licence (SIL OFL) |
| `docker-compose.dev.yaml` | Tout le projet pour développer, avec rechargement automatique |
| `docker-compose.prod.yaml` | Le projet en production |
| `data/` | Les données locales, jamais committées |
| `docs/` | Les données de la carte actuelle ([docs/donnees.md](docs/donnees.md)), le design system, la progression des bénévoles, le glossaire |
| `.github/` | CI, modèles d'issue et de pull request |

Code en anglais ; commentaires et documentation en français.
