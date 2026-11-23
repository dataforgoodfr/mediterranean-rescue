# POC : le back-office de Rescue Atlas en plugin WordPress

Mode d'emploi complet, règles et recettes : [GUIDE.md](GUIDE.md). À lire avant toute modification.

## La question

Peut-on écrire tout notre back-office (saisie, contrôles, rôles, écrans à notre style, API de
lecture pour la carte) sous la forme d'un plugin WordPress propre, qui tourne chez nous et que
SOS MEDITERRANEE peut téléverser dans son propre WordPress, en suivant les règles officielles de
WordPress ?

## Ce que j'ai essayé

- Un plugin, `plugin/rescue-atlas-admin/`, écrit d'après le guide officiel des plugins, le guide
  de l'API REST et les skills officiels de WordPress (sources dans GUIDE.md) :
  - types de contenu et champs tirés du contrat de données ;
  - contrôles avant publication ;
  - rôles séparés des articles ;
  - archivage au lieu de suppression ;
  - API de lecture au format du contrat ;
  - un écran Opérations en React (le React fourni par WordPress, construit avec
    `@wordpress/scripts`), avec une carte MapLibre.
- Des tests qui lancent un vrai WordPress 7.1.4, la version du site de SOS MEDITERRANEE (balise
  generator, relevée le 23/11/2026), avec WordPress Playground, sans Docker : `pnpm test`.
- Les normes de code WordPress (PHPCS, `WordPress-Extra`), le lint JavaScript de WordPress, et
  les traductions générées par `wp i18n` (anglais source, français).

Pour relancer : `pnpm install`, puis `pnpm test` ou `pnpm start` (GUIDE.md, « Lancer le projet »).

Sources et licences :

| Source | Licence |
|---|---|
| WordPress, `@wordpress/*`, WordPress Playground | GPL-2.0-or-later |
| MapLibre GL JS 6.19.0 | BSD-3-Clause |
| Fond de carte OpenFreeMap (tuiles OpenMapTiles, données OpenStreetMap) | OpenMapTiles : BSD-3-Clause et CC-BY 4.0 ; OSM : ODbL |
| Le plugin | GPL-2.0-or-later, comme l'exige WordPress (le reste du dépôt est en MIT, compatible) |

Données : fictives seulement (`dev/seed.php`), marquées `FICTIF`.

## La réponse

**Oui.** Le plugin fait tout cela, et `pnpm test` le vérifie sur un WordPress neuf. Les tests
couvrent :

- l'API publique, conforme au contrat ;
- les fiches incohérentes, en relecture ou en brouillon, qui ne sortent jamais ;
- l'archivage ;
- les rôles : Saisie ne publie pas, et l'admin est fermé sans connexion.

Le PHP respecte les normes de code WordPress. L'écran passe le lint JavaScript et la vérification
des types.

Pour SOS MEDITERRANEE, il n'y a rien à coder : téléverser `dist/rescue-atlas-admin.zip` (fabriqué
par `pnpm zip`), puis l'activer.

Limites, et ce qui n'est pas vérifié :

- **Plugin Check**, l'outil officiel, ne tourne pas dans Playground : il tourne dans la CI.
- L'installation par le zip sur un vrai hébergement n'a pas été essayée.
- Pas fait : les médias (#149 à #153), le lien avec les rotations déjà présentes sur le site de
  SOS, les langues avec Polylang (que leur site utilise), et les maquettes de Marie.
- La liste des types de bateau est supposée. Les règles entre champs sont à relire avec SOS.

## La suite

- Une question pour SOS MEDITERRANEE et leur webmaster : saisir dans WordPress, et avec ce plugin ?
- Si les tech leads valident, découper la suite en issues pour les bénévoles : médias, rotations,
  écrans ports et glossaire, Polylang, design de Marie.
