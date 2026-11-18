# Notre Keycloak, relié aux comptes de SOS

## La question

Si on garde notre propre Keycloak (voir [admin-sso-keycloak](../admin-sso-keycloak/)), une
personne de SOS peut-elle se connecter au back-office avec son compte de SOS, et recevoir le
rôle `data-provider` selon ce que décide l'admin de SOS, sans que nous créions son compte à la
main ?

C'est la piste de Julien : rester indépendants de l'outil de SOS, et brancher leurs comptes
(Microsoft 365 par exemple) le jour où ils le veulent.

## Ce que j'ai essayé

- **Keycloak 26.8.2** en mode dev (Docker), avec deux realms importés au démarrage :
  - `sos-fictif` joue le Microsoft Entra ID de SOS (l'annuaire de Microsoft 365). Il a deux
    comptes fictifs, `magda`, qui a le rôle `data-provider`, et `marin`, qui ne l'a pas. Comme
    Entra ID pour un « app role », il envoie ce rôle dans la claim `roles` du jeton.
  - `rescue-atlas-poc` est le nôtre. Il n'a aucun compte. Il délègue la connexion à `sos-fictif`
    par OpenID Connect, et un mapper donne notre rôle `data-provider` à qui arrive avec la valeur
    `data-provider` dans `roles`.
  Doc lue (Keycloak 26.8.2, Server Administration Guide) : « OpenID Connect v1.0 identity
  providers », « First login flow », « Mapping claims and assertions », « Default Identity
  Provider » (le paramètre `kc_idp_hint`). Côté Microsoft, voir « La suite ».
- **`try_it.py`** joue un navigateur : le back-office demande une connexion (code d'autorisation
  avec PKCE) avec `kc_idp_hint=sos-fictif`, la personne se connecte chez « SOS », revient, et le
  script lit les rôles du jeton rendu par notre Keycloak. Il retire puis rend le rôle à `magda`
  par l'API d'admin de `sos-fictif`, comme le ferait l'admin de SOS.

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

| Cas | Rôle `data-provider` chez nous |
|---|---|
| `magda`, rôle attribué chez SOS | oui |
| `marin`, sans rôle chez SOS | non |
| `magda`, rôle retiré chez SOS, se reconnecte | non |
| `magda`, rôle rendu chez SOS, se reconnecte | oui |

Ce que ça montre :

- Notre API n'a rien à changer : elle vérifie le jeton de notre Keycloak, d'où que vienne la
  personne.
- Qui a le droit de corriger les données se décide chez SOS. Le mapper relit le rôle à chaque
  connexion (`syncMode` à `FORCE`) : le retirer chez SOS le retire chez nous à la connexion
  suivante (testé ci-dessus).
- Le compte créé chez nous n'a pas de mot de passe : on ne peut s'y connecter que par SOS. Une
  personne dont le compte est fermé chez SOS ne peut donc plus se connecter (déduit, pas testé :
  un jeton déjà délivré reste valable jusqu'à son expiration).

Les limites :

- `sos-fictif` est un Keycloak, pas un vrai Entra ID. Le mécanisme est le même (OpenID Connect,
  claim `roles`), mais aucun vrai tenant Microsoft n'a été branché.
- Toute personne de SOS qui se connecte obtient un compte chez nous, rôle ou pas (sans rôle,
  l'API répond 403). Pour ne créer que les comptes qui ont le rôle, il faut régler le « First
  login flow ».

## La suite

**Ce que l'admin de SOS aurait à faire**, dans le [Microsoft Entra admin
center](https://entra.microsoft.com), avec au moins le rôle Cloud Application Administrator.
Étapes relues le 18/11/2026 dans la doc de Microsoft : [enregistrer une
app](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app),
[ajouter un secret](https://learn.microsoft.com/en-us/entra/identity-platform/how-to-add-credentials),
[app roles](https://learn.microsoft.com/en-us/entra/identity-platform/howto-add-app-roles-in-apps).

1. **Enregistrer l'application.** Entra ID, App registrations, New registration. Nom :
   « Rescue Atlas ». Supported account types : « Single tenant only ». Register. Ajouter
   ensuite une plateforme **Web** avec l'adresse de retour que nous leur donnons (étape tirée de
   la doc de Keycloak, section « Microsoft »).
2. **Créer un secret.** Dans l'application : Certificates & secrets, Client secrets, New client
   secret, avec une expiration de moins de 12 mois (conseil de Microsoft). Copier la **Value**
   tout de suite, elle n'est plus jamais affichée. Nous transmettre, par un canal sûr, cette
   valeur, l'**Application (client) ID** et l'identifiant de leur tenant.
3. **Créer le rôle.** Dans l'application : App roles, Create app role. Display name :
   « Corriger les données ». Allowed member types : Users/Groups. Value : `data-provider`
   (exactement). Apply.
4. **Donner le rôle aux bonnes personnes.** Entra ID, Enterprise apps, « Rescue Atlas », Users
   and groups, Add user/group : choisir les personnes, puis le rôle « Corriger les données »,
   puis Assign. Pour retirer l'accès, retirer la personne de cette liste.

Points à vérifier avant d'en faire un tutoriel vidéo :

- Microsoft déconseille les secrets en production et recommande un certificat. Keycloak sait
  s'authentifier par un jeton signé avec sa propre clé (option « JWT signed with private key »),
  ce qui éviterait tout secret à transmettre : pas encore testé avec Entra ID.
- Attribuer un groupe plutôt que des personnes une à une peut dépendre de la licence Entra ID
  de SOS : la page lue ne le dit pas.

Questions pour la visio du vendredi 20/11 : SOS est-il sur Microsoft 365, et un admin a-t-il le
rôle Cloud Application Administrator pour faire ces quatre étapes ?
