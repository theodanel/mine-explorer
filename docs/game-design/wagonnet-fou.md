# Wagonnet fou

Troisième aventure, validée par Théo le 14/10/2026 : une course de wagonnet sur rails, vue de dos, qui se joue au réflexe. Le Campement se gère, le Puits se joue en tapant, le Wagonnet se joue en glissant.

## Règles

- **Déblocage** : forme Contremaître (vers le jour 3), comme le Puits ; Théo l'a avancé le 14/10/2026 (d'abord prévu au Maître des profondeurs). **3 courses par jour**, remises à minuit ; une course compte dès le départ.
- **3 voies** : le wagonnet dévale tout seul. On glisse (ou on touche) à gauche ou à droite pour changer de voie ; flèches du clavier sur ordinateur.
- **Obstacles** : éboulements, rails cassés, et à partir de 200 m des chauves-souris qui se jettent sur une voie voisine quand le wagonnet arrive à 12 m. Une rangée bloque une ou deux voies, jamais les trois.
- **Trouvailles** : minerai et pépites sur les voies libres.
- **Vitesse** : 9 m/s au départ (32 km/h), +0,18 m/s chaque seconde, jusqu'à 24 m/s. La course finit toujours par un crash.
- **Aiguillages** : tous les 250 m (le premier à 150 m), deux boutons. La **voie sûre** est prise par défaut. La **voie risquée** va 15 % plus vite, avec plus d'obstacles (une rangée tous les 7 m au lieu de 9, deux voies bloquées 60 % du temps) et plus de trouvailles (80 % au lieu de 50 %), jusqu'au prochain aiguillage.
- **Lien avec le build** :
  - la **Puissance** donne la solidité du wagonnet : 3 cœurs à la Puissance conseillée de la zone, un de plus à chaque doublement (jusqu'à 5), un de moins sous la moitié (au moins 2) ;
  - le **bonus d'or** augmente la valeur des pépites.
  - Après un choc, le wagonnet est intouchable 1,2 s.
- **Récompenses** :
  - **minerai** : 1 minerai de la zone par trouvaille, pour nourrir l'Atelier ;
  - **pépite** : un quart de filon d'or de la zone, avec le bonus d'or ;
  - **record** : chaque palier de 500 m atteint pour la première fois donne 5 filons d'or.
  - Le Puits garde les éclats et les pierres d'éveil : les deux modes ne se marchent pas dessus.

Repères (joueur automatique qui évite les obstacles, 20 courses) : 300 à 550 m, 25 à 40 s, une quinzaine de minerais et 5 à 8 pépites par course.

## Technique

- Chiffres dans `frontend/src/app/balance/minecart.ts`.
- Moteur pur dans `minecart/minecart-game.ts` : voies, rangées, chocs, aiguillages.
- Courses du jour, récompense et sauvegarde dans `minecart/minecart-rules.ts`. Clé `mine-explorer.minecart` : record en mètres, jour et courses jouées.
- Boucle de jeu et paiement dans `minecart/minecart.ts`.
- Page `minecart/minecart-page/` : la voie est dessinée en perspective, avec les rails et les traverses en SVG. Les objets sont placés en % selon leur distance, de l'horizon jusqu'au wagonnet.

## Visuels

Livrés par Théo le 14/10/2026 (Gemini) et rangés dans `art-source/aventures/` : `wagonnet.png`, `wagonnet-carte.png`, `chauve-souris.png`, `rail-casse.png`, `eboulement.png` (détourés) et `fond-wagonnet.jpg`. `python art-source/aventures/preparer-wagonnet.py` les recadre et les écrit dans `frontend/public/assets/`. Le fond sert deux fois : en entier, assombri, derrière la page ; et découpé autour des rails pour la voie de course, avec le point de fuite à 34 % de la découpe, comme la perspective de `minecart-page.ts`.

Prompts utilisés, pour refaire une image si besoin (chaque prompt est complet, à coller seul avec l'image de référence indiquée) :

### Wagonnet (vu de dos) · `wagonnet.png`

Référence : `art-source/rocks/zone4.png`.

```
Mobile idle RPG game asset, hand-painted 2D cartoon style matching a chibi dwarf-dragon miner character, NOT a photo, NOT a 3D render: soft painterly shading, thick dark-brown outlines (about 4% of the image width), warm mine palette (wood, iron, copper, lantern light). Single isolated object, centered, no text, no letters, no numbers, no watermark. Solid pure green background #00FF00 filling the whole image, no shadow on the background, no green inside the object. Square image 1024x1024, the object fills about 80% of the width. A small wooden and iron mine cart seen straight from behind, as in an endless runner game, riding on two rails that end at the bottom edge; a cute chibi miner with a yellow helmet and a lamp, seen from the back, sits inside with his arms raised in excitement; a few ore chunks sticking out of the cart. Same art style and colors as the attached reference image.
```

### Fond de course · `wagonnet-fond.png`

Référence : `art-source/backgrounds/zone4.png`.

```
Vertical mobile game background, 9:16 portrait (1080x1920), hand-painted 2D cartoon style, NOT a photo, NOT a 3D render, soft painterly shading, thick dark outlines, cozy lighting, same art direction as a cute chibi idle mining RPG and as the attached reference background. A long mine tunnel seen straight down its axis from behind, like an endless runner game: three parallel rail tracks start wide at the bottom of the image and converge toward a vanishing point at about 14% of the image height, wooden support beams arching over the tunnel at regular intervals, lanterns hanging on the walls, warm light in the distance. No characters, no creatures, no cart, no obstacles on the rails, no text, no UI. The bottom 15% stays simple and dark (buttons go there).
```

### Éboulement · `eboulement.png`

Référence : `art-source/rocks/zone4.png`.

```
Mobile idle RPG game asset, hand-painted 2D cartoon style matching a chibi dwarf-dragon miner character, NOT a photo, NOT a 3D render: soft painterly shading, thick dark-brown outlines (about 4% of the image width). Single isolated object, centered, front view, no text, no letters, no numbers, no watermark. Solid pure green background #00FF00 filling the whole image, no shadow on the background, no green inside the object. Square image 1024x1024, the object fills about 85% of the width. A pile of fallen grey and brown rocks blocking a mine rail track, seen from the front at ground level, flat bottom edge, a little dust cloud on top, clearly dangerous and readable at small size. Same art style and colors as the attached reference image.
```

### Rail cassé · `rail-casse.png`

Référence : `art-source/rocks/zone4.png`.

```
Mobile idle RPG game asset, hand-painted 2D cartoon style matching a chibi dwarf-dragon miner character, NOT a photo, NOT a 3D render: soft painterly shading, thick dark-brown outlines (about 4% of the image width). Single isolated object, centered, no text, no letters, no numbers, no watermark. Solid pure green background #00FF00 filling the whole image, no shadow on the background, no green inside the object. Square image 1024x1024, the object fills about 85% of the width and only the middle third of the height. A short section of mine rail track seen from slightly above, wider than tall: the two iron rails are snapped and twisted upward in the middle, broken wooden sleepers, and a dark hole in the ground between them with a faint orange glow at its edges, clearly dangerous and readable at small size. Same art style and colors as the attached reference image.
```

### Chauve-souris · `chauve-souris.png`

Référence : `art-source/compagnons/chauve-souris.png`.

```
Mobile idle RPG game asset, hand-painted 2D cartoon style matching a chibi dwarf-dragon miner character, NOT a photo, NOT a 3D render: soft painterly shading, thick dark-brown outlines (about 4% of the image width). Single isolated object, centered, front view, no text, no letters, no numbers, no watermark. Solid pure green background #00FF00 filling the whole image, no shadow on the background, no green inside the object. Square image 1024x1024, the object fills about 80% of the width. A mischievous purple cave bat diving toward the viewer with its wings spread wide, small fangs, glowing yellow eyes, a little angry but still cute, readable at small size. Same art style and colors as the attached reference image.
```

### Carte de l'aventure · `wagonnet-carte.png`

Référence : `art-source/aventures/planche-11.png` (les cartes du Campement et du Puits).

```
Mobile idle RPG game asset, hand-painted 2D cartoon style matching a chibi dwarf-dragon miner character, NOT a photo, NOT a 3D render: soft painterly shading, thick dark-brown outlines (about 4% of the image width), warm mine palette (wood, iron, copper, lantern light). Single isolated object, centered, three-quarter view, no text, no letters, no numbers, no watermark. Solid pure green background #00FF00 filling the whole image, no shadow on the background, no green inside the object. Square image 1024x1024, the object fills about 80% of the width. A mine cart racing on a short piece of rail track, tilted forward as if going fast, full of shiny ore and gold nuggets, small speed lines and sparks under the wheels, fun and dynamic. Same art style and colors as the attached reference image.
```
