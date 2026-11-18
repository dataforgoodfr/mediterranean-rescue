# Notre Keycloak, relié aux comptes de SOS

## La question

Si on garde notre propre Keycloak (voir [admin-sso-keycloak](../admin-sso-keycloak/)), une
personne de SOS peut-elle se connecter au back-office avec son compte de SOS, et recevoir le
rôle `data-provider` selon un groupe géré chez SOS, sans que nous créions son compte à la main ?

C'est la piste de Julien : rester indépendants de l'outil de SOS, et brancher leurs comptes
(Microsoft 365 par exemple) le jour où ils le veulent.

## Ce que j'ai essayé

- **Keycloak 26.8.2** en mode dev (Docker), avec deux realms importés au démarrage :
  - `sos-fictif` joue le fournisseur de comptes de SOS. Il a deux comptes fictifs, `magda`, dans
    le groupe `rescue-atlas-data-providers`, et `marin`, hors du groupe, et il envoie les
    groupes dans le jeton (claim `groups`).
  - `rescue-atlas-poc` est le nôtre. Il n'a aucun compte. Il délègue la connexion à `sos-fictif`
    par OpenID Connect, et un mapper donne le rôle `data-provider` à qui arrive avec le groupe
    `rescue-atlas-data-providers`.
  Doc lue (Keycloak 26.8.2, Server Administration Guide) : « OpenID Connect v1.0 identity
  providers », « First login flow », « Mapping claims and assertions », « Default Identity
  Provider » (le paramètre `kc_idp_hint`).
- **`try_it.py`** joue un navigateur : le back-office demande une connexion (code d'autorisation
  avec PKCE) avec `kc_idp_hint=sos-fictif`, la personne se connecte chez « SOS », revient, et le
  script lit les rôles du jeton rendu par notre Keycloak.

Pour relancer, depuis ce dossier :

```sh
docker compose -p poc-broker up -d   # Keycloak sur http://localhost:8082 (admin / admin-fictif)
uv run try_it.py
docker compose -p poc-broker down
```

Pour le voir dans un navigateur : http://localhost:8082/realms/rescue-atlas-poc/account, bouton
« Compte SOS (FICTIF) », puis `magda` / `fictif`.

## La réponse

Oui. Résultat de `try_it.py` le 18/11/2026, lancé deux fois de suite (création des comptes au
premier lancement, reconnexion au second, même résultat) :

| Cas | Rôle `data-provider` |
|---|---|
| `magda`, dans le groupe chez SOS | oui |
| `marin`, hors du groupe chez SOS | non |
| `magda`, retirée du groupe chez SOS, se reconnecte | non |
| `magda`, remise dans le groupe, se reconnecte | oui |

Ce que ça montre :

- Notre API n'a rien à changer : elle vérifie le jeton de notre Keycloak, d'où que vienne la
  personne.
- Qui a le droit de corriger les données se décide chez SOS, par un groupe. Le mapper relit le
  groupe à chaque connexion (`syncMode` à `FORCE`) : retirer quelqu'un du groupe chez SOS lui
  retire le rôle chez nous à sa connexion suivante (testé ci-dessus).
- Le compte créé chez nous n'a pas de mot de passe : on ne peut s'y connecter que par SOS. Une
  personne dont le compte est fermé chez SOS ne peut donc plus se connecter (déduit, pas testé :
  un jeton déjà délivré reste valable jusqu'à son expiration).

Les limites :

- `sos-fictif` est un Keycloak, pas un vrai Microsoft 365. Le mécanisme est le même (OpenID
  Connect), mais les réglages de Microsoft ne sont pas testés ici.
- Dans ce POC, toute personne qui se connecte par « SOS » obtient un compte chez nous, rôle ou
  pas. Si on ne veut créer que les comptes du groupe, il faut régler le « First login flow ».

## La suite

**Pour l'admin informatique de SOS**, si SOS est sur Microsoft 365, ce qu'il aurait à faire,
d'après la doc de Keycloak (section « Microsoft » des fournisseurs sociaux) :

1. Dans le portail Azure, **App registrations**, enregistrer une application « Rescue Atlas ».
2. Plateforme **Web**, avec l'adresse de retour que notre Keycloak lui donne.
3. **Certificates & secrets** : créer un secret, et nous transmettre sa valeur et
   l'**Application (client) ID**, par un canal sûr.
4. Créer un groupe pour les personnes qui corrigent les données, et l'envoyer dans le jeton.

Les étapes 1 à 3 viennent de la doc de Keycloak. L'étape 4 est à vérifier dans la doc de
Microsoft avant d'en faire un tutoriel vidéo pour eux.

Une question pour la visio du vendredi 20/11 : SOS est-il sur Microsoft 365 (ou Google
Workspace), et un admin peut-il faire ces quatre étapes ?
