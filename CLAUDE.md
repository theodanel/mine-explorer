# Mine Explorer : repères pour Claude

Ce fichier est chargé à chaque requête : il reste court. N'ouvre que les fichiers utiles à la tâche, pas d'exploration
large du dépôt, pas de relecture de docs/ sans besoin précis.

## Carte

- `frontend/` : Angular 21 (signals, composants standalone) + PixiJS.
  - `src/app/balance/` : tous les chiffres d'équilibrage (`balance.ts`, `rebirth.ts`, `astre.ts`…), fichiers purs.
  - `src/app/<système>/` : un dossier par système (mining, progression, equipment, heart-forge, rebirth, online…).
    Règles pures dans `*-rules.ts` (testées), service Angular à côté, page dans `*-page/`.
  - `src/app/mine-scene/` : scène PixiJS de la mine (`mine-scene.ts`, effets, rocher, Astre).
  - `src/app/patch-notes/patch-notes-data.ts` : fenêtre « Quoi de neuf ? » (une entrée par mise en prod).
  - `tools/simulate.mts` : simulateur d'équilibrage (garder ses règles alignées sur le jeu).
- `backend/` : Spring Boot (Java 21), PostgreSQL, migrations Flyway dans `src/main/resources/db/migration`.
- `deploiement/raspberry-pi/` : script `preparer.ps1` et compose du serveur sur le Pi.
- `docs/game-design/` : une fiche par système ; `docs/technique/` : architecture, CI, déploiement.
- `art-source/` : sources et scripts de découpage des visuels.

## Commandes (depuis `frontend/`)

- Tests : `npx ng test --watch=false` · Lint : `npm run lint` · Build : `npx ng build`
- Audit (bloque la CI au niveau haut) : `npm audit --audit-level=high`
- Simulateur : `node --import ./tools/register-ts.mjs tools/simulate.mts regulier 80` (rester ≤ 80 jours, c'est lent)
- Back (depuis `backend/`) : `./mvnw -q -B test`

## Branches et PR

- `staging` = site de test, `main` = prod.
- Une PR vers `staging` se fusionne seule quand la CI passe (sauf étiquette `pas-de-fusion-auto`).
- Vers `main` : seulement sur le « ok » écrit de Théo. Toute mise en prod visible ajoute une entrée « Quoi de neuf ? ».
- Un changement du back demande de mettre à jour le serveur du Pi : donner les commandes à Théo, avec la
  vérification `grep -c MINE_STACK docker-compose.yml` (3 ou plus) avant `docker compose up -d --build`.

## Conventions

- Tout en français : code commenté (le pourquoi), commits `type(portée): message`, textes du jeu.
- Typage strict, pas de nombre magique : les constantes de jeu vont dans `balance/`.
- Un changement de règle s'accompagne d'un test dans le `*.spec.ts` voisin.
- Grands nombres affichés : `compactNumber` (`shared/format-number.ts`), jamais un `Intl` local.
- Ne jamais lire ni afficher un `.env` (PC ou Pi), ni écrire de secret dans le dépôt.
