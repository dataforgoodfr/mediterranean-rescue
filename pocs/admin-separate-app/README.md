# Le back-office dans une app séparée

## La question

Peut-on garder un seul code et le déployer en deux apps, l'API publique et le back-office, de
sorte que les routes d'admin n'existent même pas sur l'app publique ?

C'est le point 1 de la proposition pour la visio du vendredi 20/11 : sur Clever Cloud, deux
applications construites depuis le même dépôt, l'admin sur sa propre adresse.

## Ce que j'ai essayé

- **`app.py`** : une API FastAPI avec deux routeurs. Le routeur d'admin n'est monté que si
  `ADMIN_ENABLED=true` ([doc FastAPI](https://fastapi.tiangolo.com/tutorial/bigger-applications/)).
- **`try_it.py`** construit les deux apps et appelle les mêmes adresses sur chacune. Aucun
  serveur à lancer, aucune base.

```sh
uv run try_it.py
ADMIN_ENABLED=true uv run fastapi dev app.py   # pour voir l'app d'admin dans un navigateur
```

## La réponse

Oui, en quelques lignes. Résultat de `try_it.py` le 18/11/2026 :

| App | Adresse | Réponse |
|---|---|---|
| publique | `/api/operations` | 200 |
| publique | `/api/admin/operations` | 404 |
| admin | `/api/operations` | 200 |
| admin | `/api/admin/operations` | 200 |

Le schéma OpenAPI de l'app publique ne cite que `/api/operations` : rien n'y signale qu'un
back-office existe.

Ce que ça ne règle pas : l'app d'admin reste joignable par tout Internet. Il faut toujours une
connexion (voir [admin-sso-keycloak](../admin-sso-keycloak/)), et peut-être un filtrage par IP
(voir [admin-ip-filter](../admin-ip-filter/)). Les deux apps partagent aussi la même base :
voir [public-readonly-db](../public-readonly-db/).

## La suite

Si on retient la piste : une issue sous le back-office (#19), pour le réglage dans `backend/` et
la deuxième app sur Clever Cloud (à confier à l'équipe DevOps).
