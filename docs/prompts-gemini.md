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

**3. Contremaître (zone 10)**

```
Form: mine foreman, proud and sturdy. Steel-plated helmet with two headlamps, iron shoulder pads and chest plate over a leather jacket, utility belt with small tools and a pocket watch, heavy steel-toed boots, small iron horns starting to grow on the head.
```

**4. Maître des profondeurs (zone 15)**

```
Form: master of the depths, wise and powerful. Mithril helmet with a glowing crystal instead of a lamp, flowing dark blue cape with silver mining runes, mithril armor with teal glowing lines, crystal shards growing on the tail spikes, longer curved horns, calm confident expression.
```

**5. Légende de la mine (zone 20)**

```
Form: legendary mine guardian, majestic. White-gold divine armor with star engravings, a radiant halo-like lamp above the helmet, glowing golden runes on the scales, small luminous wings on the back, tail tip glowing like molten gold, heroic expression. Keep any glow close to the body (no green in the glow).
```

### Conseils

- Génère d'abord l'Apprenti en pied, puis donne cette image à Gemini comme référence pour toutes les autres : c'est le meilleur moyen de garder le même personnage.
- Pour les pioches, génère d'abord celle en Bois, puis demande les autres « en gardant exactement le même cadrage et le même angle que l'image jointe ».
- Dépose les fichiers dans `art-source/evolutions/` (`apprenti-portrait.png`, `apprenti-pied.png`, `apprenti-mains-vides.png`…) et `art-source/pioches/` (`bois.png`, `pierre.png`…).
