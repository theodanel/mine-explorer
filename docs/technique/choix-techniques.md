# Choix techniques

Retour à [[documentation-technique]]. Chaque choix : le contexte, la décision, la raison, ce qu'on accepte en échange.

## Angular pour l'interface, PixiJS pour la mine

- **Décision** : Angular 21 (sans zone.js, signaux) pour tous les menus, fenêtres et pages ; PixiJS 8 seulement pour la scène animée.
- **Raison** : Angular apporte un typage strict, des composants testables et un écosystème mûr pour l'interface ; PixiJS dessine en WebGL les animations image par image. Un moteur de jeu complet (Phaser) aurait dupliqué ce qu'Angular fait bien.
- **En échange** : deux mondes à faire communiquer, par des signaux lus par la scène.

## Règles pures séparées des services

- **Décision** : toute la logique de jeu dans des fonctions sans effet de bord (`*-rules.ts`) et des tables de chiffres (`balance/`).
- **Raison** : testables seules, rejouables par le simulateur d'économie, et portables en Java le jour où le serveur devient autoritaire.

## Sauvegarde dans le navigateur, pas encore de serveur

- **Décision** : l'état est dans le `localStorage`. Le backend (comptes, sauvegarde cloud) en garde une copie quand le joueur se connecte, sans remplacer la sauvegarde locale : le jeu reste jouable hors connexion.
- **Raison** : pour une première version de test, un site statique suffit, ne coûte rien, et n'expose aucune surface d'attaque serveur (pas de base, pas d'API, pas de compte).
- **En échange** : triche locale possible, partie liée à un navigateur et un appareil. À revoir dès qu'il y aura classement, synchronisation entre appareils ou achats.

## Comptes et sauvegarde cloud : Spring Security, Fly.io et Neon

- **Décision** : connexion Google gérée directement par Spring Security (OpenID Connect), session en base (Spring Session JDBC) et cookie `HttpOnly`, serveur sur Fly.io (Paris), base PostgreSQL chez Neon. Anti-triche de plausibilité plutôt que serveur autoritaire.
- **Raison** : aucun mot de passe stocké, aucun service d'authentification tiers payant, données chez nous ; pas de jeton dans le navigateur, donc rien à voler par un script ; aucun serveur à administrer pour quelques euros par mois. La plausibilité bloque l'essentiel de la triche au classement sans porter toute l'économie en Java pendant qu'elle change encore.
- **En échange** : deux fournisseurs de plus ; la limite de requêtes en mémoire suppose une seule machine ; la courbe de référence de l'anti-triche est à relever après chaque rééquilibrage. Limite de requêtes écrite à la main (une quarantaine de lignes) plutôt qu'avec Bucket4j, pour ne pas ajouter de dépendance tant qu'une seule machine tourne.

## Hébergement sur Cloudflare Pages, déployé par la CI

- **Décision** : site statique sur Cloudflare Pages, publié par GitHub Actions avec `wrangler` (envoi direct), pas par l'intégration Git de Cloudflare.
- **Raison** : le déploiement n'a lieu qu'après les tests ; c'est le build testé qui part en ligne ; en-têtes de sécurité gérés par un fichier versionné ; HTTPS et CDN inclus ; gratuit pour ce volume ; fonctionne avec un dépôt privé. GitHub Pages demande un compte payant pour un dépôt privé.
- **En échange** : dépendance à un fournisseur ; deux secrets à gérer.

## CSP stricte

- **Décision** : aucun script inline ni `eval` autorisé ; seuls les styles inline le sont.
- **Raison** : c'est la protection la plus efficace contre l'injection de script. Elle a demandé de charger PixiJS sans `eval` et de désactiver l'injection inline du CSS critique, pour un coût de performance négligeable.

## Outils de qualité

- **ESLint** (`angular-eslint`, `typescript-eslint`) : règles recommandées, pas de `any`, pas d'`eval`, accessibilité des gabarits. Deux règles d'accessibilité désactivées pour le motif « fond de fenêtre qui se ferme au toucher », chaque fenêtre ayant un vrai bouton de fermeture.
- **Vitest** : outil de test par défaut d'Angular 21, rapide, avec couverture V8.
- **Prettier** est installé mais pas imposé en CI : le reformatage de tout le dépôt ferait un énorme diff sans valeur ; il pourra l'être plus tard, en une PR dédiée.

## Pages chargées à la demande

- **Décision** : pages du menu et fenêtres qui arrivent après le démarrage chargées avec `@defer`.
- **Raison** : PixiJS pèse lourd ; le premier chargement reste sous le budget fixé dans `angular.json`, important sur mobile.
- **Budget** : 1 Mo bruts jusqu'au 14/10/2026, relevé à 1,2 Mo quand le jeu l'a atteint (Campement, Puits sans fond). Ce qui transite vraiment est compressé : environ 285 Ko. PixiJS en fait près de la moitié ; le reste des nouveautés est chargé à la demande.

## Polices (16/10/2026)

Lilita One (titres, chiffres, boutons) et Nunito (texte), choisies par Théo pour le style cartoon. Toutes deux sous licence OFL, installées par les paquets npm `@fontsource/lilita-one` et `@fontsource/nunito` (versions figées), et déclarées dans `angular.json` (sous-ensemble latin, accents et œ compris). Le build les copie avec le site : aucune requête vers Google Fonts, et la CSP garde `font-src 'self'`. Lilita One n'a qu'une graisse : `font-synthesis-weight: none` empêche le navigateur de l'épaissir.
