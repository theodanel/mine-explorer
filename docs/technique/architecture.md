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

Domaines : progression (zones et filons, gardien chronométré de fin de zone, carte des zones et retour dans une zone passée), minage, mineur (calcul des stats), équipement et forge, évolution, compétences et sorts, artefacts, Atelier, événements de mine, galeries, compagnons et Défi de la mine, Campement, Puits sans fond, Chasse au filon, Forge express, Expédition aux flambeaux et Marchand nain (onglet Aventures), loterie du jour, missions, absence, son, navigation et superposition des fenêtres.

### Principes

- **Angular sans zone.js** : l'affichage suit des `signal`/`computed`. Composants autonomes (*standalone*), contrôle de flux `@if`/`@for`/`@switch`, injection par `inject()`.
- **Hasard et temps injectés** (`RANDOM`, `CLOCK`, `ID_FACTORY`) : les tests figent les tirages et l'heure.
- **Scène PixiJS isolée** dans `mine-scene/` : le reste de l'interface est en HTML/CSS. Le rocher frappé (`mine-scene/mine-rock.ts`, une image par zone dans `public/assets/rocks/zone1.webp` à `zone10.webp`) se cale sous la pioche de la forme affichée ; sa barre de vie est un élément HTML placé en pourcentage de la scène, qui le suit sur tous les écrans. Une image absente n'empêche rien : seule la barre s'affiche. PixiJS est chargé dans sa variante sans `eval` (`pixi.js/unsafe-eval`), compatible avec la CSP du site.
- **Pages et fenêtres secondaires chargées à la demande** (`@defer`) pour tenir le budget du chargement initial (1,2 Mo bruts, environ 285 Ko compressés).
- **Prise en main** (`onboarding/`) : remplace l'ancien tutoriel en texte. `reveal-rules.ts` (pur) décide quand présenter chaque élément d'après les compteurs de missions, la forge et les menus ouverts. Les éléments du panneau du bas sont visibles dès le début mais grisés et `inert` (`.locked-ui`) jusqu'à leur présentation ; `RevealHint` entoure l'élément marqué `data-reveal` (directive `appReveal`) d'un cadre pulsant avec une bulle d'une ligne, sans bloquer le jeu. Les onglets du menu du bas restent grisés tant que leur menu est fermé et surgissent à son ouverture (`.reveal-pop`). Ce qui est présenté est gardé dans `mine-explorer.devoilement` ; une partie déjà avancée ne voit aucune bulle. Voir `docs/game-design/devoilement-progressif.md`.
- **Habillage partagé** (`styles.scss`) : thèmes de page (`data-theme` sur `.game-panel`, bandeau de titre en bois teinté souligné d'un filet de couleur), cadres de qualité des objets (`.item-frame` avec `data-tier`, couleurs `--frame-light` et `--frame-dark` tirées de la couleur du matériau `--tier-color`, reflet en boucle à partir du mithril), libellé cerné (`.frame-label`), rayons tournants derrière une récompense (`.rays`, sur un conteneur de l'image) et micro-animations (`.breathe`, `.halo`, `.bounce`, `.counter-bump`). Les animations ne touchent que `transform` et `opacity`, et toutes les boucles s'arrêtent avec `prefers-reduced-motion`.
- **Gains qui s'envolent** (`reward-flight/`) : la directive `appRewardFlight` sur un bouton de récompense mesure les pièces et éclats gagnés (soldes avant l'appui, après le clic) ou prend les gains donnés en `rewardGains` ; la couche `app-reward-flight-layer`, au-dessus des fenêtres, fait voler de 3 à 8 icônes jusqu'à l'élément `data-flight-target` du compteur, qui sursaute. Avec `prefers-reduced-motion`, seul le compteur réagit.
- **Barre de menus** (`navigation/footer-menu/`) : pas d'onglet « Mine ». Toucher l'onglet allumé ramène à la mine ; une sous-page (Campement, Puits, Chasse, Forge express et Expédition dans les Aventures, Défi dans les Compagnons) garde l'onglet de sa page allumé.
- **Superposition des fenêtres** centralisée dans `shared/overlays.ts` : une seule fenêtre automatique à la fois, jamais par-dessus une page ou une fenêtre ouverte par le joueur. Profondeurs (`z-index`) définies une fois dans `styles.scss`.

### État et sauvegarde

L'état de la partie est réparti entre services et sauvegardé dans le `localStorage`, une clé par domaine (`mine-explorer.progress`, `mine-explorer.coins`, `mine-explorer.companions`…). Chaque chargement :

1. lit la clé via `shared/local-storage.ts` (qui ne lève jamais d'erreur, même stockage bloqué) ;
2. migre les anciens formats si besoin (par exemple `completeCounters` pour un compteur ajouté, `migrateCompanionState` pour les niveaux de compagnon remboursés en pierres) ;
3. valide la forme et les bornes de chaque champ (`isValid…`) ;
4. repart d'un état neuf si la valeur est illisible ou hors limites, avec un avertissement en console.

Le test `shared/save-robustness.spec.ts` charge chaque clé avec des valeurs abîmées ou trafiquées et vérifie que la partie reste jouable.

### Son

Aucun fichier audio : les 12 bruitages (`audio/synth.ts`) et les 20 musiques de zone (`audio/zone-music.ts`) sont calculés par le code, échantillon par échantillon, au premier toucher du joueur (exigence des navigateurs mobiles pour autoriser le son). Chaque zone a sa boucle d'ambiance (gamme, accords, tempo, instruments, percussion : voir [[musiques-des-zones]]), calculée la première fois qu'on y entre (une table de sinus garde le calcul court), gardée en cache, et qui prend le relais en fondu de 2 secondes quand la zone affichée change, retour en zone passée compris. Le service `audio/sound.ts` joue le tout avec Web Audio, sur deux volumes séparés (bruitages, musique) réglables dans Profil, et coupe tout quand l'onglet est caché. Pour écouter les sons hors du jeu : `node --import ./tools/register-ts.mjs tools/export-sounds.mts <dossier>` écrit `bruitages.wav` et une `musique-zone-NN.wav` par zone.

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
