# Architecture

Retour à [[documentation-technique]].

## Vue d'ensemble

```
mine-explorer/
├── frontend/          Jeu Angular 21 + PixiJS 8 (tout le jeu tourne ici)
│   ├── src/app/       Code applicatif, un dossier par domaine
│   ├── public/        Fichiers servis tels quels (images, sons, _headers)
│   └── tools/         Outils en ligne de commande (simulateur, tableaux, serveur de vérification)
├── backend/           Spring Boot 4.1, Java 21 (squelette, non déployé)
├── art-source/        Visuels d'origine (Gemini) avant découpe
├── docs/              Coffre Obsidian : game-design/ et technique/
└── .github/           CI/CD, CodeQL, Dependabot
```

Le jeu est une **application monopage statique** : HTML, JavaScript et images servis par un CDN, aucune donnée envoyée à un serveur.

## Frontend

### Découpage

Chaque dossier de `src/app/` couvre un domaine du jeu et suit le même schéma :

| Fichier | Rôle |
|---|---|
| `balance/*.ts` | Tous les chiffres d'équilibrage, sans dépendance Angular. Source de vérité de l'économie. |
| `*-rules.ts` | Règles pures (fonctions sans effet de bord) : testables seules, rejouées par le simulateur, portables en Java. |
| Service (`*.ts`, `@Injectable`) | État du domaine en signaux Angular, lecture et écriture de la sauvegarde, appel des règles. |
| Composants (`*-page`, `*-dialog`…) | Affichage et interactions, sans logique de jeu. |

Domaines : progression (zones et filons), minage, mineur (calcul des stats), équipement et forge, évolution, compétences et sorts, artefacts, Atelier, événements de mine, galeries, compagnons et Défi de la mine, missions, absence, son, navigation et superposition des fenêtres.

### Principes

- **Angular sans zone.js** : l'affichage suit des `signal`/`computed`. Composants autonomes (*standalone*), contrôle de flux `@if`/`@for`/`@switch`, injection par `inject()`.
- **Hasard et temps injectés** (`RANDOM`, `CLOCK`, `ID_FACTORY`) : les tests figent les tirages et l'heure.
- **Scène PixiJS isolée** dans `mine-scene/` : le reste de l'interface est en HTML/CSS. PixiJS est chargé dans sa variante sans `eval` (`pixi.js/unsafe-eval`), compatible avec la CSP du site.
- **Pages et fenêtres secondaires chargées à la demande** (`@defer`) pour tenir le budget de 1 Mo du chargement initial.
- **Superposition des fenêtres** centralisée dans `shared/overlays.ts` : une seule fenêtre automatique à la fois, jamais par-dessus une page ou une fenêtre ouverte par le joueur. Profondeurs (`z-index`) définies une fois dans `styles.scss`.

### État et sauvegarde

L'état de la partie est réparti entre services et sauvegardé dans le `localStorage`, une clé par domaine (`mine-explorer.progress`, `mine-explorer.coins`, `mine-explorer.companions`…). Chaque chargement :

1. lit la clé via `shared/local-storage.ts` (qui ne lève jamais d'erreur, même stockage bloqué) ;
2. migre les anciens formats si besoin (par exemple `completeCounters` pour un compteur ajouté, `migrateCompanionState` pour les niveaux de compagnon remboursés en pierres) ;
3. valide la forme et les bornes de chaque champ (`isValid…`) ;
4. repart d'un état neuf si la valeur est illisible ou hors limites, avec un avertissement en console.

Le test `shared/save-robustness.spec.ts` charge chaque clé avec des valeurs abîmées ou trafiquées et vérifie que la partie reste jouable.

### Outils

| Outil | Usage |
|---|---|
| `tools/simulate.mts` | Joue l'économie avec les vraies règles sur 90 jours (profils régulier, assidu, continu). Sert à régler `balance/`. |
| `tools/balance-tables.mts` | Recalcule les tableaux de `docs/game-design/equilibrage.md`. |
| `tools/serve-dist.mjs` | Sert le build de production avec les en-têtes de `public/_headers`, pour vérifier la CSP en local. |

## Backend

Squelette Spring Boot 4.1 (Web MVC, Data JPA, Validation, Flyway, H2). Aucune route métier : seules les réponses d'erreur par défaut existent, sans trace interne (voir [[securite]]). Il n'est ni déployé ni appelé par le frontend. Sa place à terme : calculer les gains et valider les actions côté serveur, pour qu'un joueur ne puisse plus tricher en modifiant sa sauvegarde.
