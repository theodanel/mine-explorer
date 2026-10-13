# Documentation technique

Documentation de référence de Mine Explorer, tenue à jour à chaque changement du code. Elle décrit ce qui est **en place**, pas ce qui est prévu. Retour à [[Accueil]].

| Document | Contenu |
|---|---|
| [[architecture]] | Vue d'ensemble, découpage du frontend, état et sauvegarde, backend |
| [[installation]] | Prérequis, lancement en local, commandes utiles |
| [[tests]] | Stratégie de test, outils, couverture, simulateur d'économie |
| [[ci-cd]] | Intégration continue, analyse de sécurité, mises à jour de dépendances |
| [[deploiement]] | Mise en ligne sur Cloudflare Pages, secrets, restriction d'accès |
| [[securite]] | Modèle de menace, protections en place, limites assumées |
| [[choix-techniques]] | Décisions techniques et leurs justifications |

## État du projet (13/10/2026)

- **Frontend** : jeu complet en Angular 21 et PixiJS 8, entièrement dans le navigateur. La partie est sauvegardée dans le `localStorage`.
- **Backend** : squelette Spring Boot 4.1 (Java 21), sans route exposée. Il n'est **pas** déployé ; il servira plus tard à rendre le serveur autoritaire (voir [[choix-techniques]]).
- **Mise en ligne** : seul le frontend est publié, sur Cloudflare Pages, à chaque push sur `main` dont la CI est verte.

## Règle de mise à jour

Toute PR qui change l'architecture, une commande, la CI, le déploiement ou une protection de sécurité met à jour le document concerné dans la même PR. Les notes de game design (règles, équilibrage, visuels) vivent à part, dans `docs/game-design/`.
