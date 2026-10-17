# Animations de fond de la mine

Demande de Théo (17/10/2026) : rendre la mine vivante, par exemple un dragon divin qui passe de temps en temps au fond de la grotte de la zone divine. La refonte visuelle n'est pas touchée : tout se joue dans une couche Pixi entre le décor et le rocher (`mine-scene/ambience-layer.ts`, règles pures dans `mine-scene/ambience.ts`).

## Ambiance permanente (en code, chaque zone)

Des particules discrètes, en mélange additif (elles éclairent le décor au lieu de le couvrir), entre le bandeau de zone et le sol du mineur.

| Ambiance | Zones | Mouvement |
|---|---|---|
| Poussière | 1 Racines, 2 Carrière, 17 Ruines anciennes | dérive lente |
| Éclats | 3 Cuivre, 6 Or | scintillent puis réapparaissent ailleurs |
| Gouttes | 4 Fer | tombent du plafond |
| Braises | 5 Forge naine, 9 Magma, 14 Obsidienne, 16 Nid de dragon, 20 Cœur du monde | montent et s'éteignent |
| Lucioles | 7 Ruines elfiques, 11 Forêt souterraine | dérive et clignotement |
| Scintillements colorés | 8 Cristal, 15 Jardin de cristaux | scintillent |
| Poussière d'or | 10 Sanctuaire divin | monte doucement |
| Neige | 12 Lac gelé | tombe en se balançant |
| Bulles | 13 Cité engloutie, 18 Abysses | montent |
| Paillettes de fée | 19 Royaume des fées | dérive |

## Passages rares (une image Gemini chacun)

Une silhouette traverse le fond de la grotte, assombrie et un peu transparente, avec un léger tangage, d'un côté ou de l'autre au hasard. La première passe 40 à 80 s après l'arrivée dans la zone, les suivantes toutes les 2 à 4 minutes. Elle passe derrière le rocher et le mineur.

| Silhouette | Zones | Image |
|---|---|---|
| Nuée de chauves-souris | 1 à 4, 11 | chauve-souris des compagnons en attendant |
| Nain et son wagonnet | 5, 6, 13 | à venir |
| Golem de cristal | 7, 8, 15 | à venir |
| Dragon de feu | 9, 14, 16 | à venir |
| Dragon divin | 10, 20 | à venir |
| Baleine des profondeurs | 12, 18 | à venir |
| Ronde de fées | 17, 19 | à venir |

Une silhouette sans image (`url: null` dans `PASSERS`) ne passe pas. Pour en brancher une : détourer l'image Gemini (fond vert), la déposer dans `frontend/public/assets/ui/passages/` et renseigner son `url`.

## Prompts Gemini

Joindre le nouvel Apprenti comme référence de style, coller le bloc commun puis la ligne du sujet. Une image par message.

```
Use the attached image only as the reference for the ART STYLE: hand-painted 2D cartoon with a gritty, weathered look, visible brush texture, rough dark-brown outlines of varying thickness, muted earthy palette, matte surfaces, cute and rounded shapes. NOT glossy, NOT clean vector art, NOT neon. Do not draw the attached character.

A background creature for a cozy mining game, seen strictly from the side, moving to the RIGHT, caught in the middle of its motion, full body, nothing cut off. Wide 2:1 image, the subject fills 80% of the width. No text, no letters, no ground, no shadow, no scenery, no particles. Solid pure green background #00FF00 filling the whole image, no green on the subject or on any glow.
```

- `Subject: a small flock of five cute round cave bats flying together in a loose group, wings open at different angles, big ears.`
- `Subject: a stocky dwarf miner with a big beard, a helmet and a lantern, pushing a wooden mine cart full of glittering ore on short rails.`
- `Subject: a gentle crystal golem walking slowly, a round body of grey rock with large purple and cyan crystals growing from its back and shoulders.`
- `Subject: a red fire dragon gliding with wide open wings, a long tail, small embers glowing in the cracks of its scales, calm expression.`
- `Subject: a majestic divine dragon gliding with wide feathered wings, white and gold scales, a soft golden glow close to its body, calm and noble.`
- `Subject: a huge gentle deep-sea whale swimming, dark blue with small glowing spots along its body, long fins, a small glowing lure above its head.`
- `Subject: a small ring of four tiny fairies flying together with dragonfly wings, pink and lilac clothes, a soft warm glow around each one.`
