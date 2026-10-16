# Docker

Demande de Théo, 16/10/2026 : un docker compose à la racine du dépôt, pour lancer tout le projet en une commande.

## Lancer

```bash
cp .env.example .env
docker compose up --build
```

- Le jeu : http://localhost:8080
- Le serveur Spring Boot : http://localhost:8081

`.env` est facultatif (ports par défaut), et ignoré par git. Pour arrêter : `docker compose down`.

## Ce que contient le compose

| Service | Image | Rôle |
|---|---|---|
| `frontend` | `frontend/Dockerfile` | build Angular (Node 24, comme la CI), puis nginx sans root (`nginx-unprivileged`) qui sert le jeu sur le port 8080 |
| `backend` | `backend/Dockerfile` | build Maven (Java 21, comme la CI), puis le jar sur un JRE, sous un utilisateur sans droits |

**Sécurité** : les deux conteneurs tournent sans root, en lecture seule (sauf `/tmp`), sans capacité Linux et sans élévation de privilèges. nginx reprend les en-têtes de `public/_headers` (CSP stricte), sauf HSTS et `upgrade-insecure-requests`, qui casseraient un service en HTTP sur localhost. Aucun secret : le serveur n'a encore ni base ni compte.

## Pas de base de données pour l'instant

Le serveur n'expose encore aucune route et tourne sur H2 en mémoire : le jeu vit dans le navigateur. Ajouter PostgreSQL demandera le pilote dans le `pom.xml` (une nouvelle dépendance), une migration Flyway, et des identifiants dans `.env` : à faire quand le serveur gardera les parties.
