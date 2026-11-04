# Contribuer

Merci de donner de ton temps à la carte de SOS MEDITERRANEE.

Tout passe par le canal du projet sur le Mattermost de Data for Good : questions, entraide et
rendez-vous. Présente-toi en arrivant et demande l'accès en écriture à ce dépôt.

## Le chemin d'une issue

1. **Prends une issue** de la colonne « Ready » du
   [tableau](https://github.com/orgs/dataforgoodfr/projects/44) et commente « Je prends ».
   Un tech lead te l'assigne. Une à la fois.
2. **Crée ta branche** depuis `main` : `git switch -c feat/12-carte-maplibre`.
3. **Code et teste.** Chaque critère de l'issue a au moins un test. Les vérifications à lancer
   sont dans [TECHNICAL.md](TECHNICAL.md).
4. **Committe.** pre-commit (à installer une fois, voir [TECHNICAL.md](TECHNICAL.md)) vérifie tes
   fichiers. S'il en corrige un, refais `git add` puis
   `git commit` : c'est normal.
5. **Ouvre la pull request** vers `main`, même tôt, en brouillon, et remplis son modèle.
6. **Réponds à la relecture.** Un tech lead approuve et merge.

Bloqué ? Écris-le dans l'issue ou sur le canal, c'est normal. Sans nouvelles au bout d'une
semaine, l'issue redevient libre.

## Les messages de commit

On suit les [commits conventionnels](https://www.conventionalcommits.org/fr/v1.0.0/) :
`feat:`, `fix:`, `docs:`, `test:`, `chore:`… Par exemple `feat: affiche les zones SAR`.
C'est surtout le **titre de la pull request** qui compte : il devient le commit sur `main`, et
la CI le vérifie.

## Deux règles

- **Aucune donnée réelle, aucun secret** dans Git, une issue ou une pull request. Les exemples
  sont fictifs et marqués `FICTIF`.
- **Inconnu reste vide, jamais zéro.**

Tu ne codes pas ? Tester la carte, relire un texte ou proposer une idée sur le canal, ça compte
aussi.
