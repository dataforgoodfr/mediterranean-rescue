# Documentation technique

## La pile

- **FastAPI** et **SQLModel** pour le backend (l'API), **Postgres** pour la base.
- **React**, **Vite** et **TypeScript** pour le frontend, avec **TanStack Query** pour les appels à
  l'API et **React Router** pour les pages. La carte viendra avec **MapLibre**.
- **pre-commit**, **ruff**, **mypy**, **pytest**, **Oxlint**, **Vitest** et **Testing Library** pour
  les vérifications.

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
- **Les tests du frontend** affichent un composant avec `renderWithProviders` (`frontend/src/test-utils.tsx`),
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
uv run mypy
uv run pytest

# Dans frontend/
pnpm lint
pnpm test
pnpm build
```

La CI relance sur chaque pull request ce qu'elle touche (backend, frontend, images Docker), et
pre-commit partout. On merge quand « CI done » et « pr-title » sont verts : le second vérifie que le
titre de la pull request suit les commits conventionnels. Chaque mois, Dependabot propose la
mise à jour des dépendances.

## Le contrat entre l'API et le frontend

Les types de l'API ne s'écrivent qu'une fois, dans le backend (les modèles pydantic de
`backend/app/`). Le frontend tire les siens du schéma OpenAPI, comme le conseille FastAPI
(https://fastapi.tiangolo.com/advanced/generate-clients/) :

```sh
# 1. Dans backend/ : écrire le schéma de l'API dans backend/openapi.json
uv run python -m app.openapi_schema
# 2. Dans frontend/ : en tirer les types TypeScript, dans src/api/schema.ts
pnpm api:types
```

Les deux fichiers sont versionnés et ne se retouchent jamais à la main. Un test du backend
échoue si `openapi.json` est en retard sur l'API, et `pnpm api:check` échoue si `schema.ts`
est en retard sur `openapi.json`. pre-commit lance les deux quand un fichier de l'API ou du
schéma change, et la CI aussi. Le front utilise ces types dans `src/api.ts` : quand l'API ajoute,
retire ou change un champ, tsc montre chaque endroit du front à reprendre.

Le générateur, [openapi-typescript](https://openapi-ts.dev/), vit dans `frontend/tools/api-types/`,
avec son propre TypeScript 6 : TypeScript 7, celui du frontend, n'a plus l'API JavaScript dont
il a besoin. On le ramènera dans `frontend/` quand il saura lire TypeScript 7.

## Les types : aucun contournement

Les types du frontend et du backend se vérifient à chaque commit et en CI, sans échappatoire. Un
type qui ne correspond pas se corrige, même si ça prend du temps ; il ne se fait jamais taire.

- **TypeScript** : `tsc` en mode `strict`, avec `noUncheckedIndexedAccess` (une case d'un
  tableau peut être vide). Oxlint lit les types (`--type-aware`) et refuse `any`, toute
  assertion `as` (sauf `as const`), l'assertion non nulle `!`, et toute valeur `any` qui circule
  (`no-unsafe-*`). Les règles sont dans `frontend/.oxlintrc.json`.
- **Python** : mypy en mode `strict`, avec le plugin de pydantic, refuse un `Any` écrit et une
  fonction sans types. Les réglages sont dans `backend/pyproject.toml`.
- **Partout** : le hook pre-commit « no type suppressions » refuse `# type: ignore`,
  `# mypy:`, `# pyright:`, `@no_type_check`, l'import de `cast` depuis typing, `@ts-ignore`,
  `@ts-nocheck`, `@ts-expect-error`, et les commentaires `oxlint-disable` et `eslint-disable`.
  Une exception à une règle se déclare dans `frontend/.oxlintrc.json` (`overrides`), où elle se
  relit.

Ce qui arrive de l'extérieur (une réponse de l'API, un fichier) est de type `unknown` en
TypeScript et `object` en Python, puis se vérifie champ par champ (`frontend/src/parse.ts`). Pour
une variable CSS passée dans `style`, on l'ajoute au type de React
(`frontend/src/design/css-variables.d.ts`) au lieu de forcer le type.

### Typer une donnée qui vient de l'extérieur

Une réponse de l'API, un fichier ou un champ de formulaire ne sont pas encore du type qu'on
attend : on ne le suppose pas avec `as` ou `cast`, on le vérifie. En TypeScript, la valeur entre
en `unknown`, puis chaque champ se teste ; une fois testé, TypeScript connaît son type.

```ts
import { isRecord, parseJson } from './parse'

type Port = { name: string; latitude: number; longitude: number }

export function parsePort(text: string): Port | null {
  const raw = parseJson(text) // unknown : on ne sait encore rien
  if (!isRecord(raw)) return null
  const { name, latitude, longitude } = raw // chacun est unknown
  if (typeof name !== 'string' || typeof latitude !== 'number' || typeof longitude !== 'number') return null
  return { name, latitude, longitude } // ici, TypeScript sait que les types sont justes
}

// Une case d'un tableau peut être vide (noUncheckedIndexedAccess) : on le traite.
export function firstPortName(ports: Port[]): string {
  const first = ports[0]
  return first ? first.name : 'no port'
}
```

En Python, c'est la même idée avec `object` et `isinstance` :

```python
def parse_port(text: str) -> Port | None:
    raw: object = json.loads(text)
    if not isinstance(raw, dict):
        return None
    name = raw.get("name")
    latitude = raw.get("latitude")
    longitude = raw.get("longitude")
    if not isinstance(name, str):
        return None
    if not isinstance(latitude, float | int) or not isinstance(longitude, float | int):
        return None
    return Port(name=name, latitude=float(latitude), longitude=float(longitude))
```

Ces deux exemples passent tous les contrôles du dépôt (tsc, oxlint, mypy, le hook). Pour une
réponse de l'API, le type attendu vient de `src/api/schema.ts`, jamais d'un type écrit à la main.
Bloqué malgré tout ? Écris-le dans l'issue ou sur le [canal](https://mattermost.services.dataforgood.fr/data-for-good/channels/15-mediterranean-rescue-onboarding) : une vraie exception se discute, puis
se déclare dans `frontend/.oxlintrc.json` (`overrides`, avec la raison), où elle se relit.

Ce que les outils ne voient pas, et que la relecture vérifie : une déclaration `declare` ou un
ajout à un type existant (comme `css-variables.d.ts`), une garde `x is T` dont le corps ment, et
en Python une valeur `Any` venue d'une bibliothèque (`json.loads`, `TestClient.json()`) : mypy
ne refuse que le `Any` écrit, pas celui qui circule.

## Les langues

L'app est en anglais (la langue par défaut) et en français. D'autres langues suivront : l'arabe,
que les équipes de SOS utilisent beaucoup, puis l'italien et l'allemand. Tout est dans
`frontend/src/i18n/`, sans bibliothèque : une clé par texte, un fichier par langue.

```tsx
// 1. frontend/src/i18n/keys.ts : la clé, en anglais, avec une note pour qui traduira
'map.legend': 'Le titre de la légende de la carte',

// 2. en.ts et fr.ts (et ar.ts si tu le parles) : le texte
'map.legend': 'Legend',

// 3. Dans le composant
const t = useTranslation()
return <h2>{t('map.legend')}</h2>
```

- La langue vient du navigateur (`detectLanguage(navigator.languages)` dans `main.tsx`).
  `LanguageProvider` la reporte sur `<html lang dir>` : l'arabe passe la page en `dir="rtl"`.
- Un texte peut porter des valeurs : `'API : {status}'`, puis `t('home.apiStatus', { status })`.
- Une clé absente d'une langue s'affiche en anglais, puis en français, puis `[la.cle]` : un oubli
  se voit sans casser l'app. `pnpm i18n:missing` liste ce qui manque, langue par langue.
- Dans les tests, `renderWithProviders` affiche en français ;
  `renderWithProviders(<App />, { language: 'en' })` pour une autre langue.
- **Une langue de plus** (italien, allemand…) : un fichier comme `fr.ts` (par exemple `it.ts`),
  puis une entrée dans `translations` et une dans `LANGUAGES` (`frontend/src/i18n/translate.ts`).
  Une langue qui s'écrit de droite à gauche s'ajoute aussi à `RIGHT_TO_LEFT`.

## Où est quoi

| Chemin | Rôle |
|---|---|
| `backend/openapi.json` | Le schéma OpenAPI de l'API, généré (`python -m app.openapi_schema`) |
| `frontend/src/api/schema.ts` | Les types TypeScript de l'API, générés depuis ce schéma (`pnpm api:types`) |
| `frontend/tools/api-types/` | Le générateur de ces types, avec son TypeScript 6 |
| `backend/app/` | L'API : `main.py` (les routes), `db.py` (la base), `config.py` (les réglages) |
| `backend/tests/` | Les tests du backend ; `conftest.py` fournit la base des tests |
| `frontend/src/` | L'app React : `App.tsx` (les pages), `pages/`, `api.ts` (les appels à l'API) |
| `frontend/src/i18n/` | Les langues : les clés des textes, une traduction par langue, `useTranslation` |
| `frontend/src/design/` | Le design system : couleurs et tailles en variables, `Logo`, `Icon` ([docs/design-system.md](docs/design-system.md)) |
| `frontend/src/assets/` | Le logo, les 53 pictos, la police Raleway et sa licence (SIL OFL) |
| `docker-compose.dev.yaml` | Tout le projet pour développer, avec rechargement automatique |
| `docker-compose.prod.yaml` | Le projet en production |
| `data/` | Les données locales, jamais committées |
| `docs/` | Les données de la carte actuelle ([docs/donnees.md](docs/donnees.md)), le design system, la progression des bénévoles, le glossaire |
| `.github/` | CI, modèles d'issue et de pull request |

**Code en anglais** : noms de fichiers et de dossiers, composants, fonctions, variables, types,
clés de traduction, jetons CSS, scripts et noms des tests. **Commentaires et documentation en
français.** Les textes affichés vivent dans les fichiers de langue (`frontend/src/i18n/`).
