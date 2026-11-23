# Guide du plugin Rescue Atlas Admin

Pour toute personne qui touche à ce plugin, développeur débutant ou confirmé, et pour son
assistant de code. Lis-le en entier avant ta première modification : il est court, et chaque
règle a une raison.

## Ce que c'est, en une minute

Un plugin WordPress qui porte le back-office de la carte Rescue Atlas :

- des **fiches** : opérations de la carte, événements, ports, navires, termes du glossaire ;
- des **contrôles** avant publication (une fiche incohérente est enregistrée, jamais publiée) ;
- trois **rôles** : Saisie, Validation, Lecture ;
- un **écran Opérations** à notre style, avec une carte, en React ;
- une **API de lecture** que la carte publique interroge (`/wp-json/rescue-atlas/v1/…`).

Le même plugin tourne sur notre WordPress, et SOS MEDITERRANEE peut le téléverser dans le sien.
C'est pour ça qu'il doit être propre : il finira sur le site public d'une ONG, installé par un
webmaster qui ne nous connaît pas.

## Lancer le projet

Prérequis : Node (dernière LTS) et pnpm, comme le reste du dépôt. Composer pour les normes de
code PHP. Gettext pour les traductions (`brew install gettext` sur Mac). **Ni Docker, ni PHP, ni
base de données** : WordPress Playground fait tourner WordPress en WebAssembly.

| Commande (dans `pocs/wordpress-admin/`) | Ce qu'elle fait |
|---|---|
| `pnpm install` | Installe les outils (une fois) |
| `pnpm start` | Construit l'écran, lance WordPress 7.1.4 sur http://127.0.0.1:9400 avec des données fictives |
| `pnpm watch` | Reconstruit l'écran à chaque modification (dans un second terminal) |
| `pnpm test` | Lance un WordPress neuf et vérifie l'API, les contrôles et les rôles |
| `pnpm typecheck` et `pnpm lint:js` | Types et règles JavaScript de WordPress |
| `composer install` puis `composer lint` | Normes de code PHP de WordPress (`composer fix` corrige ce qui peut l'être) |
| `pnpm i18n` | Met à jour les traductions (voir « Traduire ») |
| `pnpm zip` | Fabrique `dist/rescue-atlas-admin.zip`, le fichier à téléverser dans WordPress |

Le WordPress de test est en mémoire : il repart de zéro à chaque lancement. Il est dans la même
version que celui de SOS MEDITERRANEE (7.1.4, relevée le 23/11/2026) : `scripts/server.mjs`.

**Comptes de test** (site local seulement, tous fictifs) :

| Identifiant | Mot de passe | Rôle |
|---|---|---|
| `admin` | `password` | Administrateur (valeur par défaut de Playground) |
| `saisie` | `ra-test-saisie-7Qx` | Saisie : saisit, envoie en relecture |
| `validation` | `ra-test-valid-3Kp` | Validation : publie, archive |

## Le plan du plugin

```
plugin/rescue-atlas-admin/
├── rescue-atlas-admin.php      amorçage : en-tête, chargement des classes, rien d'autre
├── uninstall.php               ce qu'on efface à la désinstallation (pas les fiches)
├── readme.txt                  la notice au format WordPress
├── includes/
│   ├── class-plugin.php        tous les crochets, au même endroit
│   ├── class-fields.php        LES CHAMPS : le seul endroit où on les décrit
│   ├── class-validator.php     contrôles d'un champ, puis entre champs
│   ├── class-post-types.php    types de contenu, métas, statut « Archivé »
│   ├── class-roles.php         rôles et capacités
│   └── rest/
│       ├── class-public-controller.php   lecture publique pour la carte
│       └── class-admin-controller.php    routes de l'écran Opérations
├── admin/                      chargé seulement dans l'admin
│   ├── class-classic-form.php  formulaire classique (ports, navires, glossaire, secours)
│   ├── class-operations-screen.php  page de l'écran Opérations
│   └── class-settings.php      réglages (API de réglages de WordPress)
├── languages/                  traductions (.pot, .po, et fichiers compilés)
└── build/                      l'écran construit par `pnpm build` (jamais dans Git)

src/operations/                 l'écran Opérations, en React (TypeScript)
contract/rescue-atlas.openapi.yaml   le contrat de l'API de lecture
tests/plugin.test.mjs           les tests (un vrai WordPress)
dev/                            WordPress de test : blueprint et données fictives
```

## Les règles qu'on ne contourne jamais

Elles viennent du guide officiel des plugins WordPress (sources en fin de page). Une PR qui en
casse une n'est pas fusionnée.

### Sécurité

1. **Chaque action vérifie deux choses** : un jeton (nonce) contre les requêtes forgées, **et** une
   capacité (`current_user_can`) pour le droit. L'un ne remplace jamais l'autre.
   `is_admin()` ne vérifie aucun droit.
2. **Nettoyer tôt, échapper tard.** Une valeur reçue passe par `Validator::clean()` (ou une
   fonction `sanitize_*`) dès son arrivée. Tout ce qui s'affiche passe par `esc_html()`,
   `esc_attr()`, `esc_url()` au moment de l'afficher, même une valeur « sûre ».
3. **Jamais `$_POST` en entier** : on lit chaque champ par son nom, avec `wp_unslash()`.
4. **Une route REST a toujours un `permission_callback`** qui vérifie une capacité, et des
   `args` décrits avec leur type. Jamais `__return_true` sur une route qui écrit.
5. **Pas de requête SQL écrite à la main.** Les fonctions de WordPress (`get_posts`,
   `update_post_meta`…) suffisent. Si un jour il en faut une : `$wpdb->prepare()`.

### Données

6. **Aucune donnée réelle, aucun secret**, ni dans le code, ni dans les tests, ni dans les
   exemples. Les exemples sont fictifs et marqués `FICTIF`.
7. **Inconnu reste vide, jamais zéro.** Un champ vide est `null` dans l'API.
8. **On archive, on ne supprime pas.** La carte doit pouvoir retirer un point ; une fiche
   supprimée disparaît sans prévenir.
9. **Jamais de donnée sur une personne** : ni formulaire de rescapé, ni nationalité (le nombre
   seulement), ni nom de témoin.
10. **La lecture publique ne sort que les fiches publiées et archivées.** Un test le vérifie :
    ne le désactive pas.

### Code

11. **Préfixe partout** : `rsatlas_` pour les types, options, rôles, crochets et clés ;
    `RescueAtlas\Admin` pour les classes. Cela évite les collisions avec les autres
    extensions du site de SOS.
12. **Chaque texte affiché est traduisible** : `__( 'Text', 'rescue-atlas-admin' )` en PHP,
    `__( 'Text', 'rescue-atlas-admin' )` de `@wordpress/i18n` en JavaScript. Le texte source est
    en anglais, la traduction française vient de `languages/`. Un texte avec un `%s` a un
    commentaire `translators:` juste avant.
13. **On utilise le React de WordPress**, jamais le nôtre : on importe depuis
    `@wordpress/element`, et `@wordpress/scripts` s'occupe du reste. Embarquer une seconde copie
    de React casse l'admin (note officielle de juillet 2026).
14. **Les types et les contrôles ne se contournent jamais**, comme dans le reste du dépôt : ni
    `any`, ni `as` (sauf `as const`), ni `!`, ni `eslint-disable` (pre-commit le refuse). Ce qui
    vient du serveur est vérifié dans `src/operations/data.ts`. Côté PHP, un `phpcs:ignore` porte
    toujours la règle visée et sa raison sur la même ligne.
15. **Une seule source pour les champs** : `includes/class-fields.php`. L'écran, les contrôles, la
    lecture publique et le schéma de l'API en sont tirés.

## Recettes

### Ajouter un champ

1. Ajoute-le dans `includes/class-fields.php`, au bon type de contenu, avec son libellé traduit.
   Son nom est celui du contrat de données (`snake_case`).
2. Ajoute-le au schéma correspondant dans `contract/rescue-atlas.openapi.yaml`.
3. S'il a une règle avec d'autres champs, ajoute-la dans `Validator::cross_checks()`, avec un code
   d'erreur stable, et un test dans `tests/plugin.test.mjs`.
4. `pnpm test`, puis `pnpm i18n` et traduis le nouveau libellé dans le `.po`.

C'est tout : le formulaire, l'écran et l'API le prennent tout seuls.

### Ajouter une route à l'API

Dans `includes/rest/`, un contrôleur qui étend `WP_REST_Controller`, avec `permission_callback`,
`args` typés et un schéma. Branche-le dans `Plugin::register_rest_routes()`. Ajoute un test.

### Ajouter un écran

1. Une entrée dans `webpack.config.js` (par exemple `ports: './src/ports/index.tsx'`).
2. Une classe dans `admin/` sur le modèle de `class-operations-screen.php` : la page, et le
   chargement du script avec son fichier `build/<nom>.asset.php`.
3. Le code React dans `src/<nom>/`, avec les jetons de couleur de `screen.css`.

### Traduire

1. `pnpm build`, puis `pnpm i18n` : les nouveaux textes arrivent vides dans
   `languages/rescue-atlas-admin-fr_FR.po`.
2. Traduis-les avec [Poedit](https://poedit.net/) ou un éditeur de texte. Une langue que tu ne
   maîtrises pas reste vide : pas de traduction automatique que personne n'a relue (règle du
   dépôt, CONTRIBUTING.md).
3. Relance `pnpm i18n` pour compiler. Une nouvelle langue : copie le `.pot` en
   `rescue-atlas-admin-<locale>.po`.

## Avant d'ouvrir une pull request

```bash
pnpm typecheck && pnpm lint:js && composer lint && pnpm test
```

Les quatre doivent passer. La CI les relance, et y ajoute **Plugin Check**, l'outil officiel de
WordPress, qui ne tourne pas dans Playground. Décris dans la PR ce que tu as vérifié à la main
dans le navigateur (avec quel compte).

## Livrer à SOS MEDITERRANEE

1. Monte `Version` dans l'en-tête de `rescue-atlas-admin.php`, `VERSION` juste en dessous et
   `Stable tag` dans `readme.txt`. Note le changement dans le `Changelog` de `readme.txt`.
2. `pnpm zip`, puis essaie le zip sur un **site de test**, jamais directement en production.
3. La personne qui administre le site téléverse le zip (Extensions, Ajouter, Téléverser) et
   l'active. Rien ne part sans sa relecture.

## Pièges déjà rencontrés

- **L'éditeur de blocs n'affiche pas les statuts personnalisés** (ticket Gutenberg #3144) : nos
  fiches utilisent le formulaire classique, et « Archiver » est une action dédiée.
- **Le WordPress de test connecte d'office chaque visiteur en administrateur.** Les tests
  envoient le cookie `playground_auto_login_already_happened=1` pour rester anonymes.
- **`pnpm i18n` demande 2 Go de mémoire PHP** : le build embarque MapLibre, et l'extraction des
  textes le lit en entier.
- **TypeScript 5, pas 7** ici : les outils de lint de WordPress utilisent encore l'API JavaScript
  de TypeScript 5.
- **pnpm 12 refuse les scripts d'installation non déclarés** : la liste est dans
  `pnpm-workspace.yaml`.
- **Plugin Check ne tourne pas dans Playground** (il lit l'entrée standard, absente en
  WebAssembly) : il tourne dans la CI.

## Les sources officielles

- Guide des plugins : https://developer.wordpress.org/plugins/ (sécurité, en-têtes, cycle de vie)
- API REST : https://developer.wordpress.org/rest-api/extending-the-rest-api/adding-custom-endpoints/
- Normes de code : https://github.com/WordPress/WordPress-Coding-Standards
- Plugin Check : https://wordpress.org/plugins/plugin-check/
- `@wordpress/scripts` et l'extraction des dépendances :
  https://developer.wordpress.org/block-editor/reference-guides/packages/packages-scripts/
- React dans WordPress 7.1 :
  https://make.wordpress.org/core/2026/07/24/react-19-punted-beyond-wordpress-7-1-experiment-in-gutenberg/
- WordPress Playground : https://wordpress.github.io/wordpress-playground/
- Traductions : https://developer.wordpress.org/plugins/internationalization/
- Skills officiels pour assistants de code : https://github.com/WordPress/agent-skills
