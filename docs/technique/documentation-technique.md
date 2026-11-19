# Documentation technique

Documentation de référence de Mine Explorer, tenue à jour à chaque changement du code. Elle décrit ce qui est **en place**, pas ce qui est prévu. Retour à [[Accueil]].

| Document | Contenu |
|---|---|
| [[architecture]] | Vue d'ensemble, découpage du frontend, état et sauvegarde, backend |
| [[backend]] | Comptes Google, sauvegarde cloud, anti-triche, classement : API, sécurité, mise en ligne |
| [[installation]] | Prérequis, lancement en local, commandes utiles |
| [[tests]] | Stratégie de test, outils, couverture, simulateur d'économie |
| [[ci-cd]] | Intégration continue, analyse de sécurité, mises à jour de dépendances |
| [[deploiement]] | Mise en ligne : le jeu sur Cloudflare Pages, le serveur sur le Raspberry Pi |
| [[docker]] | Images Docker du jeu, compose local |
| [[securite]] | Modèle de menace, protections en place, limites assumées |
| [[audit-securite-backend]] | Audit de sécurité du backend du 14/10/2026 : constats par gravité, corrections, points à décider |
| [[audit-depot]] | Audit du dépôt du 19/10/2026 : secrets et exposition de l'infrastructure, historique git compris |
| [[performance]] | Poids du chargement, budgets, cache, rendu |
| [[pwa]] | Installation du jeu sur l'écran d'accueil |
| [[choix-techniques]] | Décisions techniques et leurs justifications |

## État du projet (19/10/2026)

- **Jeu** : complet en Angular 21 et PixiJS 8, entièrement dans le navigateur, publié sur Cloudflare Pages (`https://mine.bouncylab.ovh`) à chaque push sur `main` dont la CI est verte. La partie est sauvegardée dans le `localStorage`, et jouable sans compte.
- **Serveur** : Spring Boot 4.1 (Java 21) en ligne sur le Raspberry Pi de Théo (`https://api.bouncylab.ovh`), avec PostgreSQL. Connexion Google, sauvegarde cloud, anti-triche de plausibilité, classements et discussion entre joueurs (voir [[backend]]).
- **Présentation du projet** : `README.md` à la racine ; contributions : `CONTRIBUTING.md` ; signalement des failles : `SECURITY.md`.

## Règle de mise à jour

Toute PR qui change l'architecture, une commande, la CI, le déploiement ou une protection de sécurité met à jour le document concerné dans la même PR. Les notes de game design (règles, équilibrage, visuels) vivent à part, dans `docs/game-design/`.
