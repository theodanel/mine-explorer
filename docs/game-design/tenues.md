# Tenues du dragon

Lot 7 des idées inspirées de Forge Master, demandé par Théo le 19/10/2026.

## Règles

- 30 tenues : un foulard, un casque ou une lampe pour le dragon. **Aucune stat par tenue.**
- La **collection** donne **+1 % de Frappe par tranche de 5 tenues**, **+5 % au plus** (`balance/outfits.ts`).
- Sources (les tenues se lisent dans la progression, rien n'est perdu) :
  - le **dernier palier de chaque zone** du passe de progression (20 tenues) ;
  - les **donjons**, tous les 10 niveaux jusqu'au niveau 50 (5 par donjon) ;
  - les succès (lot 6) pourront en ajouter.
- La tenue portée est retenue (`mine-explorer.tenues`). Elle ne change pas encore l'image du mineur : les visuels sont à générer (prompts ci-dessous). En attendant, les cartes affichent « visuel à venir ».

## Écran

Profil, carte « Tenues » : le bonus de collection, puis les 30 cartes (gagnées en couleur, les autres grisées avec leur source). Toucher une tenue gagnée la porte, la toucher encore l'enlève.

## Simulateur (régulier, 60 jours, 3 tirages, pioche 30)

Sans tenues : jours 24,3 / 24,8 / 25,3 ; avec : 24,8 / 24,8 / 24,8. Le bonus (5 % au plus) ne change pas le rythme. Option `--sans-tenues`.

## Prompts Gemini des visuels (icônes de collection)

Chaque prompt se suffit à lui-même. Joins à chaque fois l'image en pied du mineur Apprenti (`art-source/evolutions/`) comme référence de style. Dépose chaque image (1024 × 1024, fond vert) dans `art-source/tenues/<identifiant>.png`, le nom est donné avant chaque prompt.

### Foulard bleu (Foulard, Passe : fin de la zone 1) · `foulard-bleu.png`

```
Use the attached image only as the style reference: same 2D cartoon game art, hand-painted, NOT a photo, NOT 3D, thick dark-brown outlines, soft cel shading, warm colors.

A single collectible game icon of a simple sky-blue cotton miner scarf, knotted, made to be worn by a small cute dragon miner (the character in the reference). Show ONLY the accessory, no character, no head, no body. Seen slightly from the front, centered, filling about 70 % of the image, crisp clean edges.

Square image 1024x1024. No text, no letters, no logo, no watermark, no frame, no background scenery, no ground, no shadow. Solid pure green background #00FF00 filling the whole image, no green on the accessory or in any glow.
```

### Foulard vert (Foulard, Passe : fin de la zone 2) · `foulard-vert.png`

```
Use the attached image only as the style reference: same 2D cartoon game art, hand-painted, NOT a photo, NOT 3D, thick dark-brown outlines, soft cel shading, warm colors.

A single collectible game icon of a moss-green cotton miner scarf with a small leaf stitch, made to be worn by a small cute dragon miner (the character in the reference). Show ONLY the accessory, no character, no head, no body. Seen slightly from the front, centered, filling about 70 % of the image, crisp clean edges.

Square image 1024x1024. No text, no letters, no logo, no watermark, no frame, no background scenery, no ground, no shadow. Solid pure green background #00FF00 filling the whole image, no green on the accessory or in any glow.
```

### Lampe cuivrée (Lampe, Passe : fin de la zone 3) · `lampe-cuivre.png`

```
Use the attached image only as the style reference: same 2D cartoon game art, hand-painted, NOT a photo, NOT 3D, thick dark-brown outlines, soft cel shading, warm colors.

A single collectible game icon of a round copper helmet lamp with a warm orange glow, made to be worn by a small cute dragon miner (the character in the reference). Show ONLY the accessory, no character, no head, no body. Seen slightly from the front, centered, filling about 70 % of the image, crisp clean edges.

Square image 1024x1024. No text, no letters, no logo, no watermark, no frame, no background scenery, no ground, no shadow. Solid pure green background #00FF00 filling the whole image, no green on the accessory or in any glow.
```

### Casque riveté (Casque, Passe : fin de la zone 4) · `casque-rivete.png`

```
Use the attached image only as the style reference: same 2D cartoon game art, hand-painted, NOT a photo, NOT 3D, thick dark-brown outlines, soft cel shading, warm colors.

A single collectible game icon of an iron miner helmet covered in big rivets, made to be worn by a small cute dragon miner (the character in the reference). Show ONLY the accessory, no character, no head, no body. Seen slightly from the front, centered, filling about 70 % of the image, crisp clean edges.

Square image 1024x1024. No text, no letters, no logo, no watermark, no frame, no background scenery, no ground, no shadow. Solid pure green background #00FF00 filling the whole image, no green on the accessory or in any glow.
```

### Foulard de braise (Foulard, Passe : fin de la zone 5) · `foulard-braise.png`

```
Use the attached image only as the style reference: same 2D cartoon game art, hand-painted, NOT a photo, NOT 3D, thick dark-brown outlines, soft cel shading, warm colors.

A single collectible game icon of an ember-orange scarf with glowing spark patterns, dwarven forge style, made to be worn by a small cute dragon miner (the character in the reference). Show ONLY the accessory, no character, no head, no body. Seen slightly from the front, centered, filling about 70 % of the image, crisp clean edges.

Square image 1024x1024. No text, no letters, no logo, no watermark, no frame, no background scenery, no ground, no shadow. Solid pure green background #00FF00 filling the whole image, no green on the accessory or in any glow.
```

### Lampe dorée (Lampe, Passe : fin de la zone 6) · `lampe-doree.png`

```
Use the attached image only as the style reference: same 2D cartoon game art, hand-painted, NOT a photo, NOT 3D, thick dark-brown outlines, soft cel shading, warm colors.

A single collectible game icon of an ornate golden helmet lamp with a bright yellow light, made to be worn by a small cute dragon miner (the character in the reference). Show ONLY the accessory, no character, no head, no body. Seen slightly from the front, centered, filling about 70 % of the image, crisp clean edges.

Square image 1024x1024. No text, no letters, no logo, no watermark, no frame, no background scenery, no ground, no shadow. Solid pure green background #00FF00 filling the whole image, no green on the accessory or in any glow.
```

### Casque elfique (Casque, Passe : fin de la zone 7) · `casque-elfique.png`

```
Use the attached image only as the style reference: same 2D cartoon game art, hand-painted, NOT a photo, NOT 3D, thick dark-brown outlines, soft cel shading, warm colors.

A single collectible game icon of an elegant elven miner helmet with silver leaf engravings, made to be worn by a small cute dragon miner (the character in the reference). Show ONLY the accessory, no character, no head, no body. Seen slightly from the front, centered, filling about 70 % of the image, crisp clean edges.

Square image 1024x1024. No text, no letters, no logo, no watermark, no frame, no background scenery, no ground, no shadow. Solid pure green background #00FF00 filling the whole image, no green on the accessory or in any glow.
```

### Foulard de cristal (Foulard, Passe : fin de la zone 8) · `foulard-cristal.png`

```
Use the attached image only as the style reference: same 2D cartoon game art, hand-painted, NOT a photo, NOT 3D, thick dark-brown outlines, soft cel shading, warm colors.

A single collectible game icon of a pale violet scarf with small crystal shards sewn on the edge, made to be worn by a small cute dragon miner (the character in the reference). Show ONLY the accessory, no character, no head, no body. Seen slightly from the front, centered, filling about 70 % of the image, crisp clean edges.

Square image 1024x1024. No text, no letters, no logo, no watermark, no frame, no background scenery, no ground, no shadow. Solid pure green background #00FF00 filling the whole image, no green on the accessory or in any glow.
```

### Lampe de magma (Lampe, Passe : fin de la zone 9) · `lampe-magma.png`

```
Use the attached image only as the style reference: same 2D cartoon game art, hand-painted, NOT a photo, NOT 3D, thick dark-brown outlines, soft cel shading, warm colors.

A single collectible game icon of a black stone helmet lamp holding a glowing magma core, made to be worn by a small cute dragon miner (the character in the reference). Show ONLY the accessory, no character, no head, no body. Seen slightly from the front, centered, filling about 70 % of the image, crisp clean edges.

Square image 1024x1024. No text, no letters, no logo, no watermark, no frame, no background scenery, no ground, no shadow. Solid pure green background #00FF00 filling the whole image, no green on the accessory or in any glow.
```

### Casque divin (Casque, Passe : fin de la zone 10) · `casque-divin.png`

```
Use the attached image only as the style reference: same 2D cartoon game art, hand-painted, NOT a photo, NOT 3D, thick dark-brown outlines, soft cel shading, warm colors.

A single collectible game icon of a white-gold divine miner helmet with a tiny sun emblem, made to be worn by a small cute dragon miner (the character in the reference). Show ONLY the accessory, no character, no head, no body. Seen slightly from the front, centered, filling about 70 % of the image, crisp clean edges.

Square image 1024x1024. No text, no letters, no logo, no watermark, no frame, no background scenery, no ground, no shadow. Solid pure green background #00FF00 filling the whole image, no green on the accessory or in any glow.
```

### Foulard de mousse (Foulard, Passe : fin de la zone 11) · `foulard-mousse.png`

```
Use the attached image only as the style reference: same 2D cartoon game art, hand-painted, NOT a photo, NOT 3D, thick dark-brown outlines, soft cel shading, warm colors.

A single collectible game icon of a soft scarf made of glowing underground moss with tiny mushrooms, made to be worn by a small cute dragon miner (the character in the reference). Show ONLY the accessory, no character, no head, no body. Seen slightly from the front, centered, filling about 70 % of the image, crisp clean edges.

Square image 1024x1024. No text, no letters, no logo, no watermark, no frame, no background scenery, no ground, no shadow. Solid pure green background #00FF00 filling the whole image, no green on the accessory or in any glow.
```

### Lampe d'obsidienne (Lampe, Passe : fin de la zone 12) · `lampe-obsidienne.png`

```
Use the attached image only as the style reference: same 2D cartoon game art, hand-painted, NOT a photo, NOT 3D, thick dark-brown outlines, soft cel shading, warm colors.

A single collectible game icon of a sharp black obsidian helmet lamp with a cold purple light, made to be worn by a small cute dragon miner (the character in the reference). Show ONLY the accessory, no character, no head, no body. Seen slightly from the front, centered, filling about 70 % of the image, crisp clean edges.

Square image 1024x1024. No text, no letters, no logo, no watermark, no frame, no background scenery, no ground, no shadow. Solid pure green background #00FF00 filling the whole image, no green on the accessory or in any glow.
```

### Casque de givre (Casque, Passe : fin de la zone 13) · `casque-givre.png`

```
Use the attached image only as the style reference: same 2D cartoon game art, hand-painted, NOT a photo, NOT 3D, thick dark-brown outlines, soft cel shading, warm colors.

A single collectible game icon of an icy blue miner helmet with frost crystals on the rim, made to be worn by a small cute dragon miner (the character in the reference). Show ONLY the accessory, no character, no head, no body. Seen slightly from the front, centered, filling about 70 % of the image, crisp clean edges.

Square image 1024x1024. No text, no letters, no logo, no watermark, no frame, no background scenery, no ground, no shadow. Solid pure green background #00FF00 filling the whole image, no green on the accessory or in any glow.
```

### Foulard d'ombre (Foulard, Passe : fin de la zone 14) · `foulard-ombre.png`

```
Use the attached image only as the style reference: same 2D cartoon game art, hand-painted, NOT a photo, NOT 3D, thick dark-brown outlines, soft cel shading, warm colors.

A single collectible game icon of a dark violet scarf trailing wisps of shadow, made to be worn by a small cute dragon miner (the character in the reference). Show ONLY the accessory, no character, no head, no body. Seen slightly from the front, centered, filling about 70 % of the image, crisp clean edges.

Square image 1024x1024. No text, no letters, no logo, no watermark, no frame, no background scenery, no ground, no shadow. Solid pure green background #00FF00 filling the whole image, no green on the accessory or in any glow.
```

### Lampe d'aurore (Lampe, Passe : fin de la zone 15) · `lampe-aurore.png`

```
Use the attached image only as the style reference: same 2D cartoon game art, hand-painted, NOT a photo, NOT 3D, thick dark-brown outlines, soft cel shading, warm colors.

A single collectible game icon of a helmet lamp shining pink and gold dawn light, made to be worn by a small cute dragon miner (the character in the reference). Show ONLY the accessory, no character, no head, no body. Seen slightly from the front, centered, filling about 70 % of the image, crisp clean edges.

Square image 1024x1024. No text, no letters, no logo, no watermark, no frame, no background scenery, no ground, no shadow. Solid pure green background #00FF00 filling the whole image, no green on the accessory or in any glow.
```

### Casque de corail (Casque, Passe : fin de la zone 16) · `casque-corail.png`

```
Use the attached image only as the style reference: same 2D cartoon game art, hand-painted, NOT a photo, NOT 3D, thick dark-brown outlines, soft cel shading, warm colors.

A single collectible game icon of a coral-red miner helmet with sea shell details, made to be worn by a small cute dragon miner (the character in the reference). Show ONLY the accessory, no character, no head, no body. Seen slightly from the front, centered, filling about 70 % of the image, crisp clean edges.

Square image 1024x1024. No text, no letters, no logo, no watermark, no frame, no background scenery, no ground, no shadow. Solid pure green background #00FF00 filling the whole image, no green on the accessory or in any glow.
```

### Foulard étoilé (Foulard, Passe : fin de la zone 17) · `foulard-etoile.png`

```
Use the attached image only as the style reference: same 2D cartoon game art, hand-painted, NOT a photo, NOT 3D, thick dark-brown outlines, soft cel shading, warm colors.

A single collectible game icon of a midnight-blue scarf sprinkled with small golden stars, made to be worn by a small cute dragon miner (the character in the reference). Show ONLY the accessory, no character, no head, no body. Seen slightly from the front, centered, filling about 70 % of the image, crisp clean edges.

Square image 1024x1024. No text, no letters, no logo, no watermark, no frame, no background scenery, no ground, no shadow. Solid pure green background #00FF00 filling the whole image, no green on the accessory or in any glow.
```

### Lampe spectrale (Lampe, Passe : fin de la zone 18) · `lampe-spectrale.png`

```
Use the attached image only as the style reference: same 2D cartoon game art, hand-painted, NOT a photo, NOT 3D, thick dark-brown outlines, soft cel shading, warm colors.

A single collectible game icon of a ghostly teal helmet lamp with a floating spirit flame, made to be worn by a small cute dragon miner (the character in the reference). Show ONLY the accessory, no character, no head, no body. Seen slightly from the front, centered, filling about 70 % of the image, crisp clean edges.

Square image 1024x1024. No text, no letters, no logo, no watermark, no frame, no background scenery, no ground, no shadow. Solid pure green background #00FF00 filling the whole image, no green on the accessory or in any glow.
```

### Casque du gardien (Casque, Passe : fin de la zone 19) · `casque-gardien.png`

```
Use the attached image only as the style reference: same 2D cartoon game art, hand-painted, NOT a photo, NOT 3D, thick dark-brown outlines, soft cel shading, warm colors.

A single collectible game icon of a heavy stone guardian helmet with two small horns and glowing runes, made to be worn by a small cute dragon miner (the character in the reference). Show ONLY the accessory, no character, no head, no body. Seen slightly from the front, centered, filling about 70 % of the image, crisp clean edges.

Square image 1024x1024. No text, no letters, no logo, no watermark, no frame, no background scenery, no ground, no shadow. Solid pure green background #00FF00 filling the whole image, no green on the accessory or in any glow.
```

### Foulard du Cœur (Foulard, Passe : fin de la zone 20) · `foulard-coeur.png`

```
Use the attached image only as the style reference: same 2D cartoon game art, hand-painted, NOT a photo, NOT 3D, thick dark-brown outlines, soft cel shading, warm colors.

A single collectible game icon of a lava-red scarf with a glowing heart-of-the-world emblem, made to be worn by a small cute dragon miner (the character in the reference). Show ONLY the accessory, no character, no head, no body. Seen slightly from the front, centered, filling about 70 % of the image, crisp clean edges.

Square image 1024x1024. No text, no letters, no logo, no watermark, no frame, no background scenery, no ground, no shadow. Solid pure green background #00FF00 filling the whole image, no green on the accessory or in any glow.
```

### Lampe d'améthyste (Lampe, Grotte de cristal : niveau 10) · `lampe-amethyste.png`

```
Use the attached image only as the style reference: same 2D cartoon game art, hand-painted, NOT a photo, NOT 3D, thick dark-brown outlines, soft cel shading, warm colors.

A single collectible game icon of an amethyst helmet lamp with a violet glow, made to be worn by a small cute dragon miner (the character in the reference). Show ONLY the accessory, no character, no head, no body. Seen slightly from the front, centered, filling about 70 % of the image, crisp clean edges.

Square image 1024x1024. No text, no letters, no logo, no watermark, no frame, no background scenery, no ground, no shadow. Solid pure green background #00FF00 filling the whole image, no green on the accessory or in any glow.
```

### Foulard géode (Foulard, Grotte de cristal : niveau 20) · `foulard-geode.png`

```
Use the attached image only as the style reference: same 2D cartoon game art, hand-painted, NOT a photo, NOT 3D, thick dark-brown outlines, soft cel shading, warm colors.

A single collectible game icon of a scarf patterned like a cut geode, purple and white rings, made to be worn by a small cute dragon miner (the character in the reference). Show ONLY the accessory, no character, no head, no body. Seen slightly from the front, centered, filling about 70 % of the image, crisp clean edges.

Square image 1024x1024. No text, no letters, no logo, no watermark, no frame, no background scenery, no ground, no shadow. Solid pure green background #00FF00 filling the whole image, no green on the accessory or in any glow.
```

### Casque de quartz (Casque, Grotte de cristal : niveau 30) · `casque-quartz.png`

```
Use the attached image only as the style reference: same 2D cartoon game art, hand-painted, NOT a photo, NOT 3D, thick dark-brown outlines, soft cel shading, warm colors.

A single collectible game icon of a translucent quartz miner helmet, made to be worn by a small cute dragon miner (the character in the reference). Show ONLY the accessory, no character, no head, no body. Seen slightly from the front, centered, filling about 70 % of the image, crisp clean edges.

Square image 1024x1024. No text, no letters, no logo, no watermark, no frame, no background scenery, no ground, no shadow. Solid pure green background #00FF00 filling the whole image, no green on the accessory or in any glow.
```

### Lampe prismatique (Lampe, Grotte de cristal : niveau 40) · `lampe-prisme.png`

```
Use the attached image only as the style reference: same 2D cartoon game art, hand-painted, NOT a photo, NOT 3D, thick dark-brown outlines, soft cel shading, warm colors.

A single collectible game icon of a prism helmet lamp splitting light into a small rainbow, made to be worn by a small cute dragon miner (the character in the reference). Show ONLY the accessory, no character, no head, no body. Seen slightly from the front, centered, filling about 70 % of the image, crisp clean edges.

Square image 1024x1024. No text, no letters, no logo, no watermark, no frame, no background scenery, no ground, no shadow. Solid pure green background #00FF00 filling the whole image, no green on the accessory or in any glow.
```

### Casque de cristal royal (Casque, Grotte de cristal : niveau 50) · `casque-cristal-royal.png`

```
Use the attached image only as the style reference: same 2D cartoon game art, hand-painted, NOT a photo, NOT 3D, thick dark-brown outlines, soft cel shading, warm colors.

A single collectible game icon of a royal crystal miner helmet crowned with violet crystals, made to be worn by a small cute dragon miner (the character in the reference). Show ONLY the accessory, no character, no head, no body. Seen slightly from the front, centered, filling about 70 % of the image, crisp clean edges.

Square image 1024x1024. No text, no letters, no logo, no watermark, no frame, no background scenery, no ground, no shadow. Solid pure green background #00FF00 filling the whole image, no green on the accessory or in any glow.
```

### Foulard de suie (Foulard, Forge ancestrale : niveau 10) · `foulard-suie.png`

```
Use the attached image only as the style reference: same 2D cartoon game art, hand-painted, NOT a photo, NOT 3D, thick dark-brown outlines, soft cel shading, warm colors.

A single collectible game icon of a sooty grey scarf with burn marks, a forge worker look, made to be worn by a small cute dragon miner (the character in the reference). Show ONLY the accessory, no character, no head, no body. Seen slightly from the front, centered, filling about 70 % of the image, crisp clean edges.

Square image 1024x1024. No text, no letters, no logo, no watermark, no frame, no background scenery, no ground, no shadow. Solid pure green background #00FF00 filling the whole image, no green on the accessory or in any glow.
```

### Lampe d'enclume (Lampe, Forge ancestrale : niveau 20) · `lampe-enclume.png`

```
Use the attached image only as the style reference: same 2D cartoon game art, hand-painted, NOT a photo, NOT 3D, thick dark-brown outlines, soft cel shading, warm colors.

A single collectible game icon of a helmet lamp shaped like a tiny anvil with a hot glow, made to be worn by a small cute dragon miner (the character in the reference). Show ONLY the accessory, no character, no head, no body. Seen slightly from the front, centered, filling about 70 % of the image, crisp clean edges.

Square image 1024x1024. No text, no letters, no logo, no watermark, no frame, no background scenery, no ground, no shadow. Solid pure green background #00FF00 filling the whole image, no green on the accessory or in any glow.
```

### Casque nain (Casque, Forge ancestrale : niveau 30) · `casque-nain.png`

```
Use the attached image only as the style reference: same 2D cartoon game art, hand-painted, NOT a photo, NOT 3D, thick dark-brown outlines, soft cel shading, warm colors.

A single collectible game icon of a sturdy dwarven miner helmet with bronze bands and a braided crest, made to be worn by a small cute dragon miner (the character in the reference). Show ONLY the accessory, no character, no head, no body. Seen slightly from the front, centered, filling about 70 % of the image, crisp clean edges.

Square image 1024x1024. No text, no letters, no logo, no watermark, no frame, no background scenery, no ground, no shadow. Solid pure green background #00FF00 filling the whole image, no green on the accessory or in any glow.
```

### Foulard de forgeron (Foulard, Forge ancestrale : niveau 40) · `foulard-forgeron.png`

```
Use the attached image only as the style reference: same 2D cartoon game art, hand-painted, NOT a photo, NOT 3D, thick dark-brown outlines, soft cel shading, warm colors.

A single collectible game icon of a thick leather blacksmith scarf with a hammer badge, made to be worn by a small cute dragon miner (the character in the reference). Show ONLY the accessory, no character, no head, no body. Seen slightly from the front, centered, filling about 70 % of the image, crisp clean edges.

Square image 1024x1024. No text, no letters, no logo, no watermark, no frame, no background scenery, no ground, no shadow. Solid pure green background #00FF00 filling the whole image, no green on the accessory or in any glow.
```

### Casque de l'ancêtre (Casque, Forge ancestrale : niveau 50) · `casque-ancetre.png`

```
Use the attached image only as the style reference: same 2D cartoon game art, hand-painted, NOT a photo, NOT 3D, thick dark-brown outlines, soft cel shading, warm colors.

A single collectible game icon of an ancient dwarf-king miner helmet with gold runes and a gem, made to be worn by a small cute dragon miner (the character in the reference). Show ONLY the accessory, no character, no head, no body. Seen slightly from the front, centered, filling about 70 % of the image, crisp clean edges.

Square image 1024x1024. No text, no letters, no logo, no watermark, no frame, no background scenery, no ground, no shadow. Solid pure green background #00FF00 filling the whole image, no green on the accessory or in any glow.
```
