# Mine Explorer

RPG idle de minage pour mobile. Monorepo : client Angular (le jeu) et serveur Spring Boot (squelette, pas encore déployé).

| Dossier | Contenu | Prérequis |
|---|---|---|
| `frontend/` | Angular 21, PixiJS 8, Vitest | Node 24 |
| `backend/` | Spring Boot 4.1, Java 21, Maven (wrapper inclus) | JDK 21+ |
| `docs/` | Coffre Obsidian : game design et documentation technique | Obsidian (facultatif) |

## Lancer en local

```bash
cd frontend
npm ci
npm start                 # http://localhost:4200
```

Backend (facultatif, aucune route pour l'instant) : `cd backend && ./mvnw spring-boot:run`.

## Vérifier

```bash
cd frontend
npm run lint
npx ng test --watch=false --coverage
npm run build
npm audit --audit-level=high
```

```bash
cd backend
./mvnw verify
```

## CI/CD

Chaque pull request et chaque push sur `main` passent lint, tests, build et audit des dépendances (GitHub Actions). Un push sur `main` vert déploie le jeu sur Cloudflare Pages. CodeQL et Dependabot surveillent le code et les dépendances.

## Documentation

- Technique : [docs/technique/documentation-technique.md](docs/technique/documentation-technique.md) (architecture, tests, CI/CD, déploiement, sécurité).
- Game design : [docs/Accueil.md](docs/Accueil.md).
