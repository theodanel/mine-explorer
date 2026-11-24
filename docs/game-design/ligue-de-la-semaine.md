# Ligue de la semaine

Lot 8 des idées inspirées de Forge Master, demandé par Théo le 19/10/2026.

## Règles

- Cinq ligues : **Bronze, Argent, Or, Diamant, Légende**. Le joueur entre en Bronze à sa première sauvegarde cloud (ou à la première depuis l'arrivée des ligues).
- **Score** : les filons gagnés depuis lundi, lus dans la valeur classée de la sauvegarde cloud (donc passée par l'anti-triche). Le jeu n'envoie rien de plus.
- Le joueur base est petit : **tous les joueurs d'une ligue concourent ensemble** (pas de groupes de 30).
- **Lundi à 0 h, heure de Paris** : dans chaque ligue, les **20 % du haut montent** et les **20 % du bas descendent** (au moins un joueur de chaque côté ; seul dans sa ligue, on ne descend pas ; un joueur qui n'a gagné aucun filon de la semaine ne monte pas).
- **Récompense** à chaque joueur ayant joué, selon la ligue de la semaine finie : Bronze 50 éclats, Argent 100, Or 200, Diamant 350, Légende 500. Elle attend sur le serveur et se récupère dans l'onglet Ligue.
- Si le serveur était arrêté le lundi à minuit, la semaine se clôt à la première demande qui suit.

## Écran

Classement, onglet **Ligue** : la récompense de la semaine passée (« Récupérer 50 »), la ligue et le temps restant, puis les joueurs de la ligue avec leur score, leur titre, et la zone de montée (vert, ▲) ou de descente (rouge, ▼).

## Serveur

- Table `league_member` (migration `V4__ligue.sql`) : ligue, lundi de la semaine, filons classés au début de la semaine, récompense en attente.
- `GET /api/league` (404 `league-none` sans sauvegarde), `POST /api/league/claim`.
- Clôture planifiée le lundi à 0 h (`@Scheduled`, fuseau Europe/Paris), et au besoin à la première demande.
- **Mise à jour du serveur de test nécessaire.**
