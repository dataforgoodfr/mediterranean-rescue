# Une base que l'API publique ne peut que lire

## La question

Peut-on donner à l'API publique un accès à Postgres qui ne voit que les opérations publiées, et
ne peut rien écrire, pour qu'un bug ou une faille côté public ne touche jamais aux données à
vérifier (#33) ?

## Ce que j'ai essayé

- **Postgres 18** jetable (Docker, aucun volume), préparé par `init.sql` : une table `operation`
  avec trois lignes `FICTIF`, dont une « à vérifier », et une vue `published_operation` qui ne
  garde que les opérations publiées, sans la colonne `status`.
- Deux rôles, d'après la doc de Postgres ([GRANT](https://www.postgresql.org/docs/18/sql-grant.html),
  [privilèges](https://www.postgresql.org/docs/18/ddl-priv.html)) :
  - `public_api` : lecture de la vue, rien d'autre ;
  - `admin_api` : lecture, ajout et correction de la table, sans pouvoir la supprimer.
- **`try_it.py`** essaie huit requêtes et compare à ce qui est attendu.

Pour relancer, depuis ce dossier :

```sh
docker compose -p poc-readonly up -d   # Postgres sur localhost:55433 (DB_PORT pour changer)
uv run try_it.py
docker compose -p poc-readonly down
```

## La réponse

Dans Postgres, oui. Résultat de `try_it.py` le 18/11/2026, lancé deux fois de suite :

| Rôle | Requête | Réponse |
|---|---|---|
| public | lire la vue | les 2 opérations publiées |
| public | lire la table | refusé |
| public | modifier la vue | refusé |
| public | supprimer des lignes | refusé |
| admin | publier FICTIF-3 | accepté, et le public la voit aussitôt |
| admin | supprimer la table | refusé (seul le propriétaire peut) |

**Mais pas tel quel sur Clever Cloud.** Sa doc PostgreSQL (lue le 18/11/2026) dit qu'on ne peut
pas créer d'autres utilisateurs que ceux de son control plane : le propriétaire de la base, et
des utilisateurs en lecture seule. Ce POC crée ses rôles en SQL, ce qui n'y est pas possible. La
doc ne dit pas ce que ces utilisateurs en lecture seule peuvent lire : toute la base, ou ce que
le propriétaire leur donne.

## La suite

- Une question pour Clever Cloud (ou à tester sur le staging) : un utilisateur en lecture seule
  créé par la console voit-il toute la base ? Le propriétaire peut-il lui retirer la table et
  ne lui laisser que la vue (`REVOKE` puis `GRANT`, qui ne demandent pas de créer de rôle) ?
- Si non, deux autres pistes : deux bases (la publique ne reçoit que le publié), ou la règle
  seulement dans le code de l'API publique, sans protection de la base.
