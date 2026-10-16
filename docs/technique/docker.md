# Docker

Demande de Théo, 16/10/2026 : un docker compose à la racine du dépôt, pour lancer tout le projet en une commande.

## Lancer en local

```bash
cp .env.example .env
docker compose up --build
```

- Le jeu : http://localhost:8080
- Le serveur Spring Boot : http://localhost:8081

`docker-compose.override.yml`, chargé tout seul par `docker compose`, publie les ports sur la machine. `.env` est facultatif (ports par défaut) et ignoré par git. Pour arrêter : `docker compose down`.

## Déployer sur Coolify

Le `docker-compose.yml` suit les conventions de Coolify (demande de Théo, 16/10/2026) :

- **`expose` au lieu de `ports`** : rien n'est publié sur le serveur, c'est le proxy de Coolify qui reçoit le trafic.
- **Pas de `container_name` ni de nom de projet** : Coolify nomme et préfixe lui-même ses conteneurs.
- **Domaine du jeu** : la variable magique `SERVICE_FQDN_FRONTEND_8080` demande à Coolify un domaine pour le service `frontend` et route vers son port 8080. On peut aussi saisir son propre domaine dans Coolify, en précisant le port : `https://jeu.exemple.fr:8080`.
- **Serveur interne** : `backend` n'a pas de domaine public, le jeu le joint sous `backend:8080` sur le réseau de la ressource.
- **Santé** : le jeu a un healthcheck (`wget` sur sa page d'accueil), que Coolify suit.
- **Override ignoré** : Coolify ne lit que `docker-compose.yml`, donc les ports locaux de l'override ne partent pas en ligne.

Dans Coolify : nouvelle ressource « Docker Compose » depuis le dépôt GitHub, fichier `docker-compose.yml` à la racine, puis déployer. HTTPS et HSTS sont gérés par le proxy de Coolify.

## Ce que contient le compose

| Service | Image | Rôle |
|---|---|---|
| `frontend` | `frontend/Dockerfile` | build Angular (Node 24, comme la CI), puis nginx sans root (`nginx-unprivileged`) qui sert le jeu sur le port 8080 |
| `backend` | `backend/Dockerfile` | build Maven (Java 21, comme la CI), puis le jar sur un JRE, sous un utilisateur sans droits |

**Sécurité** : les deux conteneurs tournent sans root, en lecture seule (sauf `/tmp`), sans capacité Linux et sans élévation de privilèges. nginx reprend les en-têtes de `public/_headers` (CSP stricte), sauf HSTS et `upgrade-insecure-requests`, qui casseraient un service en HTTP sur localhost. Aucun secret : le serveur n'a encore ni base ni compte.

## Pas de base de données pour l'instant

Le serveur n'expose encore aucune route et tourne sur H2 en mémoire : le jeu vit dans le navigateur. Ajouter PostgreSQL demandera le pilote dans le `pom.xml` (une nouvelle dépendance), une migration Flyway, et des identifiants dans `.env` : à faire quand le serveur gardera les parties.

## Vérifié par la CI

Le job « Docker (images et démarrage) » construit les deux images à chaque PR, démarre le compose, vérifie que le jeu répond et que le serveur démarre, puis arrête tout. La fusion automatique l'attend.
