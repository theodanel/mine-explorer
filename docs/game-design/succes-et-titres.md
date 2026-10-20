# Succès et titres

Lot 6 des idées inspirées de Forge Master, demandé par Théo le 19/10/2026.

## Règles

- **30 succès** (`balance/achievements.ts`) : profondeur (zones 2, 5, 10, 15, 20), gardiens (zones 5, 10 et 19 terminées), forges (100 à 50 000 objets), jackpots (1 et 5), record du Puits (25 à 200 étages), panoplies (3 et 5 pièces, 5 pièces en Divin), tenues (5, 15, 30), donjons (niveaux 10, 25, 50), évolution (Légende, 1re et 5e étoile du Cœur du monde).
- Un succès se gagne quand sa mesure atteint son seuil et reste gagné ensuite (une panoplie retirée ne le reprend pas). Liste gardée dans `mine-explorer.succes`, qui part avec la sauvegarde cloud.
- Une annonce « Succès : Forgeron ! » apparaît sur la mine quand un succès tombe.
- Chaque succès donne un **titre**. Le joueur en porte un (Profil, carte « Succès et titres » : toucher un succès gagné pour porter son titre, le toucher encore pour l'enlever).
- Le titre porté s'affiche à côté du pseudo dans le **classement** et la **discussion**.

## Serveur

- `PUT /api/me/title {title}` : le titre est un **identifiant** de la liste blanche `TitleCatalog` (jamais du texte libre), ou null. Le serveur vérifie que le succès figure dans la liste des succès de la **sauvegarde cloud** du joueur (`title-locked` sinon) ; le jeu renvoie alors la partie et réessaie une fois.
- Limite assumée : la liste des succès de la sauvegarde n'est pas recalculée par le serveur (l'anti-triche ne vérifie que la progression). L'enjeu est cosmétique ; une vérification complète demanderait de rejouer toutes les règles du jeu côté serveur.
- Colonne `player.title` (migration `V3__titres.sql`), renvoyée par le classement et la discussion ; le libellé affiché vient du jeu, échappé par Angular comme tout texte.
- **Mise à jour du serveur de test nécessaire** (nouvelle migration et nouvel endpoint).

## Simulateur

Les succès ne donnent rien d'autre qu'un titre : aucun effet sur l'équilibrage.
