# Image du jeu : build Angular, puis service des fichiers statiques par nginx, sans root.
# Construite par le docker-compose.yml à la racine du dépôt.

# ─── Build ──────────────────────────────────────────────────────────────────
# Même version de Node que la CI (.github/workflows/ci.yml)
FROM node:24-alpine AS build
WORKDIR /app
# Dépendances d'abord : la couche reste en cache tant que package-lock.json ne change pas
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

# ─── Service ────────────────────────────────────────────────────────────────
# nginx-unprivileged tourne sous un utilisateur sans droits, sur le port 8080
FROM nginxinc/nginx-unprivileged:1.29-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
EXPOSE 8080
