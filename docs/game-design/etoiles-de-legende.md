# Légende du Cœur du monde et ses étoiles

Demande de Théo (16/10/2026) : avec 20 zones et 5 rangs, la Légende arrivait vers la zone 12 et il ne restait plus rien à viser jusqu'à la zone 20. Le prestige a été écarté : le jeu n'a ni la boucle courte ni les ressources pensées pour ça. Une première version (16/10) mettait cinq étoiles sur la Légende, puis la forme finale en zone 19 ; Théo l'a revue le 17/10 :

- la **Légende de la mine** reste le rang 5 ;
- la **Légende du Cœur du monde** arrive ensuite en 5 étoiles : ★ en zone 12, ★★ en 14, ★★★ en 16, ★★★★ en 18 et ★★★★★ en 20.

## Règles

- Chaque étoile est un rang comme les autres : 3 paliers de missions, des éclats par mission, puis la promotion. L'écran d'évolution compte 9 rangs.
- Le titre affiche les étoiles : « Légende du Cœur du monde ★★★ ».
- Un **halo de lave** brille derrière le mineur dès la première étoile, plus vif à chacune (`mine-scene/miner-aura.ts`).
- **Visuels** (17/10/2026) : portrait et image en pied venus de Gemini, préparés par `art-source/evolutions/preparer-coeur.py`. En attendant une vidéo de frappe utilisable, le mineur s'affiche en image fixe qui s'écrase un peu à chaque coup. Les étoiles sont des icônes (`assets/ui/etoile-pleine.webp` et `etoile-vide.webp`, composant `evolution/rank-stars`), sous le titre et dans l'écran d'évolution.
- Les sauvegardes restent valables : la forme est rangée par son numéro, la Légende garde le sien, et une sauvegarde de la première version au-delà du dernier rang garde le rang le plus haut.

## Objectifs (dernier palier)

| Rang | Zone atteinte | Pioche | Objets forgés | Filons épuisés | Frappe |
|---|---|---|---|---|---|
| ★ | 12 | 25 | 9 000 | 185 | +100 % |
| ★★ | 14 | 26 | 13 000 | 200 | +100 % |
| ★★★ | 16 | 28 | 18 000 | 230 | +100 % |
| ★★★★ | 18 | 30 | 25 000 | 255 | +100 % |
| ★★★★★ | 20 | 30 | 34 000 | 285 | +100 % |

- **Jamais de blocage** : un objectif de zone demande d'**atteindre** la zone, pas de battre son gardien. L'étoile apporte justement la Frappe qui aide à le battre.
- **+100 % par étoile** : à +75 %, le joueur régulier restait bloqué au gardien de la zone 19 et n'atteignait jamais la zone 20, donc jamais la cinquième étoile. Avec +100 %, la Frappe totale passe de ×5 (Légende) à ×162 (★★★★★).
- **Objets forgés** : c'est l'horloge de la fin de partie, car ils montent d'environ 600 par jour même quand le joueur piétine. Les filons, eux, suivent la zone atteinte.
- Les missions rapportent 12 éclats à la première étoile, puis 2 de plus à chaque étoile (20 à la cinquième).

## Ce que dit le simulateur (régulier, 3 tirages, 100 jours)

Avant : bloqué au gardien de la zone 16 dès le jour 28, avec 85 M de Puissance, jusqu'au jour 70.

Après :

| Étape | Jour |
|---|---|
| Légende | 13,4 |
| ★ / ★★ / ★★★ | 18,4 / 25 / 32,7 |
| ★★★★ | 43,7 |
| Zone 19 | 46,5 |
| Zone 20 et ★★★★★ | 66,6 |
| Zone 20 terminée | avant le jour 100 |

Les gardiens des zones 13 à 20 tombent en 7 à 28 s : ils restent un vrai combat, sans mur. La zone 20 est la longue fin de partie (un filon y prend environ 1 h 20).

## Prompts Gemini de la Légende du Cœur du monde

Même méthode que les autres formes (voir [[prompts-gemini]]) : une image par message, et `art-source/evolutions/legende-pied.png` jointe comme référence, pour garder le même personnage. Dépose les résultats dans `art-source/evolutions/` (`coeur-portrait.png`, `coeur-pied.png`) et la vidéo dans `art-source/animations/coeur-frappe.mp4`. Ensuite, `decouper-frappe.py` fabrique l'animation, et `EVOLUTION_VISUALS.heart` dans `loading/game-assets.ts` pointe vers les nouveaux fichiers.

### Description commune (à coller en tête du portrait et de l'image en pied)

Version du 17/10/2026. Référence à joindre : **le nouvel Apprenti** (`art-source/evolutions/apprenti-v2-pied.png`, l'image au casque jaune refaite dans le style de l'écran de lancement), et non plus `legende-pied.png`. Les versions précédentes tassaient le personnage (grande couronne, noyau flottant) puis sortaient lisses et trop saturées : le style usé de l'Apprenti, ses proportions et le cœur serti dans le plastron sont maintenant imposés.

```
Use the attached image as the strict reference for the ART STYLE, the character's species, face, body proportions and size. Draw in exactly the same style as the attached image: hand-painted 2D cartoon with a gritty, weathered look, visible brush texture, dirt stains, scratches and worn edges on every material, rough dark-brown outlines of varying thickness, muted earthy palette with low saturation, matte surfaces, warm soft lighting. NOT glossy, NOT clean vector art, NOT neon, NOT oversaturated. Keep EXACTLY the same proportions as the reference: same head size, same body height, same leg length, standing straight, not squashed, not stretched. Exactly ONE character in ONE image.

Character: the same cute chibi dwarf-dragon miner: blue-grey scaly skin with orange spots, large amber eyes, short snout, thick tail with an orange tip and small dark spikes, three-quarter view facing right.

Form: "Legend of the World's Heart", the ultimate form, the miner who reached the molten core of the planet and carries it in his chest. Epic but still cute, and it must look like the same game as the reference.
- The World's Heart: a round gem the size of his fist, set in the center of his chestplate like a heart: a tiny planet of molten gold and orange lava in a scratched gold setting, with a soft warm glow. Nothing floats above his head.
- Armor: worn black obsidian plates with chipped edges and dull gold trims, thin lines of molten gold in the cracks leading to the heart gem, a few engraved runes. Matte, battle-worn, not shiny.
- Head: his miner helmet turned into a low crown: a dented dark helmet with a brass headlamp and a short row of small dull crystal shards (amber, ruby, sapphire, amethyst) on top, no taller than one third of the head height.
- Back: a short tattered cape, dark night blue fading into dark red-orange at the hem like cooling lava; his backpack is still there with a rolled red blanket.
- Body: a few orange spots on the scales glow faintly; the tail tip looks like a warm ember.
- Expression: calm, proud and kind, a confident little smile.
- Every glow is warm, soft and small, close to the character: no green in any glow, no light rays.

No text, no letters, no logo, no watermark, no scenery, no ground, no shadow, no floating objects, no particles. Solid pure green background #00FF00 filling the whole image, no green on the character.
```

### Portrait (cadre rond en haut à gauche)

```
Framing: bust portrait, head, helmet-crown, shoulders and the top of the chestplate with the heart gem visible, centered, square 1:1, the face fills half of the image.
```

### En pied (référence de la vidéo de frappe)

```
Framing: full body, same pose as the reference: standing in a mining stance, one hand gripping the pickaxe handle in front of him, the pickaxe head on the right side at shoulder height. The pickaxe: a worn dark obsidian handle with brass bands, its head a double-pointed pick of dark magma rock with glowing orange cracks, same size as the reference pickaxe. Feet slightly apart at the bottom of the image, square 1:1, the character fills 85% of the image height, some empty space on the right for the swing.
```

Si le corps sort encore tassé, ajouter dans le même message : `Same character but taller body and longer legs, exactly the proportions of the first attached image.`

### Vidéo du coup de pioche

La première vidéo (17/10/2026) zoomait sur le personnage : casque et pieds sortaient du cadre, inutilisable pour l'animation. Image de départ à joindre : `art-source/animations/coeur-depart-16x9.png`, l'image en pied posée sur un fond vert 16:9 où le personnage n'occupe que 62 % de la hauteur (fabriquée par `preparer-coeur.py`). La consigne de cadrage est en tête du prompt.

```
Animate the attached image exactly as framed: the camera never moves, never zooms in, never pans, never crops. The whole character, from the top of the helmet crystals to the soles of the boots, stays fully visible in every frame with a wide empty green margin above the head and below the feet, at exactly the size and position of the attached image. 16:9. Solid pure green background #00FF00 for the whole video, no ground, no shadow, no scenery.

Action: one single powerful pickaxe strike. The character starts in the idle mining stance of the image and breathes for half a second, the heart gem in his chest pulsing softly. Then he raises the pickaxe high above his head with both hands, the cape and the tail lift a little. He swings it down hard in front of him, to the right, and the pickaxe head hits the ground level near his feet with a small bounce of the body, the heart gem flashing brighter. At the impact, a short burst of golden sparks, small glowing magma chips and tiny crystal shards flies to the right and fades quickly. He pulls the pickaxe back up and returns to exactly the starting pose, then stays still and breathes until the end of the video.

Only one strike in the whole video, no second swing. Keep the same face, outfit, colors, proportions and hand-painted cartoon style as the image in every frame. All glows stay warm and close to the character, never green. No text, no extra character.
```
