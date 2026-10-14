# Backend : comptes, sauvegarde cloud, classement

Retour à [[documentation-technique]].

Serveur Spring Boot 4.1 (Java 21) dans `backend/`. Il permet de se connecter avec Google, de retrouver sa partie sur n'importe quel appareil et de se comparer aux autres joueurs. Le jeu tourne toujours dans le navigateur : le serveur garde une copie de la partie et vérifie qu'elle est plausible, il ne la calcule pas.

## Vue d'ensemble

```
Navigateur ── https://mine.bouncylab.ovh ──> Cloudflare Pages (front Angular)
     │
     └── https://api.bouncylab.ovh ──> Fly.io, Paris (ce serveur, conteneur Docker)
                                            └──> Neon (PostgreSQL)
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
| `PUT /api/save` | oui | `{expectedVersion, data}` → `{version, updatedAt}`. Erreurs : 409 `save-conflict` (avec `currentVersion`), 422 `implausible-progress`, 400 `save-invalid`, 413 `save-too-large` |
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
- **Puits sans fond** : record limité par la profondeur atteinte dans la mine (l'étage 1 vaut le 5-1, deux filons par étage, 10 étages de marge), et à 500 étages.

Limites assumées : l'or, l'équipement et le reste de la partie ne sont pas vérifiés ; un tricheur peut avancer aussi vite qu'un joueur deux fois plus rapide que le joueur simulé sans pause. C'est suffisant tant que le classement ne rapporte rien. **Après tout rééquilibrage qui accélère la progression, relancer le simulateur et mettre à jour `ReferenceCurve`**, sinon de vrais joueurs seraient refusés (le serveur journalise chaque refus avec les valeurs, pour régler les seuils).

## Sécurité

| Risque | Protection |
|---|---|
| Vol de session par un script (XSS) | Aucun jeton dans le navigateur : session en base, cookie `MINE_SESSION` `HttpOnly`, `Secure`, `SameSite=Lax` |
| Requête forgée depuis un autre site (CSRF) | Jeton CSRF obligatoire sur toute écriture (en-tête `X-XSRF-TOKEN`), masqué différemment à chaque réponse ; cookie `SameSite=Lax` en plus |
| Appel de l'API depuis un autre site | CORS limité à l'adresse du jeu, avec cookies ; tout autre `Origin` reçoit 403 |
| Interception du code de connexion | Flux « authorization code » avec PKCE (S256), `state` et `nonce` ; signature, émetteur, audience et expiration du jeton d'identité vérifiés par Spring Security |
| Redirection ouverte après connexion | Retour toujours vers l'adresse fixe `mine.front.url` |
| Accès à la partie d'un autre joueur (IDOR) | Aucun identifiant dans les routes : le joueur vient toujours de la session (testé dans `SaveApiTests`) |
| Force brute, abus | Limite par adresse IP et par minute : 10 connexions, 30 écritures, 120 lectures ; corps de requête limité à 512 Ko, refusé avant lecture |
| Session volée ou appareil perdu | Expiration après 14 jours d'inactivité, 60 jours au plus ; « se déconnecter partout » ; suppression de compte |
| Route oubliée | Tout ce qui n'est pas listé est refusé (`denyAll`) |
| Fuite d'informations internes | `ProblemDetail` génériques, aucune trace, en-têtes `nosniff`, `X-Frame-Options: DENY`, CSP `default-src 'none'`, `no-store` |
| Données personnelles | Ni e-mail ni nom : Google n'est interrogé qu'avec le scope `openid`, seul l'identifiant opaque du compte est gardé. Pseudo provisoire « Mineur-123456 » |
| Secrets | Aucun dans le dépôt : variables d'environnement, secrets Fly.io |
| Conteneur | Utilisateur sans privilèges, JRE seul, sans sources ni outils de compilation |

La limite de requêtes vit en mémoire : elle suppose **une seule machine** (réglé dans `fly.toml`). Derrière le proxy de Fly.io, l'adresse du joueur est lue dans l'en-tête `Fly-Client-IP` (profil `prod` uniquement : ailleurs, un client pourrait l'inventer) [PROBABLE : en-tête posé par le proxy Fly.io, à vérifier au premier déploiement dans les journaux].

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

## Mise en ligne (à faire par Théo)

Rien n'est encore créé. Étapes dans l'ordre, une seule fois.

### 1. Client OAuth Google

1. [Google Cloud Console](https://console.cloud.google.com/) : créer un projet « Mine Explorer ».
2. *APIs et services → Écran de consentement OAuth* : type **Externe**, nom de l'appli, adresse de contact, domaine autorisé `bouncylab.ovh`. Scopes : seulement `openid`. Publier l'appli (sinon seuls les comptes de test peuvent se connecter).
3. *Identifiants → Créer des identifiants → ID client OAuth* : type **Application Web**.
   - URI de redirection autorisés : `https://api.bouncylab.ovh/login/oauth2/code/google` et, pour le local, `http://localhost:8080/login/oauth2/code/google`.
4. Copier l'ID client et le code secret. Le secret ne va **que** dans les secrets Fly.io et, en local, dans une variable d'environnement de la session.

[PROBABLE] Les intitulés de la console Google changent souvent ; les réglages restent ceux-ci.

### 2. Base Neon

1. Créer un projet sur [neon.com](https://neon.com), région la plus proche de Paris (Francfort).
2. Créer deux rôles : `mine_owner` (propriétaire de la base, pour les migrations) et `mine_app` (pour l'appli).
3. Dans l'éditeur SQL, **avant le premier déploiement**, limiter `mine_app` aux données des tables que `mine_owner` créera :
   ```sql
   GRANT USAGE ON SCHEMA public TO mine_app;
   ALTER DEFAULT PRIVILEGES FOR ROLE mine_owner IN SCHEMA public
     GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO mine_app;
   ```
   `mine_app` ne peut ainsi ni créer, ni modifier, ni supprimer de table : une injection SQL ne pourrait pas toucher au schéma.
4. Relever l'adresse JDBC : `jdbc:postgresql://<hôte>.neon.tech/<base>?sslmode=require`.

### 3. Appli Fly.io

```bash
fly auth login
cd backend
fly apps create mine-explorer-api          # changer le nom dans fly.toml s'il est pris
fly secrets set \
  SPRING_DATASOURCE_URL="jdbc:postgresql://…neon.tech/…?sslmode=require" \
  SPRING_DATASOURCE_USERNAME=mine_app SPRING_DATASOURCE_PASSWORD=… \
  SPRING_FLYWAY_USER=mine_owner SPRING_FLYWAY_PASSWORD=… \
  GOOGLE_CLIENT_ID=… GOOGLE_CLIENT_SECRET=…
fly deploy
fly certs add api.bouncylab.ovh            # affiche l'enregistrement DNS à créer
```

Chez OVH, zone DNS de `bouncylab.ovh` : ajouter l'enregistrement `api` donné par `fly certs add` (CNAME vers `mine-explorer-api.fly.dev` en général). `fly certs show api.bouncylab.ovh` confirme le certificat.

Vérification : `https://api.bouncylab.ovh/actuator/health` répond `{"status":"UP"}`.

### 4. Front

Allumer le jeu en ligne dans le build de production : `frontend/src/environments/environment.ts`, `online: { enabled: true, apiUrl: 'https://api.bouncylab.ovh' }`, et ajouter `https://api.bouncylab.ovh` à `connect-src` dans `frontend/public/_headers`. Puis vérifier le build servi avec `node tools/serve-dist.mjs` (aucune violation de CSP).

| Variable (secret Fly.io) | Rôle |
|---|---|
| `SPRING_DATASOURCE_URL` | Adresse JDBC de Neon, avec `sslmode=require` |
| `SPRING_DATASOURCE_USERNAME` / `SPRING_DATASOURCE_PASSWORD` | Compte `mine_app`, limité aux données |
| `SPRING_FLYWAY_USER` / `SPRING_FLYWAY_PASSWORD` | Compte `mine_owner`, pour les migrations au démarrage |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Client OAuth Google |

`SPRING_PROFILES_ACTIVE=prod` est déjà dans `fly.toml` et l'image Docker. Le déploiement automatique par la CI viendra quand l'appli existera (jeton Fly.io dans l'environnement GitHub `production`).

## Côté jeu (`frontend/src/app/online/`)

| Fichier | Rôle |
|---|---|
| `environments/environment*.ts` | Interrupteur du jeu en ligne : **allumé avec `ng serve`** (serveur sur `http://localhost:8080`), **éteint dans le build de production** tant que le serveur n'est pas hébergé |
| `online-api.ts` | Appels `fetch` avec le cookie de session (`credentials: 'include'`) et le jeton CSRF, redemandé une fois s'il a expiré ; hors connexion, le jeu continue |
| `online-account.ts` | État du compte (connecté, déconnecté, serveur injoignable), pseudo, export, suppression |
| `cloud-sync.ts` | Sauvegarde entièrement automatique : premier envoi de la partie locale, envoi toutes les 5 minutes et quand l'onglet passe en arrière-plan, choix du joueur si le cloud a une autre partie (rien n'est écrasé sans lui) |
| `account-card/`, `leaderboard-page/` | Carte « Compte » et classement, dans la page Profil. Style volontairement sobre et bouton Google officiel, pour inspirer confiance |
| `account-prompt/` | Bulle « Ne perds pas ta partie » : proposée après la première évolution (vers 30 min de jeu), jamais avant de jouer ; « Plus tard » la fait taire 3 jours. Fenêtre automatique la moins prioritaire (`shared/overlays.ts`) |

Éteint, aucun appel réseau n'a lieu : la synchronisation n'est pas chargée, la carte et le classement vivent dans le morceau différé de la page Profil, et la bulle (chargée avec les autres fenêtres différées) ne s'affiche jamais. Les tests tournent jeu en ligne éteint (`src/test-providers.ts`) ; `online.spec.ts` l'allume contre un faux serveur.

Tester en local : lancer le serveur (profil `dev`), puis `npm start` dans `frontend/` sur le port 4200, Profil, « Se connecter avec Google ».

## Ajouter Apple plus tard

Le modèle est prêt : un joueur peut avoir plusieurs identités (`player_identity`, unique par fournisseur et identifiant). Il faudra un second enregistrement OAuth (`spring.security.oauth2.client.registration.apple`, retour en `form_post`, secret client signé ES256 régénéré), et le même `PlayerOidcUserService` reliera le compte Apple à un joueur.
