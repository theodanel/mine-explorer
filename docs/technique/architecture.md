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
- **Scène PixiJS isolée** dans `mine-scene/` : le reste de l'interface est en HTML/CSS. Le rocher frappé (`mine-scene/mine-rock.ts`, une image par zone dans `public/assets/rocks/zone1.webp` à `zone10.webp`) se cale sous la pioche de la forme affichée ; sa barre de vie est un élément HTML placé en pourcentage de la scène, qui le suit sur tous les écrans. Une image absente n'empêche rien : seule la barre s'affiche. PixiJS est chargé dans sa variante sans `eval` (`pixi.js/unsafe-eval`), compatible avec la CSP du site.
- **Pages et fenêtres secondaires chargées à la demande** (`@defer`) pour tenir le budget de 1 Mo du chargement initial.
- **Tutoriel du premier lancement** (`tutorial/`) : 4 étapes (filon, forge, pioche, missions) sur une partie neuve seulement (zone 1, filon 1). L'écran est flouté sauf un cercle autour de l'élément marqué `data-tuto="…"` ; la forge doit être touchée pour de vrai, les autres étapes avancent d'un toucher. Il ne s'affiche que sur la mine sans fenêtre ouverte, attend les premiers éclats pour la forge, et ne revient plus une fois fini ou passé (`mine-explorer.tutorial`).
- **Superposition des fenêtres** centralisée dans `shared/overlays.ts` : une seule fenêtre automatique à la fois, jamais par-dessus une page ou une fenêtre ouverte par le joueur. Profondeurs (`z-index`) définies une fois dans `styles.scss`.

### État et sauvegarde

L'état de la partie est réparti entre services et sauvegardé dans le `localStorage`, une clé par domaine (`mine-explorer.progress`, `mine-explorer.coins`, `mine-explorer.companions`…). Chaque chargement :

1. lit la clé via `shared/local-storage.ts` (qui ne lève jamais d'erreur, même stockage bloqué) ;
2. migre les anciens formats si besoin (par exemple `completeCounters` pour un compteur ajouté, `migrateCompanionState` pour les niveaux de compagnon remboursés en pierres) ;
3. valide la forme et les bornes de chaque champ (`isValid…`) ;
4. repart d'un état neuf si la valeur est illisible ou hors limites, avec un avertissement en console.

Le test `shared/save-robustness.spec.ts` charge chaque clé avec des valeurs abîmées ou trafiquées et vérifie que la partie reste jouable.

### Son

Aucun fichier audio : les 12 bruitages et la musique d'ambiance sont calculés par le code (`audio/synth.ts`), échantillon par échantillon, au premier toucher du joueur (exigence des navigateurs mobiles pour autoriser le son). Le calcul prend quelques millisecondes ; la musique, une boucle de 32 secondes en la mineur, est calculée juste après pour ne pas ralentir ce premier toucher. Le service `audio/sound.ts` joue le tout avec Web Audio, sur deux volumes séparés (bruitages, musique) réglables dans Profil, et coupe tout quand l'onglet est caché. Pour écouter les sons hors du jeu : `node --import ./tools/register-ts.mjs tools/export-sounds.mts <dossier>` écrit `bruitages.wav` et `musique.wav`.

Raison : pas de licence à suivre, pas de téléchargement, aucun poids ajouté au site, et rien à autoriser de plus dans la CSP. Des fichiers enregistrés (par exemple les packs CC0 de Kenney) pourront remplacer un son plus tard si le rendu synthétique ne suffit pas.

### Mises à jour et sauvegardes

La sauvegarde vit dans le `localStorage` du navigateur, propre à chaque adresse : une partie commencée sur `mine.bouncylab.ovh` n'existe pas sur `mine-explorer.pages.dev`, et inversement. Une nouvelle version publiée sur la même adresse reprend la partie en cours ; chaque changement de format ou d'équilibrage qui pourrait invalider une sauvegarde doit avoir sa migration et son test (exemple : `migrateProgress` ramène les dégâts du filon en cours sous ses nouveaux PV au lieu de rejeter la partie). Le jeu n'a pas de service worker : le joueur reçoit la nouvelle version au prochain chargement de la page, les fichiers JavaScript ayant un nom qui change à chaque build.

### Outils

| Outil | Usage |
|---|---|
| `tools/simulate.mts` | Joue l'économie avec les vraies règles sur 90 jours (profils régulier, assidu, continu). Sert à régler `balance/`. |
| `tools/balance-tables.mts` | Recalcule les tableaux de `docs/game-design/equilibrage.md`. |
| `tools/export-sounds.mts` | Exporte bruitages et musique en WAV pour les écouter. |
| `tools/serve-dist.mjs` | Sert le build de production avec les en-têtes de `public/_headers`, pour vérifier la CSP en local. |

## Backend

Squelette Spring Boot 4.1 (Web MVC, Data JPA, Validation, Flyway, H2). Aucune route métier : seules les réponses d'erreur par défaut existent, sans trace interne (voir [[securite]]). Il n'est ni déployé ni appelé par le frontend. Sa place à terme : calculer les gains et valider les actions côté serveur, pour qu'un joueur ne puisse plus tricher en modifiant sa sauvegarde.
