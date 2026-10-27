# Carnet d'aventure

Demande de Théo (27/10/2026) : guider le joueur pas à pas, comme le tuto du début, sous une forme plus sympa, avec le lore du jeu. Visuels de Théo (icône, carnet ouvert, sceau de cire), découpés par `art-source/carnet/preparer-carnet.py`.

- Le carnet d'Orvald, un mineur parti chercher le Cœur du monde avant le joueur. L'icône est sous la roue de la loterie et s'anime quand un chapitre attend son sceau.
- Les pages du haut portent le journal d'Orvald (le lore). En bas à gauche, les objectifs du joueur se cochent seuls. En bas à droite : ce que le chapitre ouvre, la récompense en éclats, et le bouton « Sceller » avec le sceau de cire.
- 13 chapitres pour la 1re boucle (`frontend/src/app/journal/journal-chapters.ts`), puis une page par vie (phases 2 à 5), puis une page sans fin.
- Le carnet s'ouvre de lui-même une fois par chapitre rempli, et reste ouvert après le sceau pour montrer la page suivante. On peut relire les chapitres scellés.
- Une partie déjà avancée coche d'office les chapitres remplis, sans récompense.
- Les déblocages restent ceux du jeu (zones et formes) : les chapitres sont calés dessus et les annoncent.
