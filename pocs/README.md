# Les POC : essayer, s'avancer, s'exercer

Ici, tu peux essayer une idée avant qu'elle devienne une issue : une source de données, une
bibliothèque, un calcul, un bout de carte. Un POC (une preuve de concept) répond à une question,
vite, sans viser la production.

Quand en faire un :

- tu veux tester une source publique ou un calcul avant de proposer une issue ;
- tu veux t'exercer sur la pile du projet sans attendre qu'une issue se libère ;
- une issue demande d'abord de savoir si c'est faisable.

## Comment

1. **Dis-le sur Mattermost**, dans le canal de ta zone : quelqu'un essaie peut-être déjà la même
   chose.
2. **Crée un dossier** `pocs/<nom-court>/`, en anglais et en minuscules, par exemple
   `pocs/italian-reports-match/`, sur une branche `poc/<nom-court>`.
3. **Écris son README.md**, en quatre parties :
   - **La question** : ce que tu veux savoir, en une phrase.
   - **Ce que j'ai essayé** : les sources, avec leur adresse et leur licence (ou « inconnue »),
     et la façon de relancer le POC.
   - **La réponse** : ce que tu as trouvé, même si c'est « ça ne marche pas ».
   - **La suite** : une issue à créer, une question pour SOS MEDITERRANEE, ou rien.
4. **Ouvre une pull request**, titrée comme les autres (`feat(poc): …`). Un tech lead la relit
   pour vérifier les règles ci-dessous, pas pour juger le code.

## Ce qui est plus léger qu'ailleurs

- Pas de critère d'acceptation, pas de test obligatoire.
- Un script Python, un notebook ou une petite page : ce qui répond le plus vite à la question.
- Les vérifications du backend et du frontend (tests, mypy, tsc) ne tournent pas sur ce dossier.
  pre-commit, si : il met les fichiers en forme et refuse les gros fichiers.
- Les dépendances d'un POC restent dans son dossier (un `requirements.txt`, ou l'en-tête
  `# /// script` d'un script lancé par `uv run`), jamais dans `backend/` ni dans `frontend/`.

## Ce qui ne change pas

- **Sources publiques ou données fictives seulement.** Jamais un fichier interne de SOS
  MEDITERRANEE, jamais une donnée sur une personne.
- **Rien de téléchargé dans Git.** Les fichiers que le POC récupère vont dans `data/` à la
  racine du dépôt, que Git ignore ([data/README.md](../data/README.md)).
- **Un notebook se committe sorties vidées** : une sortie peut contenir des données.
- **Inconnu reste vide, jamais zéro**, ici aussi.

## Après

Un POC concluant devient une issue normale, avec ses critères et ses tests : son code passe alors
dans `backend/` ou `frontend/`, aux règles de [CONTRIBUTING.md](../CONTRIBUTING.md). Le POC reste
ici, même abandonné : il garde la question et la réponse, et évite de refaire l'essai.
