# Le back-office réservé à quelques adresses IP

## La question

Derrière les proxys de Clever Cloud, peut-on réserver le back-office à quelques adresses IP
(le bureau de SOS, un VPN), sans qu'un inconnu puisse se faire passer pour l'une d'elles ?

## Ce que j'ai essayé

- Clever Cloud ne propose pas de liste d'IP autorisées devant une application. Il donne la liste
  de ses proxys dans `CC_REVERSE_PROXY_IPS` : « A comma separated list of trusted IP addresses »
  ([variables d'environnement](https://www.clever.cloud/developers/doc/manage/environment-variables/reference/),
  lu le 18/11/2026).
- La vraie IP du client arrive dans l'en-tête `X-Forwarded-For`, que n'importe qui peut écrire.
  **`app.py`** ne le croit que s'il vient d'un proxy de `CC_REVERSE_PROXY_IPS`, avec le
  middleware d'uvicorn ([réglages](https://uvicorn.dev/settings/)). Lu dans son code (uvicorn
  0.54) : il garde la première IP non fiable en partant de la droite de l'en-tête.
- **`try_it.py`** simule le proxy, le bureau et un inconnu, avec des adresses de documentation
  (RFC 5737). Aucun serveur à lancer.

```sh
uv run try_it.py
```

## La réponse

Oui, sans réécrire la logique : le middleware d'uvicorn fait le tri. Résultat de `try_it.py` le
18/11/2026 :

| Qui | Réponse |
|---|---|
| le bureau, via le proxy | 200 |
| un inconnu, via le proxy | 403 |
| un inconnu qui écrit l'IP du bureau sans passer par le proxy | 403 |
| un inconnu qui glisse l'IP du bureau devant la sienne, via le proxy | 403 |
| le proxy lui-même, sans en-tête | 403 |

Les limites :

- Il faut que SOS ait une IP de sortie fixe (bureau, VPN). Une personne en déplacement n'y a pas
  accès sans le VPN.
- Une IP n'est pas une identité : c'est une barrière en plus de la connexion, jamais à sa place.
- Testé en simulant le proxy, pas derrière un vrai proxy de Clever Cloud. Le format exact de
  l'en-tête chez eux reste à vérifier sur le staging.

## La suite

Une question pour l'informatique de SOS (visio du vendredi 20/11) : ont-ils une IP de sortie
fixe ou un VPN ? Si oui, le tester sur le staging avant d'en faire une issue.
