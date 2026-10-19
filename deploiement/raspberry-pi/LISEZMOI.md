# Serveur de Mine Explorer sur le Raspberry Pi

Le jeu reste sur Cloudflare Pages (`https://mine.bouncylab.ovh`). Le Raspberry Pi 5 de Théo, en **Raspberry Pi OS 32 bits** (Docker `linux/arm`), fait tourner le serveur (comptes Google, sauvegarde en ligne, classement) et sa base, avec `docker compose`. **Nginx Proxy Manager** (NPM), déjà installé sur le Pi (ports 80 et 443), donne le HTTPS à `https://api.bouncylab.ovh`.

```
joueur ──HTTPS──▶ NPM (Pi, 443) ──réseau Docker « proxy »──▶ backend:8080 ──▶ db:5432
```

| Service | Image | Rôle | Publié ? |
|---|---|---|---|
| `backend` | `ubuntu:24.04` + OpenJDK 21 (armhf) | serveur Spring Boot, profil `prod` | non : seulement NPM le joint |
| `db` | `postgres:17` | base PostgreSQL, volume `db-data` | non |

Tous tournent sans root et sans capacités Linux ; `backend` a un système de fichiers en lecture seule. Le jar est compilé **sur le PC** : le Pi ne fait que l'emballer.

## Pourquoi Ubuntu + OpenJDK et pas une image Java toute faite

Le projet est en **Java 21**. Vérifié dans les manifestes Docker Hub le 18/10/2026 : `eclipse-temurin:21-jre`, `bellsoft/liberica-openjre-debian:21`, `amazoncorretto:21` et `ibm-semeru-runtimes:open-21-jre` n'existent qu'en amd64/arm64, pas en `linux/arm/v7`. `ubuntu:24.04` existe en arm/v7 et son dépôt `main` contient `openjdk-21-jre-headless` pour armhf, mis à jour par Canonical.

## Pourquoi un réseau « proxy » à sous-réseau fixe

NPM transmet l'adresse du joueur dans `X-Forwarded-For` et le HTTPS dans `X-Forwarded-Proto`. N'importe qui peut écrire ces en-têtes : le serveur ne les croit que si la requête vient du sous-réseau `172.30.0.0/24` (`server.tomcat.remoteip.internal-proxies` dans `application-prod.properties`), où seul NPM est branché. Sinon un tricheur changerait d'adresse à chaque requête pour échapper à la limite de requêtes.

## Une seule fois

### Sur le Pi : le réseau partagé avec NPM

```bash
docker network create --subnet 172.30.0.0/24 proxy
docker ps --format '{{.Names}}'            # repérer le conteneur de Nginx Proxy Manager
docker network connect proxy <conteneur-npm>
```

Si NPM est lancé par un `docker-compose.yml`, ajouter plutôt le réseau `proxy` (`external: true`) à ce fichier, sinon il sera débranché à la prochaine recréation du conteneur.

### Dans la console Google Cloud : l'adresse de retour de production

Dans le client OAuth déjà créé (*API et services → Identifiants → ID client OAuth*), ajouter aux **URI de redirection autorisés** :

```
https://api.bouncylab.ovh/login/oauth2/code/google
```

Garder `http://localhost:8080/login/oauth2/code/google` pour les essais en local. Si l'écran de consentement est encore « en test », seuls les comptes de test peuvent se connecter : le publier pour ouvrir à tous.

## Étape 1 · Sur le PC : préparer l'archive

```powershell
cd C:\Users\theod\IdleRpgGame\mine-explorer\deploiement\raspberry-pi
powershell -ExecutionPolicy Bypass -File .\preparer.ps1
```

Le script compile le serveur et produit `mine-explorer-api.tar.gz`. `-ExecutionPolicy Bypass` ne vaut que pour ce lancement.

## Étape 2 · Trouver l'adresse du Pi

Sur le Pi : `hostname -I`. La première adresse remplace `<ip-du-pi>` ci-dessous ; `<utilisateur>` est le compte du Pi.

## Étape 3 · Sur le PC : envoyer l'archive

```powershell
scp .\mine-explorer-api.tar.gz <utilisateur>@<ip-du-pi>:~/
```

## Étape 4 · Se connecter au Pi

```powershell
ssh <utilisateur>@<ip-du-pi>
```

Toutes les commandes suivantes se tapent **sur le Pi**.

## Étape 5 · Déballer

```bash
mkdir -p ~/mine-explorer-api
tar -xzf ~/mine-explorer-api.tar.gz -C ~/mine-explorer-api
cd ~/mine-explorer-api
```

## Étape 6 · Créer le fichier de secrets (la première fois seulement)

```bash
cp .env.example .env
chmod 600 .env
sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$(openssl rand -hex 32)|" .env
sed -i "s|^MINE_APP_PASSWORD=.*|MINE_APP_PASSWORD=$(openssl rand -hex 32)|" .env
nano .env                                  # coller GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET, puis Ctrl+O, Ctrl+X
grep -c '^[A-Z_]*=.\+' .env                # doit afficher 6 (7 avec un modérateur)
```

Les mots de passe sont générés sur le Pi et n'en sortent jamais. Ne recopier aucune ligne de `.env` dans un message ni dans git.

## Étape 7 · Construire et lancer

```bash
docker compose build                       # la première fois, télécharge Ubuntu et Java : c'est long
docker compose up -d
docker compose ps
```

`db` puis `backend` passent à `healthy` (compter une à deux minutes pour Spring Boot sur le Pi). En cas de souci : `docker compose logs backend`.

## Étape 8 · Dans Nginx Proxy Manager

*Hosts → Proxy Hosts → Add Proxy Host* :

| Champ | Valeur |
|---|---|
| Domain Names | `api.bouncylab.ovh` |
| Scheme | `http` |
| Forward Hostname / IP | `mine-api` |
| Forward Port | `8080` |
| Block Common Exploits | coché |
| SSL | nouveau certificat Let's Encrypt, **Force SSL**, **HTTP/2**, **HSTS** cochés |

Vérification depuis n'importe où : `https://api.bouncylab.ovh/actuator/health` répond `{"status":"UP"}`.

## Serveur de test (staging)

Un second serveur, avec **sa propre base**, sert le site de test `https://staging.mine.bouncylab.ovh` : les essais ne touchent jamais les vrais comptes, le classement ni la discussion. Même archive, même `docker-compose.yml`, dans un autre dossier avec un autre `.env`.

> ⚠️ **Toujours avec une archive à jour.** Une archive d'avant le 19/10/2026 ne connaît pas `MINE_STACK` : lancée dans le dossier de test, elle recrée le serveur **de production** avec le `.env` de test, et le vrai jeu tombe en panne (c'est arrivé le 19/10). Avant tout `docker compose up` dans `~/mine-explorer-api-staging`, vérifier :
> ```bash
> grep -c MINE_STACK docker-compose.yml                    # 3 ou plus, sinon refaire l'archive sur le PC
> grep -c '^MINE_STACK=mine-explorer-staging' .env         # exactement 1
> ```
> Après le lancement, les conteneurs doivent s'appeler `mine-explorer-staging-…`. S'ils s'appellent `mine-explorer-…`, revenir aussitôt à la production : `cd ~/mine-explorer-api && docker compose up -d`.

### Une seule fois

1. **DNS chez OVH**, zone `bouncylab.ovh` : un enregistrement `A` (ou `CNAME`, comme pour `api`) **`api-staging`** vers ta box, identique à celui de `api`.
2. **Sur le Pi** : déballer l'archive dans un second dossier et créer son `.env` (étape 6), puis y **décommenter les lignes du serveur de test** :
   ```bash
   mkdir -p ~/mine-explorer-api-staging
   tar -xzf ~/mine-explorer-api.tar.gz -C ~/mine-explorer-api-staging
   cd ~/mine-explorer-api-staging
   cp .env.example .env && chmod 600 .env
   sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$(openssl rand -hex 32)|" .env
   sed -i "s|^MINE_APP_PASSWORD=.*|MINE_APP_PASSWORD=$(openssl rand -hex 32)|" .env
   sed -i 's|^# MINE_|MINE_|' .env
   grep -c '^MINE_STACK=mine-explorer-staging' .env   # doit afficher 1 avant d'aller plus loin
   nano .env        # coller GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET (les mêmes qu'en production)
   docker compose up -d --build
   ```
   `MINE_STACK=mine-explorer-staging` donne au serveur de test ses propres conteneurs et sa propre base ; `MINE_API_ALIAS=mine-api-staging` son nom sur le réseau `proxy`.
3. **Nginx Proxy Manager** : un Proxy Host `api-staging.bouncylab.ovh` vers `mine-api-staging`, port `8080`, avec les mêmes réglages SSL que `api`.
4. **Console Google**, client OAuth : ajouter l'URI de redirection `https://api-staging.bouncylab.ovh/login/oauth2/code/google`.

Vérification : `https://api-staging.bouncylab.ovh/actuator/health` répond `{"status":"UP"}`.

### Outils de test

Le site de test a un bouton **Version de test · 🛠 Outils** (en haut) pour se donner de l'or, des éclats, des minerais, des ressources du Cœur, aller à une zone, choisir une forme ou un niveau de pioche, tout débloquer ou repartir de zéro. Pour que le serveur de test accepte ces parties « trichées » sans les refuser, son `.env` contient `MINE_ANTICHEAT_SPEEDFACTOR=1000` (anti-triche presque coupé). Sur un serveur de test installé avant cette ligne, l'ajouter puis relancer :
```bash
cd ~/mine-explorer-api-staging
echo 'MINE_ANTICHEAT_SPEEDFACTOR=1000' >> .env
docker compose up -d
```
**Jamais dans le `.env` de production.**

### Mettre à jour le serveur de test

Comme la production, mais dans `~/mine-explorer-api-staging`. Une archive préparée depuis la branche `staging` (`git switch staging` avant `preparer.ps1`) teste un changement du serveur avant de l'envoyer en production.

## Devenir modérateur de la discussion

1. Dans le jeu, Profil → Compte → Gérer mon compte → **Télécharger mes données** : le fichier commence par ton `id` (par exemple `3f2a…-…`).
2. Sur le Pi, dans `~/mine-explorer-api/.env`, mets-le après `MINE_MODERATORS=`, puis `docker compose up -d`.
3. Dans la Discussion, chaque message des autres a alors 🗑️ (retirer le message) et 🔇 (couper son auteur, qui ne peut plus écrire, et retirer tous ses messages).

## Mettre à jour

Refaire les étapes 1, 3, 4 et 5, puis :

```bash
cd ~/mine-explorer-api
docker compose up -d --build
```

Le `.env` et les données de la base sont conservés. Les migrations de la base passent seules au démarrage (Flyway).

## Arrêter

```bash
docker compose down        # arrête tout, garde les données
```

Ne **pas** utiliser `docker compose down -v` : le `-v` efface le volume de la base, donc tous les comptes et sauvegardes.

## Limites connues

- La limite de requêtes vit en mémoire : un seul conteneur `backend`, ne pas le multiplier.
- Images construites sur le Pi : si Docker répond « no matching manifest », relancer avec `DOCKER_DEFAULT_PLATFORM=linux/arm/v7` devant (`DOCKER_DEFAULT_PLATFORM=linux/arm/v7 docker compose build`).
- Raspberry Pi OS n'active pas le cgroup mémoire : Docker ignore `mem_limit` (« Limitation discarded »). Le tas de la JVM est donc fixé à 512 Mo (`-Xmx512m` dans `docker-compose.yml`). Pour que `mem_limit` s'applique aussi, ajouter `cgroup_enable=memory` à la fin de la ligne de `/boot/firmware/cmdline.txt` puis redémarrer le Pi [PROBABLE : chemin des versions récentes de Raspberry Pi OS].
