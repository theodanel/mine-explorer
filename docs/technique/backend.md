# Backend : comptes, sauvegarde cloud, classement

Retour à [[documentation-technique]].

Serveur Spring Boot 4.1 (Java 21) dans `backend/`. Il permet de se connecter avec Google, de retrouver sa partie sur n'importe quel appareil et de se comparer aux autres joueurs. Le jeu tourne toujours dans le navigateur : le serveur garde une copie de la partie et vérifie qu'elle est plausible, il ne la calcule pas.

## Vue d'ensemble

```
Navigateur ── https://mine.bouncylab.ovh ──> Cloudflare Pages (front Angular)
     │
     └── https://api.bouncylab.ovh ──> Raspberry Pi de Théo : Nginx Proxy Manager (HTTPS)
                                            └──> ce serveur (conteneur Docker) ──> PostgreSQL (conteneur)
```

| Paquet | Rôle |
|---|---|
| `security/` | Configuration Spring Security, connexion Google, limite de requêtes, taille des requêtes, durée de vie des sessions |
| `account/` | Joueur (pseudo), identités de connexion, profil, export et suppression du compte |
| `save/` | Sauvegarde cloud, verrou optimiste, anti-triche de plausibilité (`PlausibilityRules`, `ReferenceCurve`) |
| `leaderboard/` | Classements profondeur et Puits sans fond |
| `error/` | Réponses d'erreur `ProblemDetail` sans information interne |
| `config/` | Réglages `mine.*` validés au démarrage, horloge injectée |

Schéma de base versionné par Flyway (`src/main/resources/db/migration/`) ; Hibernate vérifie seulement qu'il correspond aux entités (`ddl-auto=validate`). Les sessions sont en base (Spring Session JDBC) : elles survivent à un redéploiement et peuvent être révoquées.

## API

Toutes les réponses d'erreur sont en `application/problem+json` avec un `code` stable que le front peut tester.

| Méthode et route | Connexion | Rôle |
|---|---|---|
| `GET /oauth2/authorization/google` | non | Lance la connexion Google (navigation, pas un appel `fetch`) ; retour sur l'adresse du jeu |
| `GET /api/csrf` | non | `{headerName, token}` : jeton à renvoyer dans l'en-tête `X-XSRF-TOKEN` de chaque écriture. À redemander après la connexion |
| `GET /api/me` | oui | `{pseudo, createdAt, providers}` |
| `PUT /api/me/pseudo` | oui | `{pseudo}` : 3 à 20 lettres, chiffres, espaces, tirets, soulignés ; unique sans tenir compte de la casse (`pseudo-invalid`, `pseudo-taken`) |
| `GET /api/me/export` | oui | Toutes les données gardées sur le joueur (RGPD) |
| `DELETE /api/me` | oui | Supprime le compte, la partie et toutes les sessions |
| `POST /api/me/logout-everywhere` | oui | Ferme toutes les sessions du joueur, sur tous les appareils |
| `POST /api/logout` | oui | Ferme la session en cours (204) |
| `GET /api/save` | oui | `{version, updatedAt, data}` ou 404 `no-save` |
| `PUT /api/save` | oui | `{expectedVersion, data}` → `{version, updatedAt}`. Erreurs : 409 `save-conflict` (avec `currentVersion`, sauf si deux appareils écrivent au même instant), 422 `implausible-progress`, 400 `save-invalid`, 413 `save-too-large`, 401 `account-gone` (compte supprimé depuis un autre appareil) |
| `GET /api/leaderboard/depth` et `/abyss` | non | `{top: [{rank, pseudo, value}], me}` : 100 premiers, et la place du joueur s'il est connecté |
| `GET /actuator/health` | non | `{"status":"UP"}`, sans détail, pour l'hébergeur |

`data` contient les clés `mine-explorer.*` du `localStorage` telles quelles (64 clés au plus, 64 Ko par valeur, 256 Ko en tout). Le serveur n'en lit que deux, pour l'anti-triche et le classement : `mine-explorer.progress` (zone, étape) et `mine-explorer.abyss` (record).

**Verrou optimiste** : chaque appareil envoie la version sur laquelle il s'est basé (`null` au tout premier envoi). Si un autre appareil a écrit entre-temps, le serveur répond 409 au lieu d'écraser la partie, et le front propose au joueur de garder l'une ou l'autre.

## Anti-triche (niveau 1, plausibilité)

Le serveur ne rejoue pas la partie : il refuse une progression qu'aucun joueur n'aurait pu atteindre dans le temps écoulé.

- **Référence** : la progression du joueur simulé qui joue sans arrêt (`tools/simulate.mts continu`), relevée dans `ReferenceCurve` (étape atteinte en fonction des heures de jeu).
- **Marge** : on accepte un joueur deux fois plus rapide que ce joueur simulé, plus 15 minutes (`mine.anti-cheat.speed-factor`, `mine.anti-cheat.grace`).
- **Origine de jeu** : chaque sauvegarde garde l'instant le plus tardif où le joueur aurait dû commencer à jouer sans pause pour avoir sa progression. La sauvegarde suivante ne peut pas dépasser ce que la référence atteint depuis cette origine. L'origine n'avance que d'après la progression réellement envoyée : la marge ne s'additionne pas d'un envoi à l'autre (testé dans `PlausibilityRulesTests`).
- **Première sauvegarde** (reprise d'une partie locale) : bornée par le temps écoulé depuis la mise en ligne du jeu (`mine.anti-cheat.release-date`).
- **Classement plafonné depuis la première connexion** : la partie est gardée entière, mais le classement n'affiche jamais plus que ce qu'un joueur aurait pu atteindre depuis la création de son compte, avec la même marge (`PlausibilityRules.ranked`). Une partie trafiquée en local puis envoyée à la connexion ne fait gagner aucune place ; une vraie partie jouée hors ligne remonte à sa place deux fois plus vite que le jeu normal ; un joueur connecté dès le début n'est jamais plafonné. La valeur affichée est recalculée à chaque envoi de sauvegarde (le front en envoie régulièrement).
- **Puits sans fond** : record limité par la profondeur atteinte dans la mine (l'étage 1 vaut le 5-1, deux filons par étage, 10 étages de marge), et à 500 étages.

Limites assumées : l'or, l'équipement et le reste de la partie ne sont pas vérifiés ; un tricheur peut avancer aussi vite qu'un joueur deux fois plus rapide que le joueur simulé sans pause, à partir de sa connexion. C'est suffisant tant que le classement ne rapporte rien. **Après tout rééquilibrage qui accélère la progression, relancer le simulateur et mettre à jour `ReferenceCurve`**, sinon de vrais joueurs seraient refusés (le serveur journalise chaque refus avec les valeurs, pour régler les seuils).

## Sécurité

| Risque | Protection |
|---|---|
| Vol de session par un script (XSS) | Aucun jeton dans le navigateur : session en base, cookie `MINE_SESSION` `HttpOnly`, `Secure`, `SameSite=Lax` |
| Requête forgée depuis un autre site (CSRF) | Jeton CSRF obligatoire sur toute écriture (en-tête `X-XSRF-TOKEN`), masqué différemment à chaque réponse ; cookie `SameSite=Lax` en plus |
| Appel de l'API depuis un autre site | CORS limité à l'adresse du jeu, avec cookies ; tout autre `Origin` reçoit 403 |
| Interception du code de connexion | Flux « authorization code » avec PKCE (S256), `state` et `nonce` ; signature, émetteur, audience, expiration et nonce du jeton d'identité vérifiés par Spring Security (testé de bout en bout avec un faux Google dans `GoogleLoginFlowTests`) ; adresse de retour fixée en production |
| Redirection ouverte après connexion | Retour toujours vers l'adresse fixe `mine.front.url` |
| Accès à la partie d'un autre joueur (IDOR) | Aucun identifiant dans les routes : le joueur vient toujours de la session (testé dans `SaveApiTests`) |
| Force brute, abus | Limite par adresse IP et par minute : 10 connexions, 30 écritures, 120 lectures (adresses IPv6 regroupées par bloc /64, qu'un abonné reçoit en entier) ; corps de requête limité à 512 Ko, refusé avant lecture |
| Session volée ou appareil perdu | Expiration après 14 jours d'inactivité, 60 jours au plus ; « se déconnecter partout » ; suppression de compte ; nouvel identifiant de session à la connexion |
| Base remplie de sessions anonymes | Session sans connexion (jeton CSRF, connexion Google en cours) : 30 minutes ; 14 jours seulement une fois connecté |
| Route oubliée | Tout ce qui n'est pas listé est refusé (`denyAll`) |
| Fuite d'informations internes | `ProblemDetail` génériques, aucune trace, en-têtes `nosniff`, `X-Frame-Options: DENY`, CSP `default-src 'none'`, `no-store` |
| Données personnelles | Ni e-mail ni nom : Google n'est interrogé qu'avec le scope `openid`, seul l'identifiant opaque du compte est gardé. Pseudo provisoire « Mineur-123456 » |
| Secrets | Aucun dans le dépôt : variables d'environnement, fichier `.env` resté sur le Pi |
| Dépendance vulnérable | Versions corrigées de Tomcat et Jackson imposées dans `pom.xml` tant que Spring Boot ne les inclut pas (voir [[audit-securite-backend]]) |
| Conteneur | Utilisateur sans privilèges, JRE seul, sans sources ni outils de compilation |

Audit complet du 14/10/2026, constats et points à décider : [[audit-securite-backend]].

La limite de requêtes vit en mémoire : elle suppose **un seul conteneur** serveur. Derrière Nginx Proxy Manager, Tomcat reprend l'adresse du joueur dans `X-Forwarded-For` (et le HTTPS dans `X-Forwarded-Proto`), mais seulement pour une requête venue du réseau Docker du proxy, `172.30.0.0/24` (`server.forward-headers-strategy=native`, `server.tomcat.remoteip.internal-proxies`, vérifié dans `ProductionProfileTests`). Une requête venue d'ailleurs garde son adresse réelle, quels que soient les en-têtes qu'elle invente.

## Lancer en local

```bash
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev   # Windows : .\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=dev"
```

Profil `dev` : base H2 sur disque dans `backend/data/` (ignorée par git), front attendu sur `http://localhost:4200`, cookie sans `Secure` (pas de HTTPS sur localhost). Sans identifiants Google le serveur démarre, seule la connexion échoue. Pour la tester, créer le client OAuth (ci-dessous) puis :

```powershell
$env:GOOGLE_CLIENT_ID = "…apps.googleusercontent.com"
$env:GOOGLE_CLIENT_SECRET = "…"
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=dev"
```

Sans profil, le serveur refuse de démarrer (réglages `mine.*` manquants) : impossible de lancer par erreur la production avec les réglages de dev, ou l'inverse.

Tests : `./mvnw verify` (H2 en mode PostgreSQL, mêmes migrations qu'en production, horloge figée).

## Mise en ligne

Le serveur et sa base PostgreSQL tournent sur le Raspberry Pi 5 de Théo (Raspberry Pi OS 32 bits), en `docker compose`, derrière Nginx Proxy Manager qui donne le HTTPS à `https://api.bouncylab.ovh`. Tout est dans [`deploiement/raspberry-pi/`](../../deploiement/raspberry-pi/LISEZMOI.md) : compose, image (Ubuntu 24.04 + OpenJDK 21 armhf, faute d'image Java 21 officielle en 32 bits ARM), compte de base limité aux données, mode d'emploi pas à pas. La CI démarre ce même compose en amd64 à chaque PR (job « Docker »).

| Variable (`.env` sur le Pi) | Rôle |
|---|---|
| `POSTGRES_USER` / `POSTGRES_PASSWORD` | Compte propriétaire du schéma, utilisé par Flyway pour les migrations |
| `MINE_APP_PASSWORD` | Compte `mine_app` de l'appli, limité aux données (créé par `db/01-compte-appli.sh`) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Client OAuth Google, URI de retour `https://api.bouncylab.ovh/login/oauth2/code/google` |

Le front (Cloudflare Pages) appelle l'API depuis `https://mine.bouncylab.ovh` : seule origine autorisée par le CORS, et `connect-src` de sa CSP (`frontend/public/_headers`) ouvert à `https://api.bouncylab.ovh`.

## Côté jeu (`frontend/src/app/online/`)

| Fichier | Rôle |
|---|---|
| `environments/environment*.ts` | Interrupteur du jeu en ligne : allumé avec `ng serve` (serveur sur `http://localhost:8080`) et dans le build de production (`https://api.bouncylab.ovh`, autorisé dans `connect-src` de `public/_headers` et `nginx.conf`) |
| `online-api.ts` | Appels `fetch` avec le cookie de session (`credentials: 'include'`) et le jeton CSRF, redemandé une fois s'il a expiré ; hors connexion, le jeu continue |
| `online-account.ts` | État du compte (connecté, déconnecté, serveur injoignable), pseudo, export, suppression |
| `cloud-sync.ts` | Sauvegarde entièrement automatique : premier envoi de la partie locale, envoi toutes les 5 minutes et quand l'onglet passe en arrière-plan, choix du joueur si le cloud a une autre partie (rien n'est écrasé sans lui) |
| `account-card/`, `leaderboard-page/` | Carte « Compte » (Profil) et classement (Profil, ou trophée en haut à gauche de la mine), dans le style cartoon du jeu : parchemin, boutons de jeu, médailles du podium. Seul le bouton Google garde son aspect officiel |
| `account-prompt/` | Bulle « Ne perds pas ta partie » : proposée après la première évolution (vers 30 min de jeu), jamais avant de jouer ; « Plus tard » la fait taire 3 jours. Fenêtre automatique la moins prioritaire (`shared/overlays.ts`) |

Éteint, aucun appel réseau n'a lieu : la synchronisation n'est pas chargée, la carte et le classement vivent dans le morceau différé de la page Profil, et la bulle (chargée avec les autres fenêtres différées) ne s'affiche jamais. Les tests tournent jeu en ligne éteint (`src/test-providers.ts`) ; `online.spec.ts` l'allume contre un faux serveur.

Tester en local : lancer le serveur (profil `dev`), puis `npm start` dans `frontend/` sur le port 4200, Profil, « Se connecter avec Google ».

## Ajouter Apple plus tard

Le modèle est prêt : un joueur peut avoir plusieurs identités (`player_identity`, unique par fournisseur et identifiant). Il faudra un second enregistrement OAuth (`spring.security.oauth2.client.registration.apple`, retour en `form_post`, secret client signé ES256 régénéré), et le même `PlayerOidcUserService` reliera le compte Apple à un joueur.
