# Forge du Cœur : des runes pour éveiller les étoiles

> **Remplacé en partie le 18/10/2026** : les éclats de cœur (et leur hasard) et la forge des runes contre des minerais divins ont laissé la place aux Échos et au Creuset du Cœur. Voir [[echos-et-creuset]]. L'anneau, la fusion et la règle « 2 runes par étoile » restent valables.

Demande de Théo (18/10/2026) : les étoiles de la Légende du Cœur du monde doivent être dures à obtenir. Le joueur doit fabriquer des objets en fusionnant des ressources. Inspiration : un anneau de runes serties autour d'un orbe (capture envoyée par Théo). **Validée par Théo le 18/10/2026** (anneau de 10 runes, fusions qui peuvent rater, éclats des gardiens, filons et Puits sans fond) et codée : `heart-forge/`, page « Forge du Cœur » ouverte depuis l'écran d'évolution. Chiffres calés au simulateur, voir plus bas.

## L'idée en une phrase

Autour du portrait du Cœur du monde, un **anneau de 10 emplacements de rune**. Chaque étoile demande d'y sertir **2 runes**, que le joueur fabrique à la **Forge du Cœur** en fusionnant des **éclats de cœur** et des minerais, puis en fusionnant les runes entre elles pour les faire monter de rang.

## Les ressources

- **Éclat de cœur** (nouvelle ressource) : un fragment de l'orbe de lave. Il se gagne à partir de la zone 12 :
  - chaque gardien de zone battu : 3 éclats de cœur ;
  - chaque filon épuisé en zone 12 ou plus : 1 chance sur 4 ;
  - le Puits sans fond : 1 éclat de cœur tous les 4 étages, dès la Légende.
- **Minerais divins** : le seul minerai des zones 10 et plus, qui sert aussi à l'Atelier (le joueur choisit où le mettre). Au départ, chaque élément demandait le minerai d'une zone ancienne, mais le simulateur a montré que le joueur n'en a plus à ce stade : aucune rune n'aurait pu être forgée.

## La fabrication

1. **Forger une rune de rang 1** : 3 éclats de cœur + 10 minerais divins.
2. **Fusionner** : 3 runes du même élément et du même rang donnent 1 rune du rang suivant.
3. À partir du rang 3, une fusion peut **rater** (20 % au rang 3, 30 % au rang 4, 35 % au rang 5) : on récupère alors une seule des trois runes. C'est le « pari » qui rend les dernières étoiles dures.

| Élément | Rune |
|---|---|
| Feu | rouge-orange, une flamme gravée |
| Glace | bleu pâle, un flocon gravé |
| Terre | brun, une montagne gravée |
| Ombre | violet sombre, un œil gravé |
| Lumière | or blanc, un soleil gravé |

## Les étoiles

Chaque étoile garde ses missions actuelles (atteindre puis terminer la zone, objets forgés, filons) et demande en plus 2 runes serties :

| Étoile | Runes à sertir | Runes de rang 1 nécessaires (sans échec) |
|---|---|---|
| ★ | 2 runes de rang 1 (Feu, Terre) | 2 |
| ★★ | 2 runes de rang 2 (Glace, Ombre) | 6 |
| ★★★ | 2 runes de rang 3 (Feu, Lumière) | 18 |
| ★★★★ | 2 runes de rang 4 (Glace, Terre) | 54 |
| ★★★★★ | 2 runes de rang 5 (Ombre, Lumière) | 162 |

Une rune sertie reste dans l'anneau.

## Ce que dit le simulateur (régulier, 3 tirages, 200 jours)

Le joueur simulé forge, fusionne et sertit une fois par jour les runes de l'étoile suivante.

| Étoile | Sans la forge | Avec la forge |
|---|---|---|
| ★ à ★★★★ | jours 23, 32, 42, 63 | identiques : ce sont les missions qui les retiennent |
| ★★★★★ | jour 103 | jours 96, 119 et 135 selon la chance aux fusions |

La 5e étoile devient la vraie épreuve de fin de partie : 340 à 510 runes forgées, 11 à 21 fusions ratées, environ 2 300 éclats de cœur gagnés en 200 jours. Le gardien de la zone 20 reste battable une fois l'étoile éveillée.

## L'écran

- **Forge du Cœur**, ouverte depuis la carte du Cœur du monde (écran d'évolution) : l'anneau de 10 emplacements en grand, le portrait au centre, et dessous l'inventaire des runes par élément et par rang, avec les boutons « Forger » et « Fusionner ».
- Une rune sertie s'allume dans l'anneau ; quand les 2 runes d'une étoile sont serties et ses missions remplies, le bouton « Éveiller l'étoile » s'allume.

## Images à demander à Gemini

Joindre le nouvel Apprenti comme référence de style, une image par message.

**1. L'anneau** :
```
Use the attached image only as the reference for the ART STYLE: hand-painted 2D cartoon with a gritty, weathered look, visible brush texture, rough dark-brown outlines of varying thickness, muted earthy palette, matte surfaces. NOT glossy, NOT clean vector art, NOT neon. Do not draw the attached character.

A round magical ring seen from the front, perfectly circular and centered, for a mining game interface: a thick ring of dark obsidian stone with dull gold trims and thin glowing lava cracks, with exactly 10 empty round sockets evenly spaced around it like the hours of a clock, each socket a small dark hollow cup with a gold rim. The center of the ring is completely empty (a portrait will be placed there). Square 1:1, the ring fills 90% of the image. No text, no runes in the sockets, no character, no shadow. Solid pure green background #00FF00 filling the whole image, including the empty center, no green on the ring.
```

**2. Les 5 runes** :
```
Use the attached image only as the reference for the ART STYLE: hand-painted 2D cartoon with a gritty, weathered look, visible brush texture, rough dark-brown outlines of varying thickness, muted earthy palette, matte surfaces. NOT glossy, NOT clean vector art, NOT neon. Do not draw the attached character.

Exactly FIVE round rune stones in a single row, same size, same shape, evenly spaced, seen from the front: small polished disks of stone with a softly glowing engraved symbol.
1. Fire: red-orange stone, an engraved flame.
2. Ice: pale blue stone, an engraved snowflake.
3. Earth: brown stone, an engraved mountain.
4. Shadow: dark violet stone, an engraved eye.
5. Light: white-gold stone, an engraved sun.
Wide 5:1 image, each rune fills 80% of its fifth. No text, no letters, no shadow, no glow beyond the stone. Solid pure green background #00FF00 filling the whole image, no green on the runes.
```

**3. L'éclat de cœur** :
```
Use the attached image only as the reference for the ART STYLE: hand-painted 2D cartoon with a gritty, weathered look, visible brush texture, rough dark-brown outlines of varying thickness, muted earthy palette, matte surfaces. NOT glossy, NOT clean vector art, NOT neon. Do not draw the attached character.

A single game resource icon: a jagged shard broken from a round orb of molten lava, dark obsidian crust on the outside, glowing orange-gold lava inside the broken edge, a few tiny cracks. Seen from the front, centered, square 1:1, the shard fills 80% of the image. No text, no shadow, no particles. Solid pure green background #00FF00 filling the whole image, no green on the shard.
```

Le rang d'une rune (1 à 5) s'affiche en code (petites étoiles et cadre de plus en plus doré) : pas besoin de 25 images.

## À trancher par Théo

1. **Anneau de 10 runes, 2 par étoile** (je recommande), ou 5 runes, une par étoile ?
2. **Fusions qui peuvent rater** à partir du rang 3 (je recommande : c'est ce qui rend la fin dure), ou fusions toujours réussies et simplement plus chères ?
3. **Sources des éclats de cœur** : gardiens, filons dès la zone 12 et Puits sans fond (je recommande), ou aussi les Donjons si tu les veux plus tard ?
