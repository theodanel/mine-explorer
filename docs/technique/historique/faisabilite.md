# Idle RPG type Legends of Mushroom en Spring Boot + Angular : faisabilité

## Verdict

Oui, c'est faisable et c'est même une stack cohérente pour ce genre de jeu. Un idle RPG est surtout un **jeu de gestion d'état et de calculs** (stats, ressources, timers, butin), pas un jeu d'action temps réel. Le moteur graphique compte peu, la logique serveur compte beaucoup. Spring Boot est très à l'aise là-dessus, Angular aussi pour une interface riche en menus.

Ce qui coûtera le plus cher n'est pas technique : c'est le **game design et l'équilibrage** (courbes de progression, économie, rareté du butin) et les **assets graphiques**.

## Versions actuelles (vérifiées le 10/10/2026)

| Outil | Version | Source |
|---|---|---|
| Spring Boot | 4.1.1, Java 17 minimum (compatible jusqu'à Java 26), Spring Framework 7.0.9+ | [spring.io/projects/spring-boot](https://spring.io/projects/spring-boot), [system requirements](https://docs.spring.io/spring-boot/system-requirements.html) |
| Angular | v22 (sortie le 2026-06-03, support actif jusqu'à 2027-06). v21 et v20 en LTS | [angular.dev/reference/releases](https://angular.dev/reference/releases) |

Recommandation : partir sur Spring Boot 4.1.x avec un JDK LTS récent (Java 25 [PROBABLE] : à confirmer selon ce que ton alternance utilise), et Angular 22 avec composants standalone et signals (les NgModules ne sont plus la voie recommandée).

## Ce qui va bien avec cette stack

- **Logique autoritaire côté serveur** : Java typé, testable (JUnit), parfait pour les formules de dégâts, de loot et de progression.
- **Persistance** : PostgreSQL + Spring Data JPA + Flyway. L'état d'un joueur (inventaire, niveaux, monnaies) est très relationnel.
- **Sécurité** : Spring Security fournit authentification, CSRF, gestion de session.
- **Interface** : un idle RPG, c'est 80 % de menus, listes, popups, compteurs. Angular (signals, formulaires, routing) gère ça très bien.

## Ce qui coûte, et comment le traiter

### 1. Progression hors ligne

Le piège classique : un `@Scheduled` qui fait « tiquer » tous les joueurs chaque seconde. Ça ne tient pas la charge et ça ne sert à rien.

**Approche recommandée : calcul paresseux (lazy).** On stocke `lastCollectedAt` et le taux de gain du joueur. Quand il revient (ou clique « récolter »), le serveur calcule :

```
gain = taux_par_seconde × min(maintenant - lastCollectedAt, plafond)
```

- Plafond (ex. 8 ou 12 h) : c'est une mécanique de jeu classique qui force le retour du joueur, et ça borne les abus.
- L'heure vient **toujours du serveur** (`Instant.now()` côté Java), jamais du client, sinon on triche en changeant l'horloge du téléphone.
- Si le taux dépend de combats (le joueur « avance » dans les niveaux hors ligne), on ne simule pas des milliers de combats : on utilise une formule fermée ou une simulation statistique (gain moyen par combat × nombre de combats estimés).

Argument à l'oral : coût en O(1) par joueur au moment où il se connecte, zéro coût pour les joueurs absents.

### 2. Anti-triche

Règle unique : **le client affiche, le serveur décide.**

- Le client envoie des **intentions** (« lancer le combat du niveau 12 », « ouvrir un coffre », « améliorer l'arme »), jamais des résultats (« j'ai gagné 500 or »).
- Tout le RNG (butin, coups critiques, gacha) tourne côté serveur.
- **Double dépense** : deux requêtes simultanées « acheter » peuvent dépenser deux fois le même or. Solution : verrouillage optimiste JPA (`@Version`) ou une requête `UPDATE ... WHERE gold >= :cost` atomique, plus une clé d'idempotence sur les actions.
- Contrôle d'accès sur chaque ressource : l'id du joueur vient de la session, jamais d'un paramètre de l'URL (anti-IDOR).
- Rate limiting sur les endpoints d'action et sur le login.

### 3. Combats automatiques

Le serveur simule le combat et renvoie un **journal d'événements** (tour 1 : le héros frappe pour 42, critique ; tour 2 : le slime attaque...). Angular se contente de **rejouer ce journal** en animation.

Pourquoi c'est le bon choix :
- Une seule implémentation des règles (Java). Si tu dupliques la logique en TypeScript pour l'affichage, les deux finiront par diverger.
- Le combat est rejouable et testable : avec une graine (seed) aléatoire stockée, tu peux reproduire un bug d'équilibrage.
- Le client ne peut pas falsifier l'issue.

Pour l'affichage : du CSS/SVG suffit pour un MVP. Si tu veux des sprites animés plus tard, une lib de rendu 2D en canvas (PixiJS par exemple) s'intègre dans un composant Angular. Ce serait une nouvelle dépendance, à décider plus tard.

### 4. Temps réel

**Pas nécessaire pour le cœur du jeu.** Un idle se joue très bien en REST classique : le client affiche un compteur qui s'incrémente localement (cosmétique), et resynchronise avec le serveur à chaque action.

Le temps réel ne devient utile que pour : chat, guildes, événements en direct, notifications. À ce moment-là :
- **SSE** (Server-Sent Events) si c'est serveur vers client uniquement (notifications) : plus simple.
- **WebSocket** (STOMP via Spring) si c'est bidirectionnel (chat).

L'arène PvP de ce genre de jeu est en général **asynchrone** [PROBABLE] : tu combats une copie des stats d'un autre joueur, simulée par le serveur. Donc pas de temps réel non plus.

### 5. Mobile

Legends of Mushroom est un jeu mobile. Le même code Angular peut aller sur mobile par deux voies :

- **PWA** : installable depuis le navigateur, aucun store. Gratuit et immédiat, mais moins visible et plus limité sur iOS.
- **Capacitor** : empaquette l'appli Angular dans une coquille native Android/iOS, publiable sur les stores, avec accès aux notifications natives. Il faut un compte développeur sur chaque store, et un Mac pour compiler la version iOS.

Le backend Spring Boot ne change pas. Le seul point d'architecture à anticiper concerne l'authentification : dans une appli Capacitor, le front n'est plus servi depuis le domaine de l'API, donc le cookie de session devient « cross-site », et iOS (WKWebView) bloque ce type de cookie. Il faudra soit passer les requêtes par la couche HTTP native de Capacitor, soit passer à un token stocké dans le stockage sécurisé de l'appareil [PROBABLE : à vérifier au moment de packager]. Le cookie de session reste le bon choix pour la version web.

Ordre recommandé : web responsive (mobile first) → PWA → Capacitor si tu veux les stores.

## Architecture recommandée

```
Angular 22 (SPA, standalone + signals)
        │  REST JSON (HTTPS), cookie de session HttpOnly
        ▼
Spring Boot 4.1 : monolithe modulaire
  ├─ auth        (Spring Security, comptes, sessions)
  ├─ player      (profil, ressources, collecte hors ligne)
  ├─ combat      (simulation, journal d'événements)
  ├─ inventory   (équipement, coffres, loot)
  └─ gamedata    (définitions statiques : monstres, objets, niveaux)
        │
        ▼
PostgreSQL (Flyway pour les migrations)
```

Choix et justifications :

- **Monolithe modulaire, pas de microservices.** Un seul développeur, un seul déploiement. Les microservices ajoutent réseau, cohérence distribuée et ops sans bénéfice à cette échelle. Les modules par domaine gardent la porte ouverte à un découpage plus tard.
- **Session serveur + cookie HttpOnly plutôt que JWT.** Front et back sur le même domaine : la session est révocable immédiatement, le cookie n'est pas lisible par du JavaScript (protège contre le vol par XSS), et Spring Security gère CSRF nativement. Le JWT n'apporte un vrai gain qu'avec plusieurs services ou clients tiers.
- **Données de jeu statiques en fichiers versionnés (JSON/YAML) chargés au démarrage**, séparées des données joueur en base. L'équilibrage devient un diff relisible dans git, et tu peux tester les formules sans base.
- **PostgreSQL** plutôt que NoSQL : inventaires, transactions de monnaie et classements profitent des transactions ACID et des index.
- **Redis : pas au début.** Utile plus tard pour classements à grande échelle ou cache. PostgreSQL suffit largement pour un MVP.
- **Docker Compose** pour le dev local (Postgres + backend), conteneurs non root.

## Périmètre MVP réaliste

Objectif : une boucle de jeu complète et amusante, rien de plus.

**Dedans**
1. Inscription / connexion (mot de passe haché en Argon2 ou bcrypt).
2. Un héros avec quelques stats (PV, attaque, défense, vitesse).
3. Une suite de niveaux (stages) avec combats automatiques simulés côté serveur et rejoués en animation simple.
4. Récompenses : or et XP, montée de niveau.
5. Coffres donnant de l'équipement aléatoire avec rareté (commun → légendaire), équiper / vendre.
6. Amélioration des stats contre de l'or.
7. Gains hors ligne plafonnés, calculés à la reconnexion.

**Dehors (après le MVP)**
- PvP arène, guildes, chat, familiers, compétences actives, événements, boutique, paiements, version mobile native.

**Ordre de construction conseillé** : modèle de données + formules de combat testées en JUnit, puis API REST, puis l'interface. Les formules sont le cœur : si elles sont bien testées, le reste suit.

## Points à ne pas sous-estimer

- **Équilibrage** : prévois un petit outil (même un test JUnit paramétré ou un tableur) pour simuler la progression sur 100 niveaux avant de coder l'UI.
- **Assets** : sprites et icônes. Packs libres (licence à vérifier pour chaque pack) ou placeholders au début.
- **Propriété intellectuelle** : s'inspirer des mécaniques, oui ; reprendre nom, personnages ou graphismes de Legends of Mushroom, non.
- **Audit des dépendances** : `npm audit` côté Angular, Dependabot ou OWASP Dependency-Check côté Maven/Gradle.

---

Voir aussi : [[Accueil]] · [[guide-demarrage-technique]] · [[Decisions]]
