# Prompts Gemini pour l'interface

Ces visuels remplaceront les boutons et cadres dessinés en CSS. Les prompts sont en anglais, parce que les générateurs d'images le suivent plus fidèlement. Pour chaque image, colle d'abord le bloc « Style commun », puis le prompt de l'élément. Dépose les résultats dans `art-source/ui/` : je les détourerai et les brancherai.

## Style commun (à coller en tête de chaque prompt)

```
Mobile idle RPG game UI asset, hand-painted 2D style matching a chibi dwarf-dragon miner character: soft painterly shading, thick dark-brown outlines (about 4% of the image width), warm mine palette (wood, stone, copper, lantern light). Single isolated object, centered, front view, no perspective, no text, no letters, no numbers, no watermark. Solid pure green background #00FF00 filling the whole image, no shadow on the background, no green inside the object.
```

## Boutons (fond vide, sans texte : j'ajoute le texte en code)

**Bouton vert « action »**

```
A wide horizontal game button, 3:1 ratio, rounded rectangle, glossy emerald-green painted face with a light highlight band on the top third, darker green bottom edge giving thickness, thick dark-brown outline, small wooden corner brackets with tiny iron rivets. Empty face, no icon.
```

**Bouton bois « secondaire »**

```
A wide horizontal game button, 3:1 ratio, rounded rectangle made of polished oak planks with visible wood grain, iron bands on the left and right ends with rivets, lighter top edge, darker bottom edge giving thickness, thick dark-brown outline. Empty face, no icon.
```

**Bouton rouge « défier le boss »**

```
A wide horizontal game button, 3:1 ratio, rounded rectangle, glossy crimson painted face with a highlight band on the top third, darker red bottom edge giving thickness, cracked rock texture on the edges, small glowing ember particles at the corners, thick dark-brown outline. Empty face, no icon.
```

**Bouton rond « fermer »**

```
A round game close button, glossy red disc with a light highlight at the top left, thick dark-brown outline, a bold cream-colored X carved in the middle.
```

## Cadres

**Cadre de fenêtre (modale)**

```
An empty vertical game window frame, 3:4 ratio, made of dark wooden planks with a thick carved oak border, iron corner plates with rivets, a small lantern hanging on the top center of the frame. The inside of the frame is a flat dark-brown panel (#2A1B10), plain, so text can be placed on it.
```

**Case d'équipement vide**

```
A square equipment slot tile, rounded corners, thick dark wooden border with small iron corner rivets, slightly recessed dark-brown inner panel with subtle stone texture. Empty, no item inside.
```

**Socle de coût**

```
A small horizontal wooden plaque, 3:1 ratio, rounded ends, dark oak with two iron nails on the sides, slightly worn edges, thick dark-brown outline. Empty face.
```

## Icônes des 10 paliers de matériaux

Une icône par palier : un petit lingot ou minerai du matériau. Elles s'affichent dans la table « Probabilités de forge » et sur les cases d'équipement.

```
A small chunk of raw {MATERIAL} ore, chunky and readable at 64 px, {DESCRIPTION}.
```

Remplace `{MATERIAL}` et `{DESCRIPTION}` pour chaque palier :

| Palier | {MATERIAL} | {DESCRIPTION} |
|---|---|---|
| Bois | wood | a cut log section with visible rings and bark |
| Pierre | stone | a grey rough cobblestone with a few cracks |
| Cuivre | copper | orange metallic copper nugget with green patina spots |
| Fer | iron | dark grey metallic iron ingot with a cold blue sheen |
| Acier | steel | polished blue-steel ingot with a bright reflection |
| Or | gold | shiny gold nugget with sparkles |
| Mithril | mithril | pale silver-teal ingot glowing softly, elven engraving lines |
| Cristal | crystal | cluster of violet translucent crystals glowing from inside |
| Magma | magma | black volcanic rock with glowing orange lava cracks |
| Divin | divine | white-gold radiant gem floating with a soft halo and tiny star sparkles (no green in the halo) |

Conseil : génère chaque image en 1024 px de large. Le halo du palier Divin risque de se mélanger au fond vert, comme celui de la Forge : si c'est le cas, demande une version sans halo, je le recrée en CSS.

## Fonds des zones 2 à 10

Même format et même style que `zone1.png`. Le thème suit les paliers de matériaux : plus le joueur descend, plus la mine devient précieuse et étrange. Contrairement aux icônes, **pas de fond vert** : c'est un décor plein écran.

### Cadre commun (à coller en tête de chaque prompt de zone)

```
Vertical mobile game background, 9:16 portrait (1080x1920), hand-painted 2D cartoon style, soft painterly shading, thick dark outlines, warm cozy lighting, same art direction as a cute chibi idle mining RPG. Side-view underground mine scene with no characters, no creatures, no text, no UI. Composition rules: a flat walkable rocky floor running across the full width at about 66% of the image height; the area just above the floor in the center is clear so a small character can stand there; the top 15% is darker and less detailed (a title bar goes there); the left and right edges between 20% and 55% height stay simple (equipment slots go there); the bottom 30% is plain dark ground (menus cover it).
```

### Prompts par zone

**Zone 2 · Pierre**

```
Theme: a grey stone quarry deep in the mine. Big cut stone blocks stacked on the sides, wooden scaffolding and a pulley with a rope, chisel marks on the walls, dust in the air, one warm oil lantern hanging from a beam.
```

**Zone 3 · Cuivre**

```
Theme: a narrow gallery with shiny orange copper veins running through brown rock, green patina stains, small copper nuggets on the floor, timber supports, a lantern glowing warm orange.
```

**Zone 4 · Fer**

```
Theme: an iron mine with rails on the floor and an old mine cart full of dark grey ore, riveted iron support beams, a cold blue-grey tint in the rock, sparks of light from a hanging lamp.
```

**Zone 5 · Acier**

```
Theme: an underground dwarven forge hall carved in the rock, anvils, a big furnace glowing in the background, chains, steel ingots stacked on shelves, embers floating in the air.
```

**Zone 6 · Or**

```
Theme: a cavern full of thick gold veins and scattered gold nuggets, a small treasure chest half buried in the rock, golden reflections everywhere, warm sparkles.
```

**Zone 7 · Mithril**

```
Theme: ancient elven ruins buried underground, carved stone arches covered with glowing silver-teal runes, pale teal mithril veins in the walls, soft mystical light.
```

**Zone 8 · Cristal**

```
Theme: a crystal cave with huge violet and pink translucent crystals growing from the walls and ceiling, glowing from inside, small floating light particles, cool purple atmosphere.
```

**Zone 9 · Magma**

```
Theme: a volcanic cavern with black basalt rock, glowing orange lava rivers flowing behind the floor ledge, lava cracks in the walls, heat haze and floating embers, red-orange lighting.
```

**Zone 10 · Divin**

```
Theme: a celestial underground sanctuary, white marble and gold rock formations, a beam of warm divine light falling from a crack in the ceiling, floating golden particles, small star-shaped gems in the walls.
```

Dépose chaque image dans `art-source/backgrounds/` sous le nom `zone2.png`, `zone3.png`… Je les optimiserai et je les brancherai selon la zone en cours.

## Rochers des zones (le filon que frappe le mineur)

Un rocher par zone, posé au sol à droite du mineur, là où tombe la pioche. Il doit se lire d'un coup d'œil sur le décor de sa zone, sans le cacher : un bloc trapu, plus large que haut, d'environ la moitié de la taille du mineur. Fond vert comme les icônes (je le détoure). Colle d'abord le bloc « Style commun » plus haut, puis ce cadre commun, puis le thème de la zone.

### Cadre commun (à coller après le « Style commun »)

```
A single mineable ore boulder for a side-view mining game, seen from the front at floor level, sitting flat on the ground (flat bottom edge, no ground, no shadow, no debris around it). Chunky and readable silhouette, about 1.3 times wider than tall, filling 85% of the image width, centered. Square image 1024x1024. The ore veins and crystals are embedded in the rock, clearly visible, as if the miner will chip them out. Same framing, size and lighting for every boulder of the series, light coming from the top left.
```

### Thème par zone

**Zone 1 · Bois** : `Rock: a rounded brown earth-and-clay boulder with tangled tree roots, splinters of old wood stuck in it and a few small grey pebbles.`

**Zone 2 · Pierre** : `Rock: a grey granite block with sharp chisel-cut facets, white quartz specks and fine cracks.`

**Zone 3 · Cuivre** : `Rock: a brown rock boulder with shiny orange copper veins and two or three small copper nuggets, light green patina stains.`

**Zone 4 · Fer** : `Rock: a dark blue-grey boulder with heavy rust-red iron ore streaks and metallic dark grey lumps.`

**Zone 5 · Acier** : `Rock: a dark slate boulder with polished steel-grey metal plates and bright silver ore veins, a faint warm forge glow on its edges.`

**Zone 6 · Or** : `Rock: a warm sandstone boulder packed with thick shiny gold veins and big gold nuggets, tiny sparkles.`

**Zone 7 · Mithril** : `Rock: a pale stone boulder with glowing silver-teal mithril veins and a few faint carved rune marks.`

**Zone 8 · Cristal** : `Rock: a dark purple stone boulder with large translucent violet and pink crystals growing out of it, glowing softly from inside.`

**Zone 9 · Magma** : `Rock: a black basalt boulder split by glowing orange lava cracks, small embers, a red-hot core visible in the cracks.`

**Zone 10 · Divin** : `Rock: a white marble boulder with golden veins and small star-shaped glowing gems, a soft warm divine aura.`

Dépose chaque image dans `art-source/rocks/` sous le nom `zone1.png` à `zone10.png`. Je les détoure et je les range dans `frontend/public/assets/rocks/zone1.webp`… : le jeu les affiche dès qu'elles sont là, sans autre changement. En attendant, la barre de vie flotte seule à l'emplacement du rocher.

Si tu veux aller plus loin plus tard, on pourra demander pour chaque rocher deux variantes fissurées (« same boulder, same framing, with a few cracks » puis « with deep cracks, a chunk missing ») pour montrer l'usure au fil des coups.

## Pioches (une par palier)

Toutes les pioches doivent avoir exactement le même cadrage et le même angle : le jeu les place dans la main du mineur en suivant son mouvement. Colle le bloc commun, puis la ligne du palier.

```
Mobile idle RPG game item, hand-painted 2D cartoon style matching a chibi mining RPG: soft painterly shading, thick dark-brown outlines, warm lighting. A single mining pickaxe, isolated, centered. Exact framing for every variant: square 1:1 image, the pickaxe rotated 45 degrees with the head at the top-right and the handle end at the bottom-left, the whole tool fills 80% of the image diagonal, the handle is straight and the grip area is the lower third of the handle. Flat front view, no perspective, no hand, no character, no text, no shadow on the background. Solid pure green background #00FF00 filling the whole image, no green on the pickaxe.
```

| Palier | Ligne à ajouter |
|---|---|
| Bois | `Material: a crude pickaxe with a sharpened wooden head tied with rope to a rough branch handle.` |
| Pierre | `Material: a primitive pickaxe with a chipped grey flint stone head bound with leather straps to a wooden handle.` |
| Cuivre | `Material: a copper pickaxe, shiny orange metal head with green patina spots, oak handle with copper rings.` |
| Fer | `Material: a sturdy dark grey iron pickaxe with rivets, cold blue sheen, leather-wrapped grip.` |
| Acier | `Material: a polished blue-steel pickaxe with a sharp beveled edge and engraved lines, steel-reinforced handle.` |
| Or | `Material: a golden pickaxe with ornate engravings and a small ruby on the head, dark wood handle with gold caps.` |
| Mithril | `Material: an elegant pale silver-teal mithril pickaxe with elven curved blades and softly glowing teal runes.` |
| Cristal | `Material: a pickaxe whose head is a cluster of violet translucent crystals glowing from inside, silver handle.` |
| Magma | `Material: a black volcanic rock pickaxe with glowing orange lava cracks and small embers, obsidian handle.` |
| Divin | `Material: a radiant white-gold pickaxe with a floating star gem, delicate wing-shaped details, soft golden glow kept close to the metal (no green in the glow).` |

## Évolutions du mineur

Chaque forme demande trois images : le portrait (cadre rond en haut à gauche), le personnage en pied (référence à donner à SpriteShip pour l'animation de frappe) et la même pose les mains vides (pour y placer la pioche en jeu). Gemini fait des images fixes, l'animation se génère ensuite dans SpriteShip à partir de l'image en pied.

### Description du personnage (à coller dans chaque prompt d'évolution)

```
Character: the same cute chibi dwarf-dragon miner in every image: small round body, big head, blue-grey scaly skin with orange spots, large amber eyes, short snout, a thick tail with an orange tip and small dark spikes, three-quarter view facing right. Hand-painted 2D cartoon style, soft painterly shading, thick dark-brown outlines, warm lighting. No text, no background scenery. Solid pure green background #00FF00 filling the whole image, no green on the character.
```

### Les trois cadrages (à ajouter après la forme)

- **Portrait** : `Framing: bust portrait, head and shoulders, centered, square 1:1, the face fills half of the image.`
- **En pied** : `Framing: full body, standing in a mining stance holding a pickaxe in both hands, feet at the bottom of the image, square 1:1, the character fills 85% of the image height.`
- **Mains vides** : `Framing: exactly the same full body pose and position as the mining stance, but both hands are empty and closed as if gripping an invisible handle, no tool at all, square 1:1, the character fills 85% of the image height.`

### Les formes

**1. Apprenti (départ, zones 1 à 4)**

```
Form: apprentice miner. Simple yellow plastic mining helmet with a small round headlamp, red scarf, beige shirt, brown leather gloves and boots, small brown backpack with a red rolled blanket. Humble, slightly scruffy, cheerful.
```

**2. Mineur (zone 5)**

```
Form: experienced miner, a bit taller and more confident. Dented yellow helmet with copper trims and a brighter lamp, copper goggles pushed on the helmet, thick leather apron with pockets, bigger backpack with ropes and a lantern hanging from it, reinforced boots with copper toe caps.
```

**3. Contremaître (zone 7)**

```
Form: mine foreman, proud and sturdy. Steel-plated helmet with two headlamps, iron shoulder pads and chest plate over a leather jacket, utility belt with small tools and a pocket watch, heavy steel-toed boots, small iron horns starting to grow on the head.
```

**4. Maître des profondeurs (zone 9)**

```
Form: master of the depths, wise and powerful. Mithril helmet with a glowing crystal instead of a lamp, flowing dark blue cape with silver mining runes, mithril armor with teal glowing lines, crystal shards growing on the tail spikes, longer curved horns, calm confident expression.
```

**5. Légende de la mine (zone 11)**

```
Form: legendary mine guardian, majestic. White-gold divine armor with star engravings, a radiant halo-like lamp above the helmet, glowing golden runes on the scales, small luminous wings on the back, tail tip glowing like molten gold, heroic expression. Keep any glow close to the body (no green in the glow).
```

### Conseils

- Génère d'abord l'Apprenti en pied, puis donne cette image à Gemini comme référence pour toutes les autres : c'est le meilleur moyen de garder le même personnage.
- Pour les pioches, génère d'abord celle en Bois, puis demande les autres « en gardant exactement le même cadrage et le même angle que l'image jointe ».
- Dépose les fichiers dans `art-source/evolutions/` (`apprenti-portrait.png`, `apprenti-pied.png`, `apprenti-mains-vides.png`…) et `art-source/pioches/` (`bois.png`, `pierre.png`…).

## Variantes d'équipement et d'outils

Pour décliner le même personnage avec d'autres tenues et d'autres outils de minage, sans qu'il change de visage, de pose ou de style. Quand on lui demande « 5 designs de plus », Gemini dérive : il fait une grille, change la pose (à genoux, clin d'œil), retire le casque ou invente des outils hors sujet (une loupe). Le prompt ci-dessous verrouille tout, sauf ce que tu choisis de changer.

### Prompt principal (une image par message, image de référence jointe)

Joins toujours l'image en pied du personnage de départ (par exemple `art-source/evolutions/apprenti-pied.png`), puis colle ce prompt en remplaçant les deux lignes entre crochets.

```
Use the attached image as the strict reference for the character. Generate exactly ONE image containing exactly ONE character: this same character, with the same species, face, large amber eyes, short snout, blue-grey scaly skin with orange spots, body proportions, tail with orange tip and small dark spikes, size and art style (hand-painted 2D cartoon, soft painterly shading, thick dark-brown outlines, warm lighting).

Pose and framing identical to the reference: full body, standing upright, three-quarter view facing right, both hands gripping the tool, the tool head on the right side at shoulder height, feet at the bottom of the image, square 1:1, the character fills 85% of the image height. Same cheerful expression, both eyes open. Do not kneel, crouch, jump or turn away.

Change ONLY the two elements below. Everything else stays exactly as in the reference.
Tool: [TOOL]
Outfit: [OUTFIT]

Rules: the tool is a real tool for breaking or digging rock in a mine, never a weapon, never a magnifying glass or any unrelated object. The character always wears a protective helmet with a light source. No character sheet, no grid, no second pose, no turnaround. No text, no letters, no logo, no watermark, no background scenery, no ground, no shadow. Solid pure green background #00FF00 filling the whole image, no green on the character, the tool or any glow.
```

Pour la variante suivante, dans la même conversation (renvoie l'image de référence si Gemini commence à dériver) :

```
Same character, same pose, same framing and same rules as the reference image. Exactly one image with one character. Change ONLY:
Tool: [TOOL]
Outfit: [OUTFIT]
```

### Planche unique (tous les visuels sur une image)

Pour voir les 10 paliers d'un coup. Joins l'image de référence. Chaque case est plus petite qu'une image seule : c'est parfait pour choisir un design, puis je découpe les cases ou tu régénères en grand celles que tu gardes.

```
Use the attached image as the strict reference for the character. Generate ONE single wide image, 5:2 ratio, showing a character lineup: the same character 10 times, arranged in 2 rows of 5, evenly spaced, every copy at exactly the same size, all feet aligned on the same invisible baseline in each row, no overlap between copies.

Every copy keeps exactly the same species, face, large amber eyes, short snout, blue-grey scaly skin with orange spots, body proportions, tail with orange tip and small dark spikes, and the same art style as the reference (hand-painted 2D cartoon, soft painterly shading, thick dark-brown outlines, warm lighting). Every copy has exactly the same pose: full body, standing upright, three-quarter view facing right, both hands gripping the tool, the tool head on the right side at shoulder height, cheerful expression, both eyes open. Nobody kneels, crouches, jumps, winks or turns away.

Only the tool and the outfit change, progressing from humble to legendary, left to right then top to bottom:
1. Wood: crude pickaxe of sharpened hardwood tied with rope; simple yellow work helmet with a small lamp, patched linen shirt, rope belt, cloth gloves, worn boots.
2. Stone: double-pointed pick of chipped grey flint bound with leather; rough leather helmet with a candle lamp, hide vest with stone beads, fur-lined gloves and boots.
3. Copper: mattock of shiny copper with green patina spots; yellow helmet with copper trims, copper goggles, leather apron with copper rivets, copper toe-capped boots.
4. Iron: heavy two-handed sledgehammer of dark riveted iron; riveted iron helmet with a round headlamp, iron shoulder pads over a leather jacket, iron-plated gloves.
5. Steel: hammer-pick of polished blue steel with engraved lines; blue-steel helmet with two headlamps, steel chest plate, steel gauntlets, utility belt with small tools.
6. Gold: ornate golden pickaxe with a small ruby; golden helmet with a ruby-set lamp, gold-trimmed dark leather armor, gold rings on the tail spikes.
7. Mithril: elegant curved pick of pale silver-teal mithril with glowing teal runes; mithril helmet with a teal crystal lamp, light mithril armor, short dark blue cape with silver runes.
8. Crystal: slender crystal-cutting pick of translucent violet crystal; helmet with a violet crystal lamp, armor covered with small violet crystal growths, crystal shards on the tail spikes.
9. Magma: black volcanic rock sledgehammer with glowing orange lava cracks; black obsidian helmet with a lava-glow lamp, volcanic armor with orange glowing cracks.
10. Divine: radiant white-gold pickaxe with a small floating star gem; white-gold helmet with a star lamp, white-gold armor with star engravings, small luminous wings on the backpack.

Every tool is a real tool for breaking rock in a mine, never a weapon or an unrelated object. Every copy wears a protective helmet with a light source. Keep all glows close to the objects. No text, no labels, no numbers, no letters, no watermark, no background scenery, no ground, no shadow, no frames or dividing lines. Solid pure green background #00FF00 filling the whole image, no green on the characters, the tools or any glow.
```

Si Gemini rate des cases (doublons, ordre mélangé, perso qui change), passe à 2 rangées de 3 avec les paliers 1 à 6, puis une deuxième planche pour 7 à 10 : au-delà de 6 personnages, les générateurs perdent souvent la cohérence.

### Planche de 20 : 10 personnages et 10 outils

Le mineur en 10 looks de plus en plus puissants (toujours des tenues de mineur) et 10 outils de minage, pour trouver des idées d'évolutions, d'apparences et d'objets.

```
Use the attached image as the style and species reference. Generate ONE single image, 5:4 ratio, a concept art sheet arranged in a grid of 4 rows and 5 columns, evenly spaced, no overlap, no frames or dividing lines.

Style for everything: hand-painted 2D cartoon for a cozy mobile mining RPG, soft painterly shading, thick dark-brown outlines, warm lantern lighting, same art style as the reference.

Rows 1 and 2: the same miner character as the reference, shown 10 times as a power progression, from a humble beginner miner to an overpowered legendary miner, left to right then top to bottom. Every copy keeps the same species, face, large amber eyes, short snout, blue-grey scaly skin with orange spots, body proportions and tail. Every copy is clearly a miner: a protective helmet with a light source, work or armored miner gear, and a mining tool held in both hands. No knights, no wizards, no warriors: the power shows through better mining gear, rarer materials, glowing ores and gems. Full body, standing, three-quarter view facing right, all at the same size:
1. beginner: simple yellow work helmet with a small lamp, patched linen shirt, rope belt, crude wooden pickaxe
2. novice: leather helmet with a candle lamp, hide vest, cloth gloves, flint pick
3. apprentice: yellow helmet with copper trims, copper goggles, leather apron with rivets, copper mattock
4. confirmed miner: riveted iron helmet with a round headlamp, iron shoulder pads over a leather jacket, iron sledgehammer
5. veteran: blue-steel helmet with two headlamps, steel chest plate, utility belt full of tools, steel hammer-pick
6. mine boss: golden helmet with a ruby-set lamp, gold-trimmed heavy work armor, a big backpack of gold nuggets, golden pickaxe
7. deep explorer: mithril helmet with a teal crystal lamp, light mithril armor with glowing teal lines, small horns, mithril pick
8. crystal miner: helmet with a violet crystal lamp, armor with violet crystal growths, crystal shards on the tail spikes, crystal pickaxe
9. magma driller: black obsidian helmet with a lava-glow lamp, volcanic armor with orange glowing cracks, huge lava-powered drill
10. legend of the mine: radiant white-gold helmet with a star lamp, white-gold miner armor with star engravings, small luminous wings on the backpack, divine pickaxe with a floating star gem, glowing golden runes on the scales

Rows 3 and 4: ten different mining tools, alone with no hand and no character, all at the same size, each rotated 45 degrees with the head at the top right:
11. a crude wooden pickaxe tied with rope
12. a flint stone double-pointed pick bound with leather
13. a copper mattock with green patina spots
14. a heavy riveted iron sledgehammer
15. a polished blue steel hammer-pick with engraved lines
16. a hand-cranked drill with a long spiral bit
17. a steampunk steam jackhammer with brass pipes and a pressure gauge
18. a large rotary drill with a cone-shaped spiral head and side handles
19. a pickaxe whose head is a cluster of glowing violet crystals
20. a black volcanic rock pickaxe with glowing orange lava cracks

All tools are real tools for breaking or digging rock, never weapons. Keep all glows close to the objects. No text, no labels, no numbers, no letters, no watermark, no background scenery, no ground, no shadow. Solid pure green background #00FF00 filling the whole image, no green on the characters, the tools or any glow.
```

### Outils (à mettre après `Tool:`)

Les outils qui se balancent marchent avec l'animation de frappe actuelle. Ceux qui percent demandent une autre animation (vibration au lieu d'un coup) : garde-les pour des formes ou compétences spéciales.

**Outils qui se balancent**

| Outil | Ligne |
|---|---|
| Pioche classique | `a classic mining pickaxe with one long pointed tip and one short flat tip` |
| Pic à deux pointes | `a double-pointed miner's pick with two long slightly curved spikes` |
| Pioche-hache | `a mattock with a pointed pick on one side and a wide flat digging blade on the other` |
| Masse | `a heavy two-handed sledgehammer with a squared head and reinforced corners` |
| Marteau-pic | `a long-handled hammer-pick with a square hammer face on one side and a sharp spike on the other` |
| Pic à cristaux | `a slender crystal-cutting pick with a thin needle tip, made for splitting gems from the rock` |

**Outils qui percent (autre animation)**

| Outil | Ligne |
|---|---|
| Chignole | `a hand-cranked drill with a long spiral bit, held with both hands and pointing forward and down` |
| Marteau-piqueur à vapeur | `a steampunk steam jackhammer with brass pipes, a small pressure gauge and a chisel bit, held at waist height pointing down` |
| Foreuse à manivelle | `a large rotary drill with a cone-shaped spiral head and two side handles, pointing forward` |

**Matière de l'outil** : ajoute à la fin de la ligne d'outil `, made of` suivi d'une matière, pour l'accorder aux 10 paliers :

| Palier | Fin de ligne |
|---|---|
| Bois | `, made of sharpened hardwood tied with rope` |
| Pierre | `, made of chipped grey flint bound with leather straps` |
| Cuivre | `, made of shiny copper with green patina spots` |
| Fer | `, made of dark riveted iron with a cold blue sheen` |
| Acier | `, made of polished blue steel with engraved lines` |
| Or | `, made of engraved gold with a small ruby` |
| Mithril | `, made of pale silver-teal mithril with softly glowing teal runes` |
| Cristal | `, made of translucent violet crystal glowing from inside` |
| Magma | `, made of black volcanic rock with glowing orange lava cracks` |
| Divin | `, made of radiant white gold with a small floating star gem, glow kept close to the metal` |

### Tenues (à mettre après `Outfit:`)

**Une tenue par palier**, pour garder l'univers cohérent avec les équipements du jeu :

| Palier | Ligne |
|---|---|
| Bois | `simple yellow work helmet with a small lamp, patched linen shirt, rope belt, cloth gloves, worn leather boots, small backpack with a rolled blanket` |
| Pierre | `rough leather helmet with a candle lamp, hide vest with stone beads, thick fur-lined gloves and boots` |
| Cuivre | `yellow helmet with copper trims and a brighter lamp, copper goggles on the helmet, leather apron with copper rivets, copper toe-capped boots` |
| Fer | `riveted iron helmet with a round headlamp, iron shoulder pads over a leather jacket, iron-plated gloves, heavy iron boots` |
| Acier | `polished blue-steel helmet with two headlamps, steel chest plate with engraved lines, steel gauntlets, utility belt with small tools` |
| Or | `golden helmet with ruby-set lamp, gold-trimmed dark leather armor, gold rings on the tail spikes, elegant gold-capped boots` |
| Mithril | `mithril helmet with a glowing teal crystal lamp, light mithril armor with teal glowing lines, short dark blue cape with silver runes` |
| Cristal | `helmet with a violet crystal lamp, armor covered with small violet crystal growths, crystal shards on the tail spikes, glowing violet gloves` |
| Magma | `black obsidian helmet with a lava-glow lamp, volcanic rock armor with orange glowing cracks, heat-resistant boots, embers kept close to the armor` |
| Divin | `white-gold helmet with a radiant star lamp, white-gold armor with star engravings, small luminous wings on the backpack, glow kept close to the body` |

**Tenues thématiques**, pour les événements et les apparences :

| Thème | Ligne |
|---|---|
| Mine hantée (Halloween) | `dented helmet with a small carved pumpkin lamp glowing orange, tattered dark purple cloak, small bone charms on the belt` |
| Grotte gelée (hiver) | `fur-lined helmet with a frosty lamp, thick fur coat, scarf, ice crampons on the boots, small icicles on the backpack` |
| Ruines naines | `bronze dwarven helmet with a braided crest, runic bronze armor, heavy rune-engraved boots` |
| Explorateur steampunk | `leather aviator helmet with brass goggles and a carbide lamp, brass-buttoned vest, gear-shaped belt buckle` |
| Prospecteur des cristaux | `light canvas helmet with a crystal lamp, explorer jacket with many pockets, gem pouches on the belt` |

### Conseils

- Une image par message. Si Gemini fait encore une grille, commence le message par `Generate exactly one image.`
- Si le visage ou la pose dérive, ouvre une nouvelle conversation et rejoins l'image de référence d'origine, pas une variante : une variante de variante dérive de plus en plus.
- Pour un outil qui se balance, demande ensuite la version « mains vides » avec le cadrage habituel : `Framing: exactly the same full body pose and position, but both hands are empty and closed as if gripping an invisible handle, no tool at all.`
- Dépose les fichiers dans `art-source/variantes/` (`fer-masse.png`, `cristal-pic-a-cristaux.png`…).

## Compétences et artefacts

Planches de plusieurs icônes : je découpe chaque case. Colle le bloc « Style commun » en tête, puis le prompt de la planche. Si une planche sort mal (icônes collées, ordre mélangé), demande-la en deux fois. Dépose les résultats dans `art-source/competences/` et `art-source/artefacts/`.

**Règle de planche** (à ajouter après le style commun, avant chaque prompt de planche)

```
Icon sheet: the icons are arranged in a regular grid, each one centered in its own cell, all at the same size, with wide empty green space between them so they never touch. Every icon is a single object seen from the front, readable at a very small size, no frame, no circle, no badge behind it.
```

**Planche 1 : les 6 sorts** (grille 3 × 2, de gauche à droite puis de haut en bas)

```
6 spell icons for a mining game, grid of 3 columns and 2 rows:
1. a lit stick of red dynamite with a sparkling fuse
2. a pickaxe swinging fast with motion streaks and small speed lines
3. a glowing golden ore vein in a rock chunk, shining with sparkles
4. a magnifying monocle with a glowing yellow eye looking through it, small crack lines in a rock behind
5. a purple geode cracked open with sound waves rippling out and small crystal shards flying
6. a huge burst of orange flames and smoke coming out of a mine tunnel entrance, with flying rocks
```

**Planche 2 : les 9 compétences passives** (grille 3 × 3)

```
9 skill icons for a mining game, grid of 3 columns and 3 rows:
1. a gloved fist tightly gripping a pickaxe handle
2. a sharp eye with a small target reticle
3. a cracked rock with a bright impact star in its weak point
4. a nose sniffing golden coins floating in the air
5. a small leather pouch spilling purple crystal shards
6. a bulging miner's backpack with coins overflowing, a small moon above it
7. a short burning fuse with a tiny clock
8. a miner's helmet lamp with a focused beam of light
9. a crossed pair of dynamite sticks with a small explosion between them
```

**Planche 3 : artefacts communs et rares** (grille 4 × 2, la dernière case reste vide)

```
7 ancient mine artifact icons, grid of 4 columns and 2 rows, the last cell empty:
1. an old cracked brass lantern with a faint glow
2. a giant curved mole tooth, yellowed and chipped
3. a rusty brass compass with a needle pointing to a tiny glowing crack
4. a dented leather miner's flask with a cork
5. a gold nugget with small musical notes floating around it
6. a small glass vial of swirling green-grey gas with a warning label and a cork sealed with wax
7. a worn leather notebook with hand-drawn tunnel maps sticking out
```

**Planche 4 : artefacts épiques et légendaires** (grille 3 × 2)

```
6 precious ancient mine artifact icons, grid of 3 columns and 2 rows, more ornate and glowing than common items:
1. a geode shaped like a heart, cut open, purple crystals inside glowing softly
2. a battered steel foreman's helmet with two headlamps, one lamp glowing gold
3. an hourglass made of crystal where the sand flows upward, glowing cyan
4. a teardrop of molten magma held in a black obsidian setting, glowing orange
5. a small fallen star, white-gold, still glowing, resting in a tiny crater of rock
6. a royal dwarven pickaxe with a gold and gem-encrusted head and runes on the handle
```

**Planche 5 : barre de menus** (grille 5 × 1)

```
5 menu tab icons for a mining game, grid of 5 columns and 1 row:
1. a mine entrance with wooden beams and a mine cart
2. an open old book with a glowing skill tree drawn on the page
3. a treasure chest slightly open with an ancient relic glowing inside
4. a small cute mole wearing a tiny miner's helmet
5. a blacksmith anvil with a hammer and small sparks
```

## Atelier, événements de mine, embranchements et compagnons

Visuels des idées de [[idees-fun]] (13/10/2026). Même méthode que les planches de compétences : colle le bloc « Style commun », puis la « Règle de planche » pour les planches, puis le prompt. Dépose les résultats dans `art-source/evenements/`, `art-source/galeries/` et `art-source/compagnons/`. En attendant, le jeu affiche du texte sur les boutons en bois.

**Atelier** : rien de nouveau à générer. Il réutilise les icônes d'emplacement (pioche, bottes, gants, casque, sac) et l'icône d'enclume de la planche 5.

**Planche 6 : événements de mine** (grille 4 × 2, de gauche à droite puis de haut en bas)

```
8 mine event objects for a mining game, grid of 4 columns and 2 rows, all objects at the same scale:
1. a giant round geode half buried in rock, grey rough shell, closed, a faint purple glow seeping from a thin line
2. the same giant geode with several cracks, purple light shining through the cracks
3. the same giant geode heavily cracked, pieces about to fall off, strong purple glow
4. the same giant geode broken open in two halves, full of glowing purple crystals, small shards flying out
5. an old wooden treasure chest with iron bands, half buried in dirt and pebbles, closed, padlock rusted
6. the same chest pulled out of the dirt and open, golden light, coins and purple crystal shards inside
7. a single falling crystal shard, bright cyan, with a short sparkling light trail above it
8. a small burlap sack tied with rope, bulging with coins, a few coins spilling out
```

**Rat voleur** (une image, puis la vidéo). Le voleur est un rat et non une taupe, pour ne pas le confondre avec la taupe compagnon.

```
A cute chibi mine rat thief seen from the side, running to the right, wearing a tiny black bandit mask and a miner's scarf, carrying a bulging burlap sack of coins over its shoulder, big expressive eyes, mischievous grin, full body.
```

Vidéo (joins l'image ci-dessus comme référence) :

```
The same chibi rat thief runs in place to the right in a seamless loop, sack bouncing on its shoulder, side view, camera fixed, solid pure green background #00FF00, no shadow, no other object.
```

**Planche 7 : galeries des embranchements** (grille 5 × 1)

```
5 tunnel entrance icons for a mining game, grid of 5 columns and 1 row, each a mine tunnel entrance framed by wooden beams, seen from the front:
1. a plain mine tunnel entrance with a hanging lantern, neutral and calm
2. a flooded tunnel entrance, blue water up to the knees, drops falling from the ceiling
3. a tunnel entrance whose walls are streaked with shining gold veins
4. an unstable tunnel entrance with cracked beams, falling pebbles and a small dust cloud, a red warning sign without text
5. a tunnel entrance glowing from inside with purple and cyan crystals growing on the walls
```

**Personnage commun aux compagnons** (à coller avant chaque prompt de compagnon, après le style commun)

```
Companion pet for a chibi dwarf-dragon miner: small, round and cute, big expressive eyes, same hand-painted style and thick outlines as the miner, full body, three-quarter front view, idle pose.
```

**Planche 8 : les 6 compagnons** (grille 3 × 2)

```
6 cute companion pets for a mining game, grid of 3 columns and 2 rows:
1. a yellow canary wearing a tiny miner's helmet with a lamp, singing with a small music note
2. a brown mole with big digging claws and small round goggles pushed up on its head
3. a small purple bat with oversized ears, wings open, hanging a tiny lantern from its foot
4. a little stone golem made of round grey rocks, moss on its shoulders, glowing amber eyes
5. a firefly with a softly glowing green-yellow belly and tiny round wings
6. a baby magma dragon, dark red scales with glowing orange cracks, tiny wings, a small puff of smoke from its nose
```

**Vidéo d'un compagnon dans la mine** (une vidéo par compagnon, joins son image comme référence) :

```
The same companion pet idles in place in a seamless loop: gentle breathing, blinking, a small playful movement (the canary flaps and sings, the mole scratches the ground, the bat flutters, the golem sways, the firefly blinks its light, the dragon puffs smoke). Camera fixed, three-quarter front view, solid pure green background #00FF00, no shadow, no other object.
```

**Planche 9 : œufs de compagnon** (grille 4 × 1)

```
4 companion eggs for a mining game, grid of 4 columns and 1 row, same egg shape, increasingly precious:
1. a speckled grey stone egg, plain
2. a blue egg with shiny copper veins
3. a purple egg covered in small crystals, glowing softly
4. a golden egg with glowing orange magma cracks and tiny sparks around it
```

## Refonte compagnons et évolution (13/10/2026)

Visuels de [[refonte-compagnons-evolution]]. Colle le bloc « Style commun », puis la « Règle de planche » pour la planche, puis le prompt. Dépose les résultats dans `art-source/refonte/`. En attendant, le jeu affiche du texte sur les boutons en bois.

**Planche 10 : ressources et boutons de la refonte** (grille 3 × 1)

```
3 icons for a mining game, grid of 3 columns and 1 row:
1. an awakening stone: a smooth palm-sized river pebble, deep teal, with a glowing golden star-shaped rune carved in its center and a soft golden light seeping out of the carving
2. a mine challenge trophy: a small wooden plaque with an iron pickaxe and a crossed hammer mounted on it, a golden ribbon at the bottom, a few rock shards flying around
3. a rolled parchment scroll tied with a red cord, slightly unrolled at one end showing faint ink lines
```

**Bannière du Défi de la mine** (une image, format 3:1)

```
A wide horizontal banner for a mining challenge event, 3:1 ratio: a wooden signboard nailed to two mine support beams, decorated with a crossed pickaxe and hammer in the center, scattered glowing purple geode shards and a cracked rock pile at each end, a lantern hanging from the left beam. Empty center area of the signboard for a title added in code, no text.
```

