# Mine Explorer : guide de démarrage technique

Pour : Théo · Rédigé le 11/10/2026 · Base : [[GDD_Mine_Explorer]], [[GDD_points_a_trancher]], [[faisabilite]], et les guides Gamearly GDD, TDD et roadmap (section 6)

Décisions déjà prises (dans la note de faisabilité) et reprises ici : serveur autoritaire Spring Boot 4.1, client Angular 22 pour le MVP, scène animée en canvas (PixiJS) plus tard, PostgreSQL + Flyway.

---

## 0. L'idée qui débloque tout

Un RPG idle n'est pas un jeu d'action. C'est **un tableur avec une horloge et une jolie vitrine** :

| Couche | Ce que c'est dans Mine Explorer | Où ça vit |
|---|---|---|
| **Données** | Couches, matériaux, objets, raretés, courbes de résistance | Fichiers versionnés (YAML/JSON) côté serveur |
| **Règles** | Formules : dégâts de forage, temps pour franchir une couche, tirage du butin, gains hors ligne | Code Java pur, testé en JUnit |
| **État** | Ce que possède le joueur : couche atteinte, inventaire, minerais, horodatage de dernière collecte | PostgreSQL |
| **Présentation** | Le mineur qui creuse, les éclats de roche, les chiffres qui sautent | Angular (menus) + canvas (scène) |

La 2D est la **dernière** couche, et la moins risquée. Si les règles sont justes et testées, tu peux afficher le jeu avec des `<div>` d'abord, puis le rendre beau sans rien casser. C'est l'ordre recommandé.

---

## 1. Relier le game design au code : la méthode

Prends ton GDD et passe-le au crible de quatre questions. Chaque réponse devient un élément de code précis.

| Dans le GDD, cherche… | Ça devient… | Exemple tiré de ton GDD |
|---|---|---|
| Les **noms** (choses qui existent) | Entités et définitions de données | Mineur, couche, zone, matériau, équipement, rareté, guilde |
| Les **verbes** du joueur | Endpoints d'API (des *intentions*) | Équiper, améliorer, fusionner, récupérer les récompenses, lancer un défi |
| Les **nombres** et règles chiffrées | Formules + paramètres de config | « Chaque couche augmente légèrement la résistance » → `resistance(n) = base × croissance^n` |
| Les **boucles** et états | Machine à états, cycle de jeu | Boucle principale : creuser → récolter → butin → comparer → équiper → franchir |

### Ta boucle principale traduite en code

```
GDD (section 3)                  Serveur (Spring)                       Client (Angular)
───────────────                  ────────────────                       ────────────────
1. Creuser                  →    calcul paresseux du forage             animation de forage (cosmétique)
2. Récolter minerais        →    POST /api/mine/collect                 bouton « Récolter », compteur
3. Obtenir de l'équipement  →    tirage du butin (RNG serveur)          popup de butin
4. Comparer les stats       →    (rien : calcul pur côté client OK*)    panneau de comparaison
5. Équiper / améliorer      →    POST /api/inventory/{id}/equip         mise à jour de la Puissance
6. Franchir la couche       →    progression stockée en base            transition vers la couche suivante
```

\* Comparer deux objets ne change rien à l'état : le client peut afficher la différence. Mais la **Puissance officielle** et tout ce qui donne une récompense restent calculés par le serveur.

### Les points de ton GDD qui bloquent le code

Le code force à trancher ce que le texte laisse flou. Trois points de [[GDD_points_a_trancher]] sont **bloquants avant d'écrire les formules** :

1. **Condition d'échec d'une couche** (point 1). Sans elle, il n'y a pas de formule « franchir ou non ». Il te faut une ressource qui s'épuise : temps limite, endurance de la pioche, dangers qui infligent des dégâts. Exemple de défaut simple pour prototyper : *endurance* du mineur, chaque seconde de forage en coûte, l'échec arrive à zéro.
2. **Ce que mesure la Puissance** (point 2). Techniquement, c'est une fonction `puissance(stats) → nombre`. Décide si elle agrège toutes les stats ou seulement les principales.
3. **Effet des stats secondaires sur le forage** (point 5). Chaque stat doit apparaître dans une formule, sinon elle n'existe pas. Précision, par exemple, pourrait réduire la chance de « coup raté » sur les roches dures.

Conseil : avant le code, écris les formules dans ton **TDD** (section 6.2) : pour chaque mécanique, nom, formule, paramètres, valeur de départ. C'est ton contrat entre design et code.

---

## 2. Le cœur : les formules en Java pur

### 2.1 Données statiques : les couches

Ton GDD prévoit des milliers de couches (point 7). Tu ne les écris pas à la main : tu écris **les paramètres d'une zone**, et une formule génère chaque couche.

`src/main/resources/gamedata.yml` (chargé avec `spring.config.import=classpath:gamedata.yml` dans `application.yml`) :

```yaml
gamedata:
  zones:
    - id: 1
      name: "Terre de surface"
      layer-count: 15            # couches 1-1 à 1-15
      base-resistance: 100
      resistance-growth: 1.08    # +8 % par couche
      materials: [terre, argile]
    - id: 2
      name: "Roche"
      layer-count: 15
      base-resistance: 450
      resistance-growth: 1.09
      materials: [granit, fer]
```

```java
@Validated
@ConfigurationProperties(prefix = "gamedata")
public record GameDataProperties(@NotEmpty List<ZoneDefinition> zones) {}

public record ZoneDefinition(
        int id,
        String name,
        @Positive int layerCount,
        @Positive double baseResistance,
        @DecimalMin("1.0") double resistanceGrowth,
        List<String> materials) {}
```

Pourquoi des fichiers et pas la base : l'équilibrage devient un diff relisible dans git, et les tests tournent sans base. C'est le patron **Type Object** (voir Ressources) : un type de couche est une donnée, pas une classe.

### 2.2 Une règle de forage, testée

```java
/** Règles de forage. Aucune dépendance Spring : testable en millisecondes. */
public final class DrillingRules {

    private DrillingRules() {}

    public static double layerResistance(ZoneDefinition zone, int layerIndex) {
        // Croissance exponentielle douce : le joueur sent la difficulté monter
        // sans mur brutal. Le taux est un paramètre d'équilibrage, pas une constante du code.
        return zone.baseResistance() * Math.pow(zone.resistanceGrowth(), layerIndex - 1);
    }

    public static Duration timeToClear(double resistance, double drillPowerPerSecond) {
        if (drillPowerPerSecond <= 0) {
            throw new IllegalArgumentException("drillPowerPerSecond doit être positif");
        }
        long millis = (long) Math.ceil(resistance / drillPowerPerSecond * 1000);
        return Duration.ofMillis(millis);
    }
}
```

```java
class DrillingRulesTest {

    private static final ZoneDefinition SURFACE =
            new ZoneDefinition(1, "Terre", 15, 100, 1.08, List.of("terre"));

    @Test
    void firstLayerHasBaseResistance() {
        assertThat(DrillingRules.layerResistance(SURFACE, 1)).isEqualTo(100.0);
    }

    @Test
    void resistanceGrowsEachLayer() {
        assertThat(DrillingRules.layerResistance(SURFACE, 2))
                .isGreaterThan(DrillingRules.layerResistance(SURFACE, 1));
    }

    @Test
    void rejectsZeroDrillPower() {
        assertThatThrownBy(() -> DrillingRules.timeToClear(100, 0))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
```

Ce que tu peux défendre à l'oral : les règles du jeu sont des **fonctions pures**, isolées du framework. On les teste sans démarrer Spring ni la base, et on peut simuler 1 000 couches d'équilibrage dans un test paramétré.

### 2.3 Les gros nombres : à décider tôt

Avec `1.08^n`, la couche 1 000 a une résistance d'environ 2,5 × 10³⁵. Un `long` Java déborde vers 9,2 × 10¹⁸.

| Type | Plage | Avantage | Inconvénient |
|---|---|---|---|
| `long` | ≤ 9,2 × 10¹⁸ | exact, rapide | trop petit pour des milliers de couches exponentielles |
| `double` | ≤ ~1,8 × 10³⁰⁸ | rapide, simple, colonne `double precision` en SQL | arrondis (sans importance au-delà de 15 chiffres affichés en « 2,3 Qa ») |
| `BigDecimal` | illimitée | exact | lent, verbeux, colonne `numeric` |

Recommandation : **`double` pour résistance, puissance et stats**, et **`long` pour les monnaies tant que ta courbe d'économie le permet**. C'est un choix de schéma de données, coûteux à changer plus tard : à valider avant la première migration Flyway. Les articles Kongregate (Ressources) expliquent pourquoi les jeux idle mélangent croissance exponentielle des coûts et croissance polynomiale de la production.

### 2.4 Progression hors ligne (rappel de la note de faisabilité)

Pas de tâche planifiée qui fait tourner tous les joueurs. À chaque action, le serveur calcule ce qui s'est passé depuis `lastCollectedAt`, plafonné (ex. 8 h), avec **l'heure du serveur** :

```java
@Transactional
public PlayerStateDto collect(UUID playerId) {
    Player player = players.findById(playerId).orElseThrow(PlayerNotFoundException::new);
    Instant now = clock.instant();   // Clock injecté : testable, jamais l'heure du client
    Duration elapsed = Duration.between(player.getLastCollectedAt(), now);
    Duration capped = elapsed.compareTo(OFFLINE_CAP) > 0 ? OFFLINE_CAP : elapsed;

    OfflineResult result = offlineSimulator.simulate(player.snapshot(), capped);
    player.apply(result, now);
    return PlayerStateDto.from(player);
}
```

`offlineSimulator` avance couche par couche avec `timeToClear` jusqu'à épuiser le temps. Le nombre d'itérations est borné par le plafond, donc le coût reste raisonnable.

---

## 3. Le combat... ici, le forage : le serveur simule, le client rejoue

Le forage visible à l'écran (coups de pioche, critiques, éclats) n'est **pas** calculé par Angular. Le serveur renvoie un **journal d'événements** et le client le rejoue :

```json
{
  "layer": "1-7",
  "seed": 81237712,
  "events": [
    { "atMs": 0,    "type": "STRIKE", "amount": 42, "critical": false },
    { "atMs": 600,  "type": "STRIKE", "amount": 97, "critical": true },
    { "atMs": 1200, "type": "ORE_FOUND", "material": "argile", "quantity": 3 },
    { "atMs": 5400, "type": "LAYER_CLEARED" }
  ]
}
```

- Une seule implémentation des règles (Java). Pas de copie TypeScript qui finit par diverger.
- La graine (`seed`) stockée permet de rejouer un bug d'équilibrage à l'identique.
- Le client ne peut pas falsifier l'issue.

Pour le JcJ asynchrone (point 3 à trancher), c'est le même mécanisme : le serveur simule ta configuration contre un instantané de celle de l'adversaire, et renvoie le journal.

---

## 4. Faire la 2D, en trois paliers

Tu n'as pas besoin d'un moteur de jeu pour commencer. Monte d'un palier seulement quand le précédent ne suffit plus.

### Palier 1 : DOM + CSS (MVP)

Ton écran principal (section 7 du GDD) est surtout de l'interface : bandeau de ressources, Puissance, stats, équipement, boutons. C'est du **pur Angular**. Pour la couche au centre : une image de roche, une barre de résistance, des chiffres de dégâts animés en CSS (`@keyframes` qui fait monter et disparaître le nombre). Suffisant pour valider la boucle.

### Palier 2 : comprendre la boucle de jeu (même si PixiJS la gère pour toi)

Toute animation 2D repose sur trois notions :

- **La boucle** : le navigateur appelle ta fonction avant chaque rafraîchissement d'écran (`requestAnimationFrame`, environ 60 fois par seconde).
- **Le delta time** : le temps écoulé depuis l'image précédente. Tu déplaces les choses de `vitesse × delta`, jamais d'une quantité fixe par image, sinon le jeu va deux fois plus vite sur un écran 120 Hz.
- **Mise à jour / rendu séparés** : `update(dt)` change l'état, `render()` le dessine.

```ts
let last = performance.now();
function frame(now: number): void {
  const dtSeconds = (now - last) / 1000;
  last = now;
  update(dtSeconds);  // avance l'animation du mineur, les particules
  render();           // dessine
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
```

Attention : un onglet en arrière-plan ralentit ou suspend la boucle. Dans ton cas ce n'est pas grave, puisque la vraie progression est calculée par le serveur : au retour, tu resynchronises.

### Palier 3 : PixiJS pour la scène animée

PixiJS (version 8 actuellement) est une bibliothèque de rendu 2D WebGL/WebGPU : sprites, animations image par image, particules, texte. Elle ne fait **que** l'affichage, ce qui colle à ton architecture. C'est une nouvelle dépendance : à décider quand le palier 1 tourne.

Concepts PixiJS à apprendre, dans l'ordre :
1. `Application` : crée le canvas et le moteur de rendu.
2. `Assets.load` : charge images et feuilles de sprites.
3. `Sprite` / `AnimatedSprite` : une image / une animation tirée d'une feuille de sprites.
4. `Container` : regroupe des objets (la couche, le mineur, les effets).
5. `Ticker` : la boucle de jeu toute faite, avec le delta time.

**Intégration dans un composant Angular**

```ts
import { Component, DestroyRef, ElementRef, afterNextRender, inject, input, viewChild } from '@angular/core';
import { AnimatedSprite, Application, Assets, Spritesheet } from 'pixi.js';

@Component({
  selector: 'app-mine-scene',
  template: `<div #host class="scene"></div>`,
  styles: `.scene { width: 100%; aspect-ratio: 9 / 10; }`,
})
export class MineSceneComponent {
  private readonly host = viewChild.required<ElementRef<HTMLDivElement>>('host');
  private app: Application | null = null;
  private destroyed = false;

  constructor() {
    // Pixi touche au DOM : on attend que le composant soit rendu dans le navigateur.
    afterNextRender(() => void this.initScene());
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      this.app?.destroy(true, { children: true });
    });
  }

  private async initScene(): Promise<void> {
    const app = new Application();
    await app.init({ resizeTo: this.host().nativeElement, backgroundColor: 0x2b1d14 });
    if (this.destroyed) {            // le composant a pu disparaître pendant l'init asynchrone
      app.destroy(true, { children: true });
      return;
    }
    this.app = app;
    this.host().nativeElement.appendChild(app.canvas);

    const sheet = await Assets.load<Spritesheet>('assets/miner.json');
    const miner = new AnimatedSprite(sheet.animations['dig']);
    miner.anchor.set(0.5);
    miner.position.set(app.screen.width / 2, app.screen.height / 2);
    miner.animationSpeed = 0.2;
    miner.play();
    app.stage.addChild(miner);
  }
}
```

Points à retenir :
- Angular gère les menus, Pixi gère **un seul rectangle**. Ils communiquent par des entrées du composant (signals) : « rejoue ce journal d'événements ».
- Depuis Angular 21, les nouvelles applis sont *zoneless* par défaut : la boucle Pixi ne déclenche pas de détection de changements inutile. Si tu pousses des valeurs vers l'interface Angular, passe par un `signal`, pas à chaque image.
- [PROBABLE] Vérifie la signature exacte de `app.destroy(...)` dans la doc API v8 au moment de coder.

**Rejouer le journal du serveur** : dans `app.ticker.add((ticker) => …)`, accumule le temps écoulé et déclenche chaque événement quand `elapsed >= event.atMs` (animation de frappe, nombre qui saute, minerai qui apparaît).

### Les graphismes

- **Feuille de sprites** (spritesheet) : une image qui contient toutes les étapes d'une animation, plus un JSON qui dit où est chaque image. PixiJS la charge directement.
- **Logiciels** : Aseprite (payant, version d'essai) exporte des feuilles de sprites PNG + JSON. LibreSprite est une alternative libre (GPL v2). [PROBABLE] L'export JSON d'Aseprite est lisible par PixiJS : à vérifier sur un premier sprite.
- **Placeholders** : les packs Kenney sont en **CC0** (domaine public, usage commercial libre). Sur OpenGameArt, la licence change d'un asset à l'autre : note-la pour chaque fichier.
- Ton style « chibi coloré » demandera tôt ou tard un illustrateur. En attendant, des formes simples et une palette cohérente suffisent à juger si la boucle est amusante.

---

## 5. Organiser Spring Boot + Angular

### 5.1 Structure de dépôt

Un seul dépôt (monorepo), deux dossiers. Un seul développeur : c'est plus simple à versionner et les changements d'API et d'interface arrivent dans le même commit.

```
mine-explorer/
├── backend/                       # Spring Boot 4.1 (Maven ou Gradle)
│   └── src/main/java/…/mineexplorer/
│       ├── auth/                  # comptes, Spring Security
│       ├── player/                # état du joueur, collecte hors ligne
│       ├── drilling/              # règles de forage, journal d'événements
│       ├── inventory/             # équipement, butin, fusion
│       ├── gamedata/              # chargement de gamedata.yml
│       └── shared/                # erreurs, horloge
│   └── src/main/resources/
│       ├── gamedata.yml
│       └── db/migration/V1__init.sql   # emplacement Flyway par défaut
├── frontend/                      # Angular 22
│   └── src/app/
│       ├── core/                  # services HTTP, auth
│       ├── features/mine/         # écran principal
│       ├── features/inventory/
│       └── scene/                 # composant PixiJS (plus tard)
├── docs/                          # GDD, TDD, roadmap
└── compose.yaml                   # PostgreSQL pour le dev
```

Les modules par domaine (`drilling`, `inventory`…) gardent les responsabilités séparées. Spring Modulith (projet officiel Spring) peut vérifier par un test que les modules ne se mélangent pas. Optionnel, nouvelle dépendance : à considérer quand il y aura trois ou quatre modules.

### 5.2 Faire parler les deux en dev

`ng serve` tourne sur un port, Spring sur un autre. Plutôt que d'ouvrir le CORS, utilise le **proxy du serveur de dev Angular** : le navigateur ne voit qu'une seule origine, comme en production.

`frontend/src/proxy.conf.json` :
```json
{
  "/api/**": { "target": "http://localhost:8080", "secure": false }
}
```
Puis `"proxyConfig": "src/proxy.conf.json"` dans les options de la cible `serve` d'`angular.json`.

### 5.3 Contrat d'API

- Le client envoie des **intentions** (`POST /api/inventory/{itemId}/upgrade`), jamais des résultats.
- Le serveur renvoie des **DTO** (records Java), jamais les entités JPA : tu contrôles ce qui sort, et tu évites les fuites de champs internes.
- L'identité du joueur vient **de la session** (`@AuthenticationPrincipal`), jamais d'un paramètre d'URL (anti-IDOR).
- Côté Angular, une interface TypeScript par DTO, dans `core/api/`.

```java
@RestController
@RequestMapping("/api/mine")
class MineController {
    private final MineService mineService;

    MineController(MineService mineService) { this.mineService = mineService; }

    @PostMapping("/collect")
    PlayerStateDto collect(@AuthenticationPrincipal PlayerPrincipal principal) {
        return mineService.collect(principal.playerId());
    }
}
```

```ts
@Injectable({ providedIn: 'root' })
export class MineApi {
  private readonly http = inject(HttpClient);
  collect(): Observable<PlayerState> {
    return this.http.post<PlayerState>('/api/mine/collect', null);
  }
}
```

### 5.4 Sécurité entre les deux

- **Session + cookie HttpOnly** (décidé dans la note de faisabilité).
- **CSRF** : Spring Security a une configuration dédiée aux SPA, `csrf.spa()`. Elle place le jeton dans un cookie `XSRF-TOKEN`, et le `HttpClient` d'Angular le renvoie automatiquement dans l'en-tête `X-XSRF-TOKEN` (noms par défaut des deux côtés). Ne désactive pas le CSRF pour « que ça marche » : avec un cookie de session, c'est ce qui empêche un site tiers d'agir à la place du joueur.
- **Double dépense** : `@Version` sur l'entité joueur (verrouillage optimiste) ou `UPDATE … WHERE gold >= :cost`.

### 5.5 Afficher un compteur fluide sans tricher

Le serveur renvoie `gold`, `goldPerSecond` et `serverTime`. Angular affiche `gold + goldPerSecond × (maintenant − serverTime)`, recalculé chaque seconde dans un `signal`. C'est purement cosmétique : à la prochaine action, la valeur du serveur fait foi.

### 5.6 Tests

| Quoi | Outil | Pourquoi |
|---|---|---|
| Formules (`DrillingRules`, butin) | JUnit, sans Spring | rapide, c'est le cœur du jeu |
| Équilibrage sur 1 000 couches | test JUnit paramétré qui exporte un CSV | voir les murs de progression avant de coder l'UI |
| Endpoints + base réelle | `@SpringBootTest` + Testcontainers PostgreSQL (`@ServiceConnection`) | même SGBD qu'en prod |
| Contrôle d'accès | test qui tente d'agir sur l'objet d'un autre joueur | anti-IDOR |
| Composants Angular | outillage de test fourni par le CLI | logique d'affichage |

Audit des dépendances : `npm audit` côté Angular, Dependabot ou OWASP Dependency-Check côté Maven/Gradle.

---

## 6. Tes trois documents de travail : GDD, TDD, roadmap

Cette section s'appuie sur les trois guides Gamearly que tu as ajoutés au projet (Game Document Design, Technical Document Design et Créer une roadmap efficace, en PDF dans le dossier partagé du projet, non copiés dans ce coffre). Ils sont écrits pour des moteurs comme Unity ou Godot : je les traduis ici pour ta stack web.

| Document | Répond à | État pour Mine Explorer |
|---|---|---|
| **GDD** | *quoi* : univers, règles, boucle, interface | Fait. Ton GDD suit déjà les sections du modèle Gamearly. Restent les points à trancher et les encadrés non faits (schéma de boucle, fiches, carte des zones). |
| **TDD** | *comment* : architecture, algorithmes, données, limites | À écrire. C'est là que vivent les formules. |
| **Roadmap** | *quand et dans quel ordre* | À écrire. La section 6.3 en donne une première version. |

L'exemple du guide TDD résume bien la différence : le GDD dit « le joueur peut sauter deux fois », le TDD dit « la fonction vérifie `jumpCount < 2` avant d'appliquer la force ». Pour toi : le GDD dit « chaque couche augmente légèrement la résistance », le TDD dit `resistance(n) = baseResistance × resistanceGrowth^(n-1)`.

### 6.1 Les sept parties du TDD, adaptées à ta stack

| Partie (guide Gamearly) | Version Unity/Godot | Version Mine Explorer |
|---|---|---|
| 1. Introduction | objectif, public, liens | objectif, lien vers le GDD et ce guide |
| 2. Architecture technique | moteur, langages, middleware | Spring Boot 4.1 + PostgreSQL, Angular 22, PixiJS (plus tard) ; schéma de la section 5 ; choix session/cookie, monolithe modulaire, serveur autoritaire, avec leur justification |
| 3. Description des features | nom, objectif, algorithme, entrées/sorties, limites | une fiche par mécanique (modèle ci-dessous) : forage, franchissement, collecte hors ligne, butin, amélioration, Puissance |
| 4. Structures de données | classes, scripts, prefabs/Blueprints | tables SQL (migrations Flyway), entités JPA, DTO, définitions de `gamedata.yml`, composants Angular. Les « prefabs » ici, ce sont tes définitions de données (Type Object) |
| 5. Performances | objectifs FPS, tests, pire cas | temps de réponse des endpoints, 60 images/s de la scène sur un téléphone moyen, pire cas de la collecte hors ligne (plafond de 8 h atteint, joueur très rapide) |
| 6. Intégration / pipeline | merge, versioning, checklist | Git, branches + PR même seul, CI qui lance les tests et l'audit des dépendances, checklist avant mise en ligne |
| 7. Glossaire | termes techniques | le lexique du GDD + termes techniques (DTO, journal d'événements, calcul paresseux) |

Conseils du guide qui comptent particulièrement pour toi : **sois précis et chiffré** (« le jeu doit être fluide » ne se code pas, « la collecte répond en moins de 200 ms » si), **note les dépendances** entre systèmes (le butin dépend de la rareté, qui dépend des données de zone), et **ajoute des schémas** (états d'une couche : verrouillée, en cours, franchie).

### 6.2 Exemple de fiche feature, au format du guide TDD

> **Feature : Collecte des gains hors ligne**
>
> **But** : le joueur retrouve ce que son mineur a creusé pendant son absence (GDD section 1, « progresse seul, y compris hors connexion »).
>
> **Méthode**
> - Module `player`, service `MineService.collect(playerId)`, transaction unique.
> - `elapsed = min(now − lastCollectedAt, OFFLINE_CAP)`, avec `now` = horloge serveur.
> - `OfflineSimulator` avance couche par couche avec `timeToClear(resistance, drillPower)` jusqu'à épuiser `elapsed`.
> - Mise à jour de `currentLayer`, minerais, `lastCollectedAt = now`. Verrouillage optimiste (`@Version`).
>
> **Entrées** : `POST /api/mine/collect` ; identité tirée de la session, aucun paramètre client.
>
> **Sorties** : `PlayerStateDto` (couche, minerais gagnés, durée prise en compte) ; popup « Pendant ton absence » côté Angular.
>
> **Limites** : plafond de 8 h [à valider dans le GDD]. Pas de butin d'équipement hors ligne au MVP [à valider]. Dépend de la condition d'échec d'une couche (point à trancher n° 1).
>
> **Performance** : nombre d'itérations borné par le plafond ; objectif < 200 ms [objectif proposé, à mesurer].
>
> **Tests** : 0 seconde écoulée, exactement le plafond, au-delà du plafond, horloge serveur reculée, deux collectes simultanées.

Écris une fiche comme celle-ci pour chaque mécanique du MVP **avant** de la coder. Si tu n'arrives pas à remplir « Méthode », c'est que le GDD n'a pas encore tranché.

### 6.3 La roadmap

**Quel type de roadmap.** Le guide en propose quatre : chronologique, thématique (par fonctionnalités), par objectifs (OKR), hybride. Pour toi, seul et en alternance, avec un planning encore incertain : **thématique, avec des jalons** et sans dates fixes au début. Le guide la recommande justement « si tu es encore en exploration ». Tu ajouteras des dates quand tu auras mesuré ta vitesse réelle sur deux ou trois étapes.

**Les phases.** Celles du guide (concept, prototype, MVP, alpha, bêta, lancement, live ops) correspondent à la feuille de route de ton GDD. Tu es à la fin du concept. La question du prototype est celle du guide : « le fun est-il là ? »

**Priorisation MoSCoW appliquée à Mine Explorer**

| Priorité | Contenu |
|---|---|
| **Must have** (prototype/MVP) | compte, forage automatique d'une couche, franchissement et échec, collecte hors ligne, butin avec rareté, équiper, améliorer, Puissance affichée |
| **Should have** | scène PixiJS animée, plusieurs zones générées par paramètres, missions quotidiennes, PWA |
| **Could have** | collections de minerais, apparences, sons d'ambiance par profondeur, fusion d'équipement |
| **Won't have** (pour l'instant) | JcJ, guildes, messagerie, boutique et paiements, applis natives sur les stores |

**Les étapes, en ordre de construction.** Chaque étape produit quelque chose de jouable ou de testable.

| Étape | Livrable | Ce que tu apprends |
|---|---|---|
| 0 | Tutoriels officiels : Angular « Learn Angular » + « Learn signals », guides Spring « REST service » et « Accessing Data with JPA » | les bases des deux frameworks |
| 1 | Trancher les points bloquants 1, 2 et 5 ; écrire le TDD (au moins les fiches des Must have) | game design vers spécification |
| 2 | `DrillingRules` + tests + simulation d'équilibrage en CSV | Java pur, JUnit, équilibrage |
| 3 | API : compte, état du joueur, collecte hors ligne, Flyway | Spring Boot, JPA, Security |
| 4 | Écran principal Angular en DOM/CSS (palier 1) | composants, signals, HttpClient |
| 5 | Butin et équipement : rareté, équiper, comparer, Puissance | RNG serveur, transactions |
| 6 | Scène PixiJS qui rejoue le journal de forage (palier 3) | rendu 2D, boucle, sprites |
| 7 | PWA (`ng add @angular/pwa`), test sur téléphone | mobile |

Jalon **« prototype de la boucle de forage »** du GDD = fin de l'étape 4. Jalon **« prototype équipement et statistiques »** = fin de l'étape 5. Ne touche pas au JcJ ni aux guildes avant que cette boucle soit amusante.

**Délais.** Le guide conseille de compter 15 à 30 % de marge. Pour toi, ajoute un facteur que le guide ne couvre pas : le rythme de l'alternance. Estime en **heures réellement disponibles par semaine**, pas en jours. Et une première fois avec une techno, compte large : ces étapes servent aussi à apprendre.

**Suivi.** Un tableau Kanban (À faire / En cours / Fait) suffit pour une personne. Le guide cite Trello, Notion ou Jira ; GitHub Projects a l'avantage d'être à côté de ton code quand le dépôt existera. Fais un point de 15 minutes par semaine avec toi-même : ce qui est fait, ce qui bloque, si l'estimation tient.

---

## 7. Ressources vérifiées

Toutes consultées le 11/10/2026. Les livres sont cités sans lien.

### Game design et équilibrage d'un idle
- [The Math of Idle Games, Part I](https://blog.kongregate.com/the-math-of-idle-games-part-i/), [Part II](https://blog.kongregate.com/the-math-of-idle-games-part-ii/), [Part III](https://blog.kongregate.com/the-math-of-idle-games-part-iii/) (blog développeurs Kongregate). **La** référence sur les courbes coûts/production et le prestige. À lire avant d'écrire tes formules.
- [Machinations](https://machinations.io/) : modéliser et simuler une économie de jeu (offre gratuite, limites à vérifier).
- [Red Blob Games](https://www.redblobgames.com/) (Amit Patel), en particulier [Probability and Games: Damage Rolls](https://www.redblobgames.com/articles/probability/damage-rolls.html) : comment le hasard des dégâts change la sensation de jeu. Utile pour critique et double frappe.
- Livres : *The Art of Game Design: A Book of Lenses* (Jesse Schell) et *A Theory of Fun for Game Design* (Raph Koster).

### Programmer un jeu
- [Game Programming Patterns](https://gameprogrammingpatterns.com/contents.html) (Robert Nystrom), lisible en ligne. Chapitres utiles pour toi : [Game Loop](https://gameprogrammingpatterns.com/game-loop.html), [Type Object](https://gameprogrammingpatterns.com/type-object.html) (données de jeu), State, Observer, Event Queue.
- [Fix Your Timestep!](https://gafferongames.com/post/fix_your_timestep/) (Glenn Fiedler) : le pas de temps fixe et l'interpolation.
- [MDN : Anatomy of a video game](https://developer.mozilla.org/en-US/docs/Games/Anatomy) : la boucle de jeu dans le navigateur, `requestAnimationFrame`, onglets en arrière-plan.

### 2D et assets
- [PixiJS v8 : guides](https://pixijs.com/8.x/guides) · [Quick start](https://pixijs.com/8.x/guides/getting-started/quick-start) · [Sprite](https://pixijs.com/8.x/guides/components/scene-objects/sprite) · [Assets](https://pixijs.com/8.x/guides/components/assets) · [Ticker](https://pixijs.com/8.x/guides/components/ticker) · [Application](https://pixijs.com/8.x/guides/components/application) · [API AnimatedSprite](https://pixijs.download/release/docs/scene.AnimatedSprite.html)
- [Aseprite](https://www.aseprite.org/) (payant) · [LibreSprite](https://libresprite.github.io/) (libre, GPL v2)
- [Kenney](https://kenney.nl/support) : assets CC0 · [OpenGameArt](https://opengameart.org/) : licences libres variées

### Angular
- [Tutoriels officiels](https://angular.dev/tutorials) : [Learn Angular](https://angular.dev/tutorials/learn-angular), [Learn signals](https://angular.dev/tutorials/signals), [First app](https://angular.dev/tutorials/first-app)
- [Signals](https://angular.dev/guide/signals) · [Zoneless](https://angular.dev/guide/zoneless) · [afterNextRender](https://angular.dev/api/core/afterNextRender) · [HttpClient](https://angular.dev/guide/http)
- [Proxy du serveur de dev](https://angular.dev/tools/cli/serve) · [Sécurité (XSRF)](https://angular.dev/best-practices/security) · [Service workers et PWA](https://angular.dev/ecosystem/service-workers)

### Spring Boot
- [Guides Spring](https://spring.io/guides), dont [REST service](https://spring.io/guides/gs/rest-service), [Accessing Data with JPA](https://spring.io/guides/gs/accessing-data-jpa), [Securing a Web Application](https://spring.io/guides/gs/securing-web), [Testing the Web Layer](https://spring.io/guides/gs/testing-web)
- [Spring Security : CSRF, section SPA](https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html)
- [Migrations Flyway avec Spring Boot](https://docs.spring.io/spring-boot/how-to/data-initialization.html) · [Documentation Flyway](https://documentation.red-gate.com/flyway)
- [Testcontainers dans Spring Boot](https://docs.spring.io/spring-boot/reference/testing/testcontainers.html) · [Testcontainers Java](https://java.testcontainers.org/)
- [Spring Modulith](https://spring.io/projects/spring-modulith) (2.1.1 au 11/10/2026)

### Mobile, plus tard
- [Capacitor](https://capacitorjs.com/docs) (v8 au 11/10/2026)

---

## 8. Ce qui n'est pas vérifié

- [PROBABLE] Signature exacte de `Application.destroy()` en PixiJS v8 et option `resizeTo` : la page de guide consultée ne les montre pas, à confirmer dans l'API.
- [PROBABLE] Compatibilité directe de l'export JSON d'Aseprite avec `Assets.load` de PixiJS.
- [JE NE SAIS PAS] Version de Spring Security qui a introduit `csrf.spa()` : la doc actuelle la recommande, mais ne date pas son apparition. Elle est présente dans la référence correspondant à Spring Boot 4.1.
- Les exemples de code sont illustratifs : aucun n'a été compilé ni exécuté.

---

Voir aussi : [[Accueil]] · [[mvp-parcours]] · [[faisabilite]]
