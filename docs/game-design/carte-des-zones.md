# Carte des zones et retour en arrière

Demande de Théo (14/10/2026) : toucher « Zone 8 » ouvre une carte des zones façon jeu mobile (Candy Crush). On y voit les zones faites, celle où l'on est, et les zones à venir voilées d'un point d'interrogation. On peut aussi revenir dans une zone passée pour y miner son minerai, qui sert à l'Atelier.

## Carte

- Un chemin qui monte de la zone 1 (en bas) vers les profondeurs (en haut). Il va au moins jusqu'à la zone 20 et montre toujours deux zones d'avance.
- **Zone faite** : vignette de son décor, cerclée d'or, avec une coche.
- **Zone actuelle** : plus grande, avec un halo qui pulse.
- **Zone à venir** : grisée, avec « ? » et un nom caché.
- Le portrait du mineur se tient sur la zone où il mine, et la carte s'ouvre centrée sur lui.
- Sous chaque zone : son nom (Galerie des racines, Carrière de pierre… Cœur du monde) et l'icône de son minerai.
- Toucher une zone ouvre sa fiche : son minerai et le stock du joueur, puis « Miner ici » (zone faite) ou « Reprendre ma progression ».

## Retour dans une zone passée

- **Filons sans fin** : on casse les filons de la zone autant qu'on veut, sans jamais avancer. Chacun a la résistance du dernier filon de la zone, donc il est facile pour un joueur qui l'a dépassée.
- **Récompenses** :
  - 1 minerai de la zone par filon : c'est le but ;
  - l'or ne vient que des PV vraiment minés (les dégâts en trop ne rapportent rien), donc il est bien plus maigre ;
  - pas d'éclats de filon, mais les éclats déterrés au hasard restent.
- **Pas de missions ni de Défi** : ces filons ne comptent pas, ils seraient trop faciles à enchaîner. Pas de galerie non plus.
- **La progression attend** : zone, filon et dégâts restent intacts. « Reprendre la zone 8 » s'affiche sous le bandeau tant qu'on est en retour.
- **Sauvegarde** : clé `mine-explorer.farm` (zone et dégâts du filon en cours), relue au chargement.

## Atelier

Chaque pièce affiche le minerai de sa qualité et le stock. Quand il manque, un bouton « Miner ce minerai en zone N » y emmène directement, si la zone est déjà terminée.

## Visuel du fond de carte

Livré par Théo le 14/10/2026 (`art-source/ui/carte-fond.png`). Son haut et son bas ne se raccordent pas : `art-source/ui/decouper-ui.py` l'empile sous son reflet vertical pour en faire une tuile sans couture. La carte la répète, calée en bas, si bien que la zone 1 part des rails peints. Le sentier en pointillés reste tracé par le jeu. Prompt utilisé :

```
Vertical mobile game background tile, 9:16 portrait (1080x1920), hand-painted 2D cartoon style, NOT a photo, NOT a 3D render, soft painterly shading, thick dark outlines, warm cozy lighting, same art direction as a cute chibi idle mining RPG and as the attached reference image. Top-down view of an underground mine floor, like a level map in a mobile puzzle game: packed brown earth in the middle, with rocks, small glowing crystals, wooden support beams, bits of old rail track, mushrooms and lanterns along the left and right edges. The central 60% of the width stays calm and plain (game icons and a path will be placed on top). The image must tile seamlessly vertically: the top edge continues exactly into the bottom edge. No characters, no text, no numbers, no UI, no path drawn in the middle.
```
