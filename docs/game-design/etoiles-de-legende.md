# Légende du Cœur du monde et ses étoiles

Demande de Théo (16/10/2026) : avec 20 zones et 5 rangs, la Légende arrivait vers la zone 12 et il ne restait plus rien à viser jusqu'à la zone 20. Le prestige a été écarté : le jeu n'a ni la boucle courte ni les ressources pensées pour ça. Une première version (16/10) mettait cinq étoiles sur la Légende, puis la forme finale en zone 19 ; Théo l'a revue le 17/10 :

- la **Légende de la mine** reste le rang 5 ;
- la **Légende du Cœur du monde** arrive ensuite en 5 étoiles : ★ en zone 12, ★★ en 14, ★★★ en 16, ★★★★ en 18 et ★★★★★ en 20.

## Règles

- Chaque étoile est un rang comme les autres : 3 paliers de missions, des éclats par mission, puis la promotion. L'écran d'évolution compte 9 rangs.
- Le titre affiche les étoiles : « Légende du Cœur du monde ★★★ ».
- Un **halo de lave** brille derrière le mineur dès la première étoile, plus vif à chacune (`mine-scene/miner-aura.ts`). En attendant ses propres images (prompts plus bas), la forme reprend celles de la Légende.
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

Version du 17/10/2026. La première version tassait le personnage (grande couronne et noyau flottant au-dessus de la tête) : les proportions de la Légende sont maintenant imposées, la couronne est basse, et le cœur du monde est serti dans le plastron, à la demande de Théo.

```
Use the attached image as the strict reference for the character's species, face, body proportions and size. Keep EXACTLY the same proportions as the reference: same head size, same body height, same leg length, about 2.5 heads tall, standing straight. The character must not look squashed, stretched, shorter or wider than the reference. Exactly ONE character in ONE image.

Character: the same cute chibi dwarf-dragon miner: blue-grey scaly skin with orange spots, large amber eyes, short snout, thick tail with small dark spikes, three-quarter view facing right. Hand-painted 2D cartoon style, soft painterly shading, rich textures, thick dark-brown outlines, small highlights in the eyes.

Form: "Legend of the World's Heart", the ultimate form, the miner who reached the molten core of the planet and carries it in his chest. Epic but still cute and readable at small size.
- The World's Heart: a round glowing gem the size of his fist, set in the center of his chestplate like a heart: a tiny planet of swirling molten gold and orange lava, held by a gold setting with a thin golden ring around it. It is the brightest point of the character. Nothing floats above his head.
- Armor: polished black obsidian plates with molten gold seams that glow softly and all lead to the heart gem, small engraved star and mountain runes, gold trims, same armor shapes as the reference.
- Head: a LOW and compact crown-helmet in black obsidian and gold, with a short row of small rainbow crystal shards (amber, ruby, sapphire, amethyst) no taller than one third of the head height.
- Back: a short cape that turns from deep night blue with tiny stars at the top into flowing molten lava at its hem; two small wings made of amber crystal feathers, close to the back.
- Body: the orange spots on the scales glow warm gold; the tail tip is a small glowing chunk of molten core with tiny crystal spikes.
- Expression: calm, proud and kind, a confident little smile.
- Every glow is warm (gold, orange, amber, white) and stays tight around the character: no green in any glow, no light rays reaching the edges of the image.

No text, no letters, no logo, no watermark, no scenery, no ground, no shadow, no floating objects, no particles far from the character. Solid pure green background #00FF00 filling the whole image, no green on the character.
```

### Portrait (cadre rond en haut à gauche)

```
Framing: bust portrait, head, crown, shoulders and the top of the chestplate with the glowing heart gem visible, centered, square 1:1, the face fills half of the image.
```

### En pied (référence de la vidéo de frappe)

```
Framing: full body, same pose as the reference: standing in a mining stance, BOTH hands gripping the handle of the World's Heart pickaxe held diagonally across the body, the pickaxe head on the right side at shoulder height. The pickaxe: a black obsidian handle wrapped in gold, its head a double-pointed pick of glowing magma crystal, same size as the reference pickaxe. Feet slightly apart at the bottom of the image, square 1:1, the character fills 85% of the image height, some empty space on the right for the swing.
```

Si le corps sort encore tassé, ajouter dans le même message : `Same character but taller body and longer legs, exactly the proportions of the first attached image.`

### Vidéo du coup de pioche (joins l'image en pied comme image de départ)

```
Animate the attached character. Camera completely fixed, no zoom, no pan, 16:9, the character stays at the same size, the same proportions and the same place in the frame, centered. Solid pure green background #00FF00 for the whole video, no ground, no shadow, no scenery.

Action: one single powerful pickaxe strike. The character starts in the idle mining stance of the image and breathes for half a second, the heart gem in his chest pulsing softly. Then he raises the pickaxe high above his head with both hands, the crystal wings open a little and the cape lifts. He swings it down hard in front of him, to the right, and the pickaxe head hits the ground level near his feet with a small bounce of the body, the heart gem flashing brighter. At the impact, a short burst of golden sparks, small glowing magma chips and tiny crystal shards flies to the right and fades quickly. He pulls the pickaxe back up and returns to exactly the starting pose, then stays still and breathes until the end of the video.

Only one strike in the whole video, no second swing. Keep the same face, outfit, colors, proportions and hand-painted cartoon style as the image in every frame. All glows stay warm and close to the character, never green. No text, no extra character.
```
