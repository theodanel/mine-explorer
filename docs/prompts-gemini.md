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
