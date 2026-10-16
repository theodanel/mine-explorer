# Étoiles de Légende et Légende du Cœur du monde

Demande de Théo (16/10/2026) : avec 20 zones et 5 rangs, la Légende arrivait vers la zone 12 et il ne restait plus rien à viser jusqu'à la zone 20. Choix retenu : des **étoiles de Légende**, puis une **forme finale**. Le prestige a été écarté : le jeu n'a ni la boucle courte ni les ressources pensées pour ça.

## Règles

- Après la Légende de la mine viennent 5 étoiles (★ à ★★★★★), puis la **Légende du Cœur du monde**. Ce sont des rangs comme les autres : 3 paliers de missions, des éclats par mission, puis la promotion. L'écran d'évolution compte donc 10 rangs.
- Les étoiles gardent le visuel de la Légende. Le mineur gagne un **halo doré** derrière lui, plus vif à chaque étoile (`mine-scene/miner-aura.ts`). La forme finale a un halo de lave, en attendant ses propres images (prompts plus bas).
- Le titre affiche les étoiles : « Légende de la mine ★★★ ».
- Les sauvegardes restent valables : la forme est rangée par son numéro, et les nouveaux rangs viennent après la Légende.

## Objectifs (dernier palier)

| Rang | Zone atteinte | Pioche | Objets forgés | Filons épuisés | Frappe |
|---|---|---|---|---|---|
| ★ | 13 | 25 | 7 500 | 190 | +50 % |
| ★★ | 14 | 26 | 10 000 | 200 | +50 % |
| ★★★ | 15 | 27 | 13 000 | 215 | +50 % |
| ★★★★ | 16 | 28 | 16 500 | 230 | +50 % |
| ★★★★★ | 17 | 30 | 21 000 | 245 | +50 % |
| Légende du Cœur du monde | 19 | | 28 000 | 275 | +100 % |

- **Jamais de blocage** : un objectif de zone demande d'**atteindre** la zone, pas de battre son gardien. L'étoile apporte justement la Frappe qui aide à le battre. La forme finale se gagne en zone 19, et son bonus sert à finir la zone 20.
- **Objets forgés** : c'est l'horloge de la fin de partie, car ils montent d'environ 600 par jour même quand le joueur piétine. Les filons, eux, suivent la zone atteinte.
- Chaque étoile rapporte 12 éclats par mission, la forme finale 20.

## Ce que dit le simulateur (régulier, 3 tirages, 100 jours)

Avant : bloqué au gardien de la zone 16 dès le jour 28, avec 85 M de Puissance, jusqu'au jour 70.

Après :

| Étape | Jour |
|---|---|
| Légende | 13,4 |
| ★ / ★★ / ★★★ | 16 / 20 / 25 |
| ★★★★ / ★★★★★ | 30,5 / 37,5 |
| Zone 19 | 51,7 |
| Légende du Cœur du monde | 62,4 |
| Zone 20 | 78,6 |

Les gardiens des zones 13 à 19 tombent en 5 à 28 s : ils restent un vrai combat, sans mur. Au jour 100, le joueur régulier est en zone 20, filon 7 ou 8 sur 15 (un filon prend alors environ 1 h 50). La zone 20 reste la très longue fin de partie.

## Prompts Gemini de la Légende du Cœur du monde

Même méthode que les autres formes (voir [[prompts-gemini]]) : une image par message, et `art-source/evolutions/legende-pied.png` jointe comme référence, pour garder le même personnage. Dépose les résultats dans `art-source/evolutions/` (`coeur-portrait.png`, `coeur-pied.png`) et la vidéo dans `art-source/animations/coeur-frappe.mp4`. Ensuite, `decouper-frappe.py` fabrique l'animation, et `EVOLUTION_VISUALS.heart` dans `loading/game-assets.ts` pointe vers les nouveaux fichiers.

### Description commune (à coller en tête de chaque prompt)

```
Use the attached image as the strict reference for the character's species, face and proportions. The character is the same cute chibi dwarf-dragon miner: small round body, big head, blue-grey scaly skin with orange spots, large amber eyes, short snout, thick tail with small dark spikes, three-quarter view facing right. Hand-painted 2D cartoon style, soft painterly shading, rich textures, thick dark-brown outlines, small highlights in the eyes. Exactly ONE character in ONE image.

Form: "Legend of the World's Heart", the ultimate form, the miner who reached the molten core of the planet and became one with it. Epic but still cute and readable at small size.
- Armor: polished black obsidian plates with molten gold seams that glow softly, small engraved star and mountain runes, gold trims.
- Head: a crown-shaped helmet made of rainbow crystal shards (amber, ruby, sapphire, amethyst), and floating just above it a tiny glowing planet core: a small sphere of swirling molten gold and orange light with a thin golden ring around it, like a miniature sun.
- Back: a short cape that turns from deep night blue with tiny stars at the top into flowing molten lava at its hem; two small wings made of glowing amber crystal feathers.
- Body: the orange spots on the scales glow warm gold; the tail tip is a glowing chunk of molten core with small crystal spikes.
- Expression: calm, proud and kind, a confident little smile, eyes with a golden spark.
- Every glow is warm (gold, orange, amber, white) and stays tight around the character: no green in any glow, no light rays reaching the edges of the image.

No text, no letters, no logo, no watermark, no scenery, no ground, no shadow, no particles far from the character. Solid pure green background #00FF00 filling the whole image, no green on the character.
```

### Portrait (cadre rond en haut à gauche)

```
Framing: bust portrait, head, crown, floating core and shoulders, centered, square 1:1, the face fills half of the image.
```

### En pied (référence de la vidéo de frappe)

```
Framing: full body, standing in a mining stance, both hands gripping the World's Heart pickaxe: a black obsidian handle wrapped in gold, its head a double-pointed pick of glowing magma crystal with three small rocks orbiting it. The pickaxe head is on the right side at shoulder height, feet slightly apart at the bottom of the image, square 1:1, the character fills 85% of the image height, some empty space on the right for the swing.
```

### Vidéo du coup de pioche (joins l'image en pied comme image de départ)

```
Animate the attached character. Camera completely fixed, no zoom, no pan, 16:9, the character stays at the same size and the same place in the frame, centered. Solid pure green background #00FF00 for the whole video, no ground, no shadow, no scenery.

Action: one single powerful pickaxe strike. The character starts in the idle mining stance of the image and breathes for half a second, the floating core above his head slowly spinning. Then he raises the pickaxe high above his head with both hands, the crystal wings open a little and the cape lifts. He swings it down hard in front of him, to the right, and the pickaxe head hits the ground level near his feet with a small bounce of the body. At the impact, a short burst of golden sparks, small glowing magma chips and tiny crystal shards flies to the right and fades quickly. He pulls the pickaxe back up and returns to exactly the starting pose, then stays still and breathes until the end of the video, the core still spinning.

Only one strike in the whole video, no second swing. Keep the same face, outfit, colors and hand-painted cartoon style as the image in every frame. All glows stay warm and close to the character, never green. No text, no extra character.
```
