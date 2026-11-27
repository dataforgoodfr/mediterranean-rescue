# AGENTS.md (POC du plugin WordPress)

Complète l'AGENTS.md à la racine du dépôt, qui reste la règle.

- Lis [GUIDE.md](GUIDE.md) avant toute modification : ses règles (« Les règles qu'on ne contourne
  jamais ») sont celles des relectures.
- Avant de proposer un changement : `pnpm typecheck && pnpm lint:js && composer lint && pnpm test`.
- Un champ se décrit dans `plugin/rescue-atlas-admin/includes/class-fields.php`, nulle part ailleurs.
- React vient de `@wordpress/element` ; jamais `react` importé ni embarqué.
- WordPress publie des skills officiels pour les assistants de code :
  https://github.com/WordPress/agent-skills (`wp-plugin-development`, `wp-rest-api`,
  `wp-plugin-directory-guidelines`, `wp-playground`). Si ton assistant les a, suis-les ; en cas
  de désaccord avec GUIDE.md, signale-le dans la PR au lieu de trancher seul.
