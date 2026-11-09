# Contribuer

Merci de donner de ton temps à la carte de SOS MEDITERRANEE.

Présente-toi en arrivant sur le [canal d'accueil des bénévoles](https://mattermost.services.dataforgood.fr/data-for-good/channels/15-mediterranean-rescue-onboarding) du Mattermost de Data
for Good, et demande l'accès en écriture à ce dépôt. Ensuite, chaque question va dans son canal :
[Front](https://mattermost.services.dataforgood.fr/data-for-good/channels/15-mediterranean-rescue_front) pour la carte et l'interface, [Back](https://mattermost.services.dataforgood.fr/data-for-good/channels/15-mediterranean-rescue_back) pour l'API et les données,
[SOS Med](https://mattermost.services.dataforgood.fr/data-for-good/channels/15-mediterranean-rescue_sos-med) pour les questions métier à l'équipe de SOS MEDITERRANEE.

## Le chemin d'une issue

1. **Prends une issue** de la colonne « Ready » du
   [tableau](https://github.com/orgs/dataforgoodfr/projects/44) et commente « Je prends ».
   Un tech lead te l'assigne. Une à la fois.
2. **Crée ta branche** depuis `main` : `git switch -c feat/8-maplibre-map`.
3. **Code et teste.** Chaque critère de l'issue a au moins un test. Les vérifications à lancer
   sont dans [TECHNICAL.md](TECHNICAL.md).
4. **Committe.** pre-commit (à installer une fois, voir [TECHNICAL.md](TECHNICAL.md)) vérifie tes
   fichiers. S'il en corrige un, refais `git add` puis
   `git commit` : c'est normal.
5. **Ouvre la pull request** vers `main`, même tôt, en brouillon, et remplis son modèle. Quand
   elle est prête, sors-la du brouillon et passe l'issue dans « In review » sur le tableau.
6. **Réponds à la relecture.** Un tech lead approuve et merge.

Bloqué ? Écris-le dans l'issue ou dans le canal de ta zone ([Front](https://mattermost.services.dataforgood.fr/data-for-good/channels/15-mediterranean-rescue_front) ou [Back](https://mattermost.services.dataforgood.fr/data-for-good/channels/15-mediterranean-rescue_back)), c'est normal. Sans nouvelles au bout d'une
semaine, l'issue redevient libre.

## Les messages de commit

On suit les [commits conventionnels](https://www.conventionalcommits.org/fr/v1.0.0/) :
`feat:`, `fix:`, `docs:`, `test:`, `chore:`… Par exemple `feat: affiche les zones SAR`.
C'est surtout le **titre de la pull request** qui compte : il devient le commit sur `main`, et
la CI le vérifie.

## Les langues

La carte parle anglais d'abord, puis français ; l'arabe est prévu, en option. Le code est en
anglais (fichiers, composants, fonctions, clés de traduction) ; les issues, la doc et les
commentaires sont en français.

- **Un texte affiché passe par une clé**, jamais écrit en dur dans un composant : la clé dans
  `frontend/src/i18n/keys.ts`, le texte dans `en.ts`, `fr.ts` ou `ar.ts`, et `t('my.key')` dans
  le composant. Le mode d'emploi est dans [TECHNICAL.md](TECHNICAL.md) (« Les langues »).
- **Traduire n'est pas obligatoire.** Écris le texte dans les langues que tu maîtrises, au moins
  une. Si tu n'es pas sûr·e d'une langue, laisse sa clé absente : pas de traduction approximative,
  ni de traduction automatique que personne n'a relue. L'app affiche alors l'anglais, ou le
  français.
- **Une langue manque ? Dis-le.** Pose l'étiquette `traduction` sur ta pull request et écris dans
  sa description les langues qui manquent. `pnpm i18n:missing` (dans `frontend/`) liste tout
  ce qui reste à traduire.

## Trois règles

- **Aucune donnée réelle, aucun secret** dans Git, une issue ou une pull request. Les exemples
  sont fictifs et marqués `FICTIF`.
- **Inconnu reste vide, jamais zéro.**
- **Les types ne se contournent jamais.** Pas de `any`, de `as` (sauf `as const`), de `!` ni de `@ts-ignore` en
  TypeScript, pas de `Any`, de `cast` ni de `# type: ignore` en Python. Si le compilateur refuse,
  c'est le code qui change, même si ça prend du temps : demande de l'aide sur [Front](https://mattermost.services.dataforgood.fr/data-for-good/channels/15-mediterranean-rescue_front) ou [Back](https://mattermost.services.dataforgood.fr/data-for-good/channels/15-mediterranean-rescue_back). Le détail
  est dans [TECHNICAL.md](TECHNICAL.md) (« Les types : aucun contournement »).

Tu ne codes pas ? Tester la carte, relire un texte ou proposer une idée sur le [canal](https://mattermost.services.dataforgood.fr/data-for-good/channels/15-mediterranean-rescue-onboarding), ça compte
aussi.
