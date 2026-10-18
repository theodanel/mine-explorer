# Audit de sécurité du backend (14/10/2026)

Retour à [[documentation-technique]]. Voir aussi [[backend]] et [[securite]].

Audit du serveur Spring Boot de la PR « Backend : connexion Google, sauvegarde cloud, anti-triche et classement » (branche `feat/backend-comptes`), avant sa première mise en ligne. Les corrections sont dans la PR « Audit de sécurité du backend », qui cible cette branche.

## Ce qui a réellement été exécuté

| Action | Résultat |
|---|---|
| `./mvnw verify` avant l'audit | 69 tests verts |
| `./mvnw verify` après corrections | **95 tests verts** (26 ajoutés) |
| Contre-épreuve : code de production remis dans son état d'origine, nouveaux tests gardés | 5 tests échouent, un par correction testable : les tests couvrent bien les corrections |
| Audit des dépendances : liste Maven (`mvnw dependency:list`, 118 dépendances d'exécution) soumise à la base [OSV.dev](https://osv.dev) (API `querybatch`) | Avant : 10 avis (Tomcat 11.0.24, Jackson 3.1.5). Après : **0** |
| Alertes Dependabot du dépôt (`gh api …/dependabot/alerts`) | **Désactivées** sur le dépôt (réponse 403) |

**Non exécuté** : OWASP Dependency-Check (il télécharge toute la base NVD, très lent sans clé d'API ; OSV agrège les mêmes avis GitHub et NVD pour Maven) ; une vraie connexion Google ; un déploiement Fly.io ; les droits SQL sur Neon. Ce qui en dépend est marqué **[déduit]** ou **[à vérifier]** ci-dessous.

## Constats par gravité

| # | Gravité | Constat | État |
|---|---|---|---|
| 1 | Haute | Dépendances avec failles connues | Corrigé |
| 2 | Moyenne | Aucune alerte de faille sur les dépendances Maven | **Action de Théo** |
| 3 | Moyenne | Sessions anonymes gardées 14 jours en base | Corrigé, testé |
| 4 | Moyenne | Limite de requêtes contournable en IPv6 | Corrigé, testé |
| 5 | Moyenne | Anti-triche : un compte neuf peut envoyer une progression très avancée | Corrigé, testé (choix de Théo) |
| 6 | Faible | Erreur 500 si deux appareils envoient la première sauvegarde en même temps | Corrigé, testé |
| 7 | Faible | Erreur 500 si un appareil sauvegarde après suppression du compte | Corrigé, testé |
| 8 | Faible | Adresse de retour Google construite à partir d'en-têtes du client | Corrigé |
| 9 | Faible | Rang personnel faux en cas d'égalité parfaite au classement | Corrigé, testé |
| 10 | Faible | Pseudos visuellement identiques (homoglyphes) | Non corrigé, décision de Théo |
| 11 | Info | Corps de requête sans taille annoncée en HTTP/2 | Non exploitable aujourd'hui |
| 12 | Info | Remise à zéro de tous les compteurs au-delà de 50 000 adresses | Accepté |
| 13 | Info | Sauvegardes Neon après suppression d'un compte | À mentionner (RGPD) |

### 1. Dépendances avec failles connues (haute, corrigé)

Spring Boot 4.1.1, dernière version publiée, embarque :

- **Tomcat 11.0.24** : 3 avis critiques publiés le 26/08/2026 ([GHSA-9xv2-5v5q-p794](https://github.com/advisories/GHSA-9xv2-5v5q-p794), [GHSA-gcx9-497g-6cp6](https://github.com/advisories/GHSA-gcx9-497g-6cp6), [GHSA-h3x4-894j-xpx5](https://github.com/advisories/GHSA-h3x4-894j-xpx5)). Deux visent les authentificateurs DIGEST et FORM de Tomcat, que l'appli n'utilise pas (Spring Security gère l'authentification) **[déduit]** ; le troisième est décrit seulement comme un défaut de contrôle d'accès.
- **Jackson 3.1.5** (`jackson-core`, `jackson-databind`) : 7 avis, dont 5 « high », presque tous des dénis de service à la lecture de JSON. Le serveur lit du JSON envoyé par n'importe qui : c'est le risque le plus concret.

Correction : versions corrigées imposées dans `backend/pom.xml` (`tomcat.version` 11.0.27, `jackson-bom.version` 3.1.7), à retirer quand Spring Boot les inclura. Ce sont des versions correctives de dépendances déjà présentes, pas de nouvelle dépendance. Suite complète verte et OSV à 0 après le changement.

### 2. Aucune alerte de faille sur les dépendances Maven (moyenne, action de Théo)

Les alertes Dependabot sont désactivées sur le dépôt, et la CI n'a aucun équivalent de `npm audit` pour le backend : le point 1 serait passé inaperçu. Les mises à jour hebdomadaires de Dependabot ne suffisent pas ici, car elles suivent les versions de Spring Boot, pas les failles de Tomcat ou Jackson entre deux versions de Spring Boot.

À faire :

1. **Activer les alertes Dependabot** (et les mises à jour de sécurité) : dépôt GitHub, *Settings → Advanced Security* (ou *Code security*), *Dependabot alerts → Enable*. [PROBABLE] l'intitulé exact du menu varie.
2. **Proposé, à décider** : une étape OSV-Scanner dans la CI du backend, bloquante comme `npm audit` (action officielle `google/osv-scanner-action`, nouvelle dépendance de CI, donc pas ajoutée sans accord).

### 3. Sessions anonymes gardées 14 jours en base (moyenne, corrigé)

`GET /api/csrf` et `GET /oauth2/authorization/google` créent une session, rangée dans PostgreSQL, sans être connecté. Elle durait 14 jours d'inactivité comme une vraie session. Avec la limite de 120 lectures par minute, une seule adresse pouvait créer environ 2,4 millions de lignes avant la première expiration : de quoi remplir la base Neon.

Correction : `spring.session.timeout=30m` pour toute session ; la connexion réussie la passe à 14 jours (`mine.session.idle-timeout`, posé dans `SecurityConfig`). Testé dans `GoogleLoginFlowTests` (30 minutes avant connexion, 14 jours après).

### 4. Limite de requêtes contournable en IPv6 (moyenne, corrigé)

Le compteur était tenu par adresse. Un abonné IPv6 reçoit en général un bloc /64, soit des milliards d'adresses : il pouvait en changer à chaque requête et ne jamais atteindre la limite (connexion, écritures).

Correction : `ClientAddress` regroupe les adresses IPv6 par /64 ; les IPv4 restent comptées une à une. La valeur de l'en-tête n'est jamais résolue par DNS (seule une adresse littérale est lue). Testé dans `RateLimitTests`.

### 5. Anti-triche : progression très avancée sur un compte neuf (moyenne, corrigé)

La première sauvegarde d'un compte est bornée par le temps écoulé depuis la mise en ligne (`mine.anti-cheat.release-date`), pour accepter une partie jouée hors ligne avant de se connecter. Conséquence : avec le facteur 2, la courbe de référence est entièrement atteignable environ **8,5 jours après la mise en ligne** (405,6 h ÷ 2), et la limite continue ensuite de monter. Passé ce délai, un tricheur crée un compte et envoie d'un coup une progression au-delà de la dernière zone : elle est acceptée et entre au classement.

Options étudiées : rendre la connexion obligatoire au lancement (écartée : elle bloque les joueurs sans compte Google et va contre l'usage des jeux idle), refuser une première sauvegarde au-delà d'un temps hors ligne maximal (écartée : refuse des joueurs honnêtes), ou n'afficher la partie au classement qu'après un délai (écartée : le tricheur n'a qu'à attendre).

Retenu par Théo le 14/10/2026 : la partie est gardée entière, mais **le classement n'affiche jamais plus que ce qu'un joueur aurait pu atteindre depuis la création de son compte** (`PlausibilityRules.ranked`, valeurs recalculées à chaque envoi). Le tricheur est affiché au niveau d'un débutant puis ne monte qu'au rythme du jeu ; le joueur honnête qui avait joué hors ligne retrouve sa place en deux fois moins de temps qu'il n'en a joué ; le joueur connecté dès le début n'est jamais plafonné. Testé dans `PlausibilityRulesTests` et `LeaderboardApiTests.partieTrafiqueeAvantConnexionSansPlaceGagnee`. Cette correction est dans une PR séparée, empilée sur celle de l'audit.

### 6. Deux premières sauvegardes simultanées (faible, corrigé)

Deux appareils qui envoient chacun la toute première sauvegarde au même instant : le second butait sur la clé primaire et recevait une erreur 500, journalisée en erreur. Il reçoit désormais 409 `save-conflict`, comme un conflit de version, et le front relit la partie du cloud. Testé dans `SaveServiceTests` (cas impossible à provoquer de façon fiable par l'API).

### 7. Sauvegarde après suppression du compte (faible, corrigé)

Un appareil dont la requête part juste après la suppression du compte sur un autre appareil créait une erreur de clé étrangère (500). Il reçoit désormais 401 `account-gone`, déjà utilisé par `GET /api/me` dans ce cas. Testé dans `SaveApiTests`.

### 8. Adresse de retour Google construite à partir d'en-têtes (faible, corrigé)

En production, `server.forward-headers-strategy=framework` fait confiance aux en-têtes `X-Forwarded-*`. Si le proxy de Fly.io ne les écrase pas tous **[à vérifier]**, un client peut changer l'hôte de l'adresse de retour envoyée à Google. Google refuse une adresse qui n'est pas enregistrée dans le client OAuth **[déduit]**, donc pas d'exploitation connue ; l'adresse est quand même fixée dans `application-prod.properties` (`https://api.bouncylab.ovh/login/oauth2/code/{registrationId}`). Vérifié dans `ProductionProfileTests`. **Si le domaine de l'API change, changer aussi cette ligne.**

### 9. Rang personnel en cas d'égalité parfaite (faible, corrigé)

Le haut du classement départage deux joueurs à même valeur atteinte au même instant par leur identifiant ; le calcul du rang personnel ne le faisait pas, et les deux joueurs voyaient le même rang. Mêmes critères partout désormais. Testé dans `LeaderboardApiTests`.

### 10. Pseudos visuellement identiques (faible, non corrigé)

Les pseudos acceptent les lettres de tous les alphabets : « Тheo » (T cyrillique) et « Theo » sont deux pseudos distincts pour le serveur, identiques à l'écran. Un joueur peut se faire passer pour un autre au classement. Correction possible : refuser un pseudo qui mélange plusieurs alphabets (contrôle par `Character.UnicodeScript`), sans exclure les joueurs qui écrivent dans un autre alphabet. Peu d'enjeu tant que le classement ne rapporte rien.

### 11 à 13. Points d'information

- **11.** `BodySizeFilter` refuse un corps trop gros ou envoyé par morceaux (`Transfer-Encoding: chunked`), mais laisserait passer un corps HTTP/2 sans `Content-Length`. Tomcat n'a pas HTTP/2 activé et le proxy de Fly.io parle HTTP/1.1 à l'appli **[PROBABLE]** : non exploitable aujourd'hui. À revoir si `server.http2.enabled` est activé un jour.
- **12.** Au-delà de 50 000 adresses suivies en même temps, `RateLimiter` repart de zéro pour tout le monde (mémoire bornée). Un attaquant disposant d'autant d'adresses n'est de toute façon pas arrêté par une limite par adresse : accepté.
- **13.** La suppression de compte efface tout dans la base, mais les sauvegardes automatiques de Neon (restauration à un instant passé) gardent les données pendant leur durée de rétention. À indiquer dans la future politique de confidentialité.

## Points vérifiés sans défaut

| Point | Preuve |
|---|---|
| Connexion Google : « authorization code », PKCE S256, `state`, `nonce`, scope `openid` seul | `SecurityTests.connexionGoogleAvecPkceEtState` ; `code_verifier` bien envoyé à l'échange du code (`GoogleLoginFlowTests`) |
| Jeton d'identité : signature, émetteur, audience, expiration, nonce | **Nouveau** `GoogleLoginFlowTests` : faux Google local (échange du code et clés publiques), chaque altération du jeton est refusée et ne crée aucun compte |
| `state` inconnu refusé sans appel à Google | `GoogleLoginFlowTests.stateInconnuRefuseSansAppelerGoogle` |
| Nouvel identifiant de session à la connexion (fixation de session) | `GoogleLoginFlowTests.connexionValideOuvreUneSessionNeuveDe14Jours` |
| Retour après connexion vers une adresse fixe (pas de redirection ouverte) | Code (`SecurityConfig`) et `GoogleLoginFlowTests` |
| Cookie `MINE_SESSION` `HttpOnly`, `Secure`, `SameSite=Lax` | `SecurityTests.jetonCsrfLuPuisRenvoye` ; `Secure` en production : `ProductionProfileTests` |
| Durée maximale de session (60 jours), « se déconnecter partout », suppression du compte | `SessionLifetimeFilterTests`, `AccountApiTests` |
| Déconnexion : jeton CSRF exigé, session supprimée en base, cookie effacé | **Nouveau** `SecurityTests.deconnexionDemandeLeJetonCsrfPuisFermeLaSession` |
| CSRF sur toute écriture ; jeton d'une autre session refusé | `SecurityTests`, `AccountApiTests`, **nouveau** `jetonCsrfDUneAutreSessionRefuse` |
| CORS limité à l'adresse du jeu, origine `null` refusée | `SecurityTests` |
| Anti-IDOR : aucun identifiant dans les routes, le joueur vient de la session | Lecture de toutes les routes ; `SaveApiTests.unJoueurNeVoitNiNEcraseLaPartieDUnAutre` |
| Tout ce qui n'est pas listé est refusé ; méthode imprévue refusée sans trace | `ErrorResponseTests`, **nouveau** `SecurityTests.methodeNonPrevueRefusee` |
| Validation des sauvegardes : clés, nombre de clés, taille, bornes, entier trop grand, version négative | `SaveApiTests` (cas ajoutés : bornes, dépassement d'entier, taille totale, version absente ou négative) |
| Contrôle de conflit (verrou optimiste) | `SaveApiTests` |
| Anti-triche : la marge ne se cumule pas d'un envoi à l'autre | `PlausibilityRulesTests` |
| Classements : seuls pseudo, rang et valeur sont publics | `LeaderboardApiTests` |
| Export RGPD complet, suppression en cascade | `AccountApiTests` |
| En-têtes : CSP `default-src 'none'`, `nosniff`, `X-Frame-Options`, `no-referrer`, `no-store`, HSTS en HTTPS | `SecurityTests` (HSTS : **nouveau** `hstsEnHttps`) |
| Erreurs sans trace ni message interne | `ErrorResponseTests`, `SaveApiTests.cleEtrangereAuJeuRefusee` |
| Journaux sans secret ni donnée personnelle | Lecture du code : seuls le type d'erreur de connexion, la catégorie de limite et les valeurs d'anti-triche sont journalisés |
| Secrets uniquement en variables d'environnement, sans valeur par défaut en production | `ProductionProfileTests` ; aucun secret dans le dépôt (lecture) |
| Console H2 fermée, actuator limité à `health` sans détail | `ErrorResponseTests.consoleH2Fermee`, `SecurityTests.santeSansDetail`, `ProductionProfileTests` |
| Requêtes SQL : JPQL paramétré ; seuls des noms de colonnes tirés d'une énumération sont concaténés | Lecture de `LeaderboardService` |
| Migrations Flyway : schéma seul source de vérité (`ddl-auto=validate`), compte de migration séparé du compte de l'appli en production | Lecture ; droits Neon **[à vérifier]** au premier déploiement |
| Conteneur : utilisateur sans privilèges, JRE seul | Lecture du `Dockerfile` |

## À vérifier au premier déploiement

Mise à jour du 18/10/2026 : l'hébergement passe de Fly.io et Neon au Raspberry Pi de Théo (`deploiement/raspberry-pi`). L'adresse du joueur vient de `X-Forwarded-For`, cru seulement depuis le réseau Docker de Nginx Proxy Manager (`172.30.0.0/24`) ; les constats ci-dessus qui citent Fly.io restent valables pour ce proxy.

- Les journaux de limite de requêtes montrent l'adresse des joueurs et pas celle du proxy (`172.30.0.x`).
- Le compte `mine_app` ne peut pas créer ni supprimer de table (`CREATE TABLE test (id int);` doit échouer avec ce compte).
- `https://api.bouncylab.ovh/actuator/env` répond 401 et `/actuator/health` seulement `{"status":"UP"}`.
