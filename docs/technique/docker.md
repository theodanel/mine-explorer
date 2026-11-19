# Docker

Demande de Théo, 16/10/2026 : un docker compose à la racine du dépôt, pour lancer tout le projet en une commande.

## Lancer en local

```bash
cp .env.example .env
docker compose up --build
```

- Le jeu : http://localhost:8080

`docker-compose.override.yml`, chargé tout seul par `docker compose`, publie les ports sur la machine. `.env` est facultatif (ports par défaut) et ignoré par git. Pour arrêter : `docker compose down`.

## Déployer le jeu sur Coolify (facultatif)

Le jeu en ligne est servi par Cloudflare Pages (voir [[deploiement]]). Le `docker-compose.yml` reste prêt pour Coolify, où un ami de Théo le sert aussi ; il suit ses conventions (16/10/2026) :

- **`expose` au lieu de `ports`** : rien n'est publié sur le serveur, c'est le proxy de Coolify qui reçoit le trafic.
- **Pas de `container_name` ni de nom de projet** : Coolify nomme et préfixe lui-même ses conteneurs.
- **Domaine du jeu** : la variable magique `SERVICE_FQDN_FRONTEND_8080` demande à Coolify un domaine pour le service `frontend` et route vers son port 8080. On peut aussi saisir son propre domaine dans Coolify, en précisant le port : `https://jeu.exemple.fr:8080`.
- **Santé** : le jeu a un healthcheck (`wget` sur sa page d'accueil), que Coolify suit.
- **Override ignoré** : Coolify ne lit que `docker-compose.yml`, donc les ports locaux de l'override ne partent pas en ligne.

Dans Coolify : nouvelle ressource « Docker Compose » depuis le dépôt GitHub, fichier `docker-compose.yml` à la racine, puis déployer. HTTPS et HSTS sont gérés par le proxy de Coolify.

## Ce que contient le compose

| Service | Image | Rôle |
|---|---|---|
| `frontend` | `frontend/Dockerfile` | build Angular (Node 24, comme la CI), puis nginx sans root (`nginx-unprivileged`) qui sert le jeu sur le port 8080 |

**Sécurité** : le conteneur tourne sans root, en lecture seule (sauf `/tmp`), sans capacité Linux et sans élévation de privilèges. nginx reprend les en-têtes de `public/_headers` (CSP stricte), sauf HSTS et `upgrade-insecure-requests`, qui casseraient un service en HTTP sur localhost.

## Le serveur et sa base

Ils ne sont plus dans ce compose : ils tournent sur le Raspberry Pi de Théo avec PostgreSQL, voir [`deploiement/raspberry-pi`](../../deploiement/raspberry-pi/LISEZMOI.md).

## Vérifié par la CI

Le job « Docker (images et démarrage) » construit l'image du jeu à chaque PR, démarre le compose et vérifie que le jeu répond ; il démarre aussi le compose du Raspberry Pi en amd64 (serveur en profil prod, PostgreSQL, compte limité) et vérifie que le serveur démarre et que le compte de l'appli ne peut pas créer de table. La fusion automatique l'attend.
