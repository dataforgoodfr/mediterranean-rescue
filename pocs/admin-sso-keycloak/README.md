# Back-office protégé par Keycloak

## La question

Notre API FastAPI peut-elle réserver les routes du back-office aux personnes qui ont le bon rôle,
en laissant Keycloak gérer les comptes, sans qu'aucun mot de passe ne passe par notre code ?

## Ce que j'ai essayé

- **Keycloak 26.8.2** (version stable du 5/11/2026, licence Apache 2.0), lancé en mode dev par
  Docker, avec un realm fictif importé au démarrage : `realm/rescue-atlas-poc-realm.json`. Doc :
  [Keycloak en conteneur](https://www.keycloak.org/server/containers).
- Dans ce realm : un rôle `data-provider` (celui de Magda, le persona qui vérifie et corrige les
  données), un client public `rescue-atlas-admin` pour le futur back-office, et deux comptes
  fictifs, `magda-fictif` avec le rôle et `lecteur-fictif` sans. Un mapper ajoute l'audience
  `rescue-atlas-api` aux jetons, pour que l'API refuse un jeton fait pour une autre application.
- **`api.py`** : une API FastAPI qui vérifie le jeton avec [PyJWT](https://pyjwt.readthedocs.io/en/stable/usage.html)
  (signature par les clés publiques de Keycloak, émetteur, audience, expiration), puis le rôle
  dans `realm_access.roles`. `/api/admin/me` est réservée au rôle `data-provider`.
- **`try_it.py`** : rejoue quatre cas et dit si la réponse est celle attendue.

Pour relancer, depuis ce dossier (Docker et uv suffisent) :

```sh
docker compose -p poc-keycloak up -d   # Keycloak sur http://localhost:8081 (admin / admin-fictif)
uv run api.py                          # l'API sur http://localhost:8090, dans un autre terminal
uv run try_it.py                       # les quatre cas
docker compose -p poc-keycloak down    # tout arrêter
```

`KEYCLOAK_PORT` change le port de Keycloak s'il est déjà pris (pensez alors à `KEYCLOAK_ISSUER`
pour l'API et `KEYCLOAK_URL` pour `try_it.py`).

## La réponse

Oui, et c'est court : moins de 90 lignes dans l'API, commentaires compris, aucune table d'utilisateurs, aucun
mot de passe chez nous. Résultat de `try_it.py` le 18/11/2026 :

| Cas | Réponse |
|---|---|
| Sans jeton | 401 « Jeton manquant » |
| Jeton trafiqué | 401 « Jeton refusé » |
| `lecteur-fictif`, sans le rôle | 403 « Rôle data-provider requis » |
| `magda-fictif`, rôle `data-provider` | 200, avec son nom et ses rôles |

Ce que ça laisse de côté, volontairement :

- Le jeton est demandé ici avec le mot de passe (« direct access grant »), pour tester vite. Le
  vrai back-office passera par la page de connexion de Keycloak (code d'autorisation avec PKCE,
  déjà autorisé sur le client), puis enverra le jeton à l'API de la même façon.
- Le mode dev de Keycloak n'est pas fait pour la production.
- Rien n'est branché sur `backend/` : c'est la suite, si on retient la piste.

Sur Clever Cloud, Keycloak existe en service géré
([doc](https://www.clever.cloud/developers/doc/deploy/services/keycloak/), lue le 18/11/2026) :
une instance Java, une base Postgres et un bucket, avec un filtrage par IP par realm depuis la
26.6. La page ne dit rien des sauvegardes.

## La suite

- Une question pour l'informatique de SOS MEDITERRANEE (visio du vendredi 20/11) : un Keycloak à
  nous, qu'on pourra relier plus tard à leurs comptes (Microsoft 365 par exemple), ça leur va ?
  Keycloak sait déléguer la connexion à un autre fournisseur, sans changer notre API.
- Si oui, une issue sous le back-office (#19) : protéger les routes d'admin de `backend/` de la
  même façon, avec les rôles de #55.
