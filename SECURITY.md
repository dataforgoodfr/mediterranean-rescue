# Security Policy — Cartographie SOS Méditerranée

## Supported versions

| Version | Supported          |
| ------- | ------------------ |
| main    | ✅ (développement) |
| < 1.0   | ❌                 |

Toute correction de sécurité est appliquée sur `main` uniquement, tant qu'aucune version publiée n'existe.

## Contexte et modèle de menace

Ce projet alimente une carte publique documentant les opérations de recherche et sauvetage (SAR) de SOS Méditerranée en Méditerranée centrale. L'organisation est médiatisée, politiquement exposée et régulièrement visée par des détracteurs. De fait :

- toute faille peut servir d'outil de **délégitimation** (« leurs données ne sont pas fiables ») ;
- l'intégrité des données publiées est aussi importante que leur confidentialité ;
- la disponibilité de la carte pendant les périodes d'actualité forte est un enjeu.

**Règles non négociables :**

1. **Aucune donnée nominative.** Les sources fournies par SOS Méditerranée ne contiennent que des effectifs et des pays d'origine. Il est interdit d'introduire, même en test, des noms, identifiants, photos ou tout élément permettant d'identifier une personne secourue.
2. **Données d'exemple fictives obligatoires.** Tout développement, test, issue ou maquette utilise exclusivement le jeu de données fictives du projet (voir DoR - CONTRIBUTING.md). Aucune donnée réelle de mission ne figure dans le dépôt, les issues, les pull requests ou les environnements de développement.
3. **Gouvernance des accès.** Tout accès aux données de production passe par l'équipe OPS de SOS Méditerranée. Les accès sont attribués par rôles (RBAC) selon le principe du moindre privilège.
4. **Traçabilité.** Chaque publication de données doit être horodatée, attribuée à un auteur identifié et journalisée de manière infalsifiable.

## Périmètre couvert

Cette policy s'applique à :

- le code du frontend et du backend de la cartographie ;
- le pipeline de données (import, transformation, publication) ;
- les comptes et clés d'accès aux services (hébergement, APIs, stockage) ;
- les données publiées sur la carte et leurs métadonnées.

## Signaler une vulnérabilité

**Ne créez pas d'issue publique pour une faille de sécurité.**

Signalez-la via le formulaire GitHub « Report a vulnerability » (Private vulnerability reporting).

Merci d'inclure :

- une description de la vulnérabilité et de son impact potentiel ;
- les étapes de reproduction ou une preuve de concept ;
- les versions/environnements concernés ;
- toute suggestion de correction.

### Engagements de l'équipe

- **Accusé de réception** sous 72 heures ouvrées.
- **Évaluation et classification** sous 7 jours.
- **Correctif priorisé** selon la gravité ; les failles critiques sont traitées en priorité absolue.
- **Divulgation coordonnée** : nous créditons les chercheurs qui le souhaitent après correction (et avec leur accord).

### Ce que nous considérons comme acceptable

La sécurité est collective : toute recherche de failles effectuée de bonne foi, sans dégradation de service ni exploitation des données, est bienvenue et ne donnera lieu à aucune poursuite.

### Ce qui n'est pas acceptable

- l'accès, la copie ou la divulgation de données de missions réelles ;
- toute tentative d'identifier des personnes secourues ou des membres d'équipage ;
- les attaques par déni de service, le defacement ou tout test sur l'environnement de production sans accord écrit préalable.

## Bonnes pratiques contributeurs

- **Secrets** : jamais de clé, token ou mot de passe dans le code, l'historique ou les issues. Utilisez des variables d'environnement ; les secrets commis par erreur doivent être révoqués immédiatement et signalés.
- **Dépendances** : vérifiez les vulnérabilités connues avant d'ajouter une dépendance. Une analyse automatique est opérée par GitHub (Dependabot, CodeQL).
- **Revue de code** : toute PR touchant l'authentification, les accès, le pipeline de données ou la publication passe par la relecture d'au moins un tech lead.
- **Avant mise en production** : revue de sécurité passée, test d'intrusion « à venir », plan de réponse aux incidents vérifié « à venir ».

## Incident response (résumé)

En cas d'incident avéré : contenir (isoler), éradiquer, restaurer depuis une source intègre, puis communication coordonnée avec l'équipe OPS et la direction de SOS Méditerranée. Le détail des rôles et étapes est documenté séparément dans le plan de réponse aux incidents « à venir ».

---

*· Dernière mise à jour : novembre 2026*
