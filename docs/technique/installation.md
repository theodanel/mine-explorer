# Installation et commandes

Retour à [[documentation-technique]].

## Prérequis

| Outil | Version | Pour |
|---|---|---|
| Node.js | 24 (npm 11) | Frontend |
| JDK | 21 ou plus | Backend (le wrapper Maven est inclus) |
| Git | récent | Dépôt |

## Frontend

```bash
cd frontend
npm ci            # installe exactement les versions du package-lock.json
npm start         # serveur de développement sur http://localhost:4200
```

| Commande | Effet |
|---|---|
| `npm run lint` | ESLint (TypeScript, Angular, accessibilité des gabarits) |
| `npm run test:ci` | Tests unitaires une fois (Vitest) |
| `npx ng test --watch=false --coverage` | Tests et rapport de couverture dans `coverage/` |
| `npm run build` | Build de production dans `dist/frontend/browser/` |
| `node tools/serve-dist.mjs 4370` | Sert le build avec les en-têtes de sécurité, sur http://localhost:4370 |
| `node --import ./tools/register-ts.mjs tools/simulate.mts regulier 90` | Simulation de l'économie (voir [[tests]]) |

Pour tester sur téléphone dans le même réseau : `npx ng serve --host 0.0.0.0`, puis l'adresse IP du PC sur le port 4200.

## Backend

```bash
cd backend
./mvnw spring-boot:run    # http://localhost:8080 (Windows : .\mvnw.cmd)
./mvnw verify             # build et tests
```

## Réinitialiser une partie

Le jeu sauvegarde dans le navigateur : vider les données du site (outils de développement, onglet Application, Stockage local) remet la partie à zéro.
