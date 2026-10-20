# Tenues du dragon

Lot 7 des idées inspirées de Forge Master, demandé par Théo le 19/10/2026. Depuis le 20/10/2026 (passe de progression et donjons retirés à la demande de Théo), une tenue par zone terminée.

## Règles

- 20 tenues : un foulard, un casque ou une lampe pour le dragon, **une par zone terminée** (gardien battu), de la zone 1 à la 20. **Aucune stat par tenue.**
- La **collection** donne **+1 % de Frappe par tranche de 5 tenues**, **+4 %** avec les 20 (`balance/outfits.ts`).
- Les tenues se lisent dans la progression : rien n'est perdu.
- La tenue portée est retenue (`mine-explorer.tenues`). Elle ne change pas encore l'image du mineur : les visuels sont à générer (prompts ci-dessous). En attendant, les cartes affichent « visuel à venir ».

## Écran

Profil, carte « Tenues » : le bonus de collection, puis les 20 cartes (gagnées en couleur, les autres grisées avec la zone à terminer). Toucher une tenue gagnée la porte, la toucher encore l'enlève.

## Prompts Gemini des visuels (icônes de collection)

Chaque prompt se suffit à lui-même. Joins à chaque fois l'image en pied du mineur Apprenti (`art-source/evolutions/`) comme référence de style. Dépose chaque image (1024 × 1024, fond vert) dans `art-source/tenues/<identifiant>.png`, le nom est donné avant chaque prompt.

### Foulard bleu (Foulard, Terminer la zone 1) · `foulard-bleu.png`

```
Use the attached image only as the style reference: same 2D cartoon game art, hand-painted, NOT a photo, NOT 3D, thick dark-brown outlines, soft cel shading, warm colors.

A single collectible game icon of a simple sky-blue cotton miner scarf, knotted, made to be worn by a small cute dragon miner (the character in the reference). Show ONLY the accessory, no character, no head, no body. Seen slightly from the front, centered, filling about 70 % of the image, crisp clean edges.

Square image 1024x1024. No text, no letters, no logo, no watermark, no frame, no background scenery, no ground, no shadow. Solid pure green background #00FF00 filling the whole image, no green on the accessory or in any glow.
```

### Foulard vert (Foulard, Terminer la zone 2) · `foulard-vert.png`

```
Use the attached image only as the style reference: same 2D cartoon game art, hand-painted, NOT a photo, NOT 3D, thick dark-brown outlines, soft cel shading, warm colors.

A single collectible game icon of a moss-green cotton miner scarf with a small leaf stitch, made to be worn by a small cute dragon miner (the character in the reference). Show ONLY the accessory, no character, no head, no body. Seen slightly from the front, centered, filling about 70 % of the image, crisp clean edges.

Square image 1024x1024. No text, no letters, no logo, no watermark, no frame, no background scenery, no ground, no shadow. Solid pure green background #00FF00 filling the whole image, no green on the accessory or in any glow.
```

### Lampe cuivrée (Lampe, Terminer la zone 3) · `lampe-cuivre.png`

```
Use the attached image only as the style reference: same 2D cartoon game art, hand-painted, NOT a photo, NOT 3D, thick dark-brown outlines, soft cel shading, warm colors.

A single collectible game icon of a round copper helmet lamp with a warm orange glow, made to be worn by a small cute dragon miner (the character in the reference). Show ONLY the accessory, no character, no head, no body. Seen slightly from the front, centered, filling about 70 % of the image, crisp clean edges.

Square image 1024x1024. No text, no letters, no logo, no watermark, no frame, no background scenery, no ground, no shadow. Solid pure green background #00FF00 filling the whole image, no green on the accessory or in any glow.
```

### Casque riveté (Casque, Terminer la zone 4) · `casque-rivete.png`

```
Use the attached image only as the style reference: same 2D cartoon game art, hand-painted, NOT a photo, NOT 3D, thick dark-brown outlines, soft cel shading, warm colors.

A single collectible game icon of an iron miner helmet covered in big rivets, made to be worn by a small cute dragon miner (the character in the reference). Show ONLY the accessory, no character, no head, no body. Seen slightly from the front, centered, filling about 70 % of the image, crisp clean edges.

Square image 1024x1024. No text, no letters, no logo, no watermark, no frame, no background scenery, no ground, no shadow. Solid pure green background #00FF00 filling the whole image, no green on the accessory or in any glow.
```

### Foulard de braise (Foulard, Terminer la zone 5) · `foulard-braise.png`

```
Use the attached image only as the style reference: same 2D cartoon game art, hand-painted, NOT a photo, NOT 3D, thick dark-brown outlines, soft cel shading, warm colors.

A single collectible game icon of an ember-orange scarf with glowing spark patterns, dwarven forge style, made to be worn by a small cute dragon miner (the character in the reference). Show ONLY the accessory, no character, no head, no body. Seen slightly from the front, centered, filling about 70 % of the image, crisp clean edges.

Square image 1024x1024. No text, no letters, no logo, no watermark, no frame, no background scenery, no ground, no shadow. Solid pure green background #00FF00 filling the whole image, no green on the accessory or in any glow.
```

### Lampe dorée (Lampe, Terminer la zone 6) · `lampe-doree.png`

```
Use the attached image only as the style reference: same 2D cartoon game art, hand-painted, NOT a photo, NOT 3D, thick dark-brown outlines, soft cel shading, warm colors.

A single collectible game icon of an ornate golden helmet lamp with a bright yellow light, made to be worn by a small cute dragon miner (the character in the reference). Show ONLY the accessory, no character, no head, no body. Seen slightly from the front, centered, filling about 70 % of the image, crisp clean edges.

Square image 1024x1024. No text, no letters, no logo, no watermark, no frame, no background scenery, no ground, no shadow. Solid pure green background #00FF00 filling the whole image, no green on the accessory or in any glow.
```

### Casque elfique (Casque, Terminer la zone 7) · `casque-elfique.png`

```
Use the attached image only as the style reference: same 2D cartoon game art, hand-painted, NOT a photo, NOT 3D, thick dark-brown outlines, soft cel shading, warm colors.

A single collectible game icon of an elegant elven miner helmet with silver leaf engravings, made to be worn by a small cute dragon miner (the character in the reference). Show ONLY the accessory, no character, no head, no body. Seen slightly from the front, centered, filling about 70 % of the image, crisp clean edges.

Square image 1024x1024. No text, no letters, no logo, no watermark, no frame, no background scenery, no ground, no shadow. Solid pure green background #00FF00 filling the whole image, no green on the accessory or in any glow.
```

### Foulard de cristal (Foulard, Terminer la zone 8) · `foulard-cristal.png`

```
Use the attached image only as the style reference: same 2D cartoon game art, hand-painted, NOT a photo, NOT 3D, thick dark-brown outlines, soft cel shading, warm colors.

A single collectible game icon of a pale violet scarf with small crystal shards sewn on the edge, made to be worn by a small cute dragon miner (the character in the reference). Show ONLY the accessory, no character, no head, no body. Seen slightly from the front, centered, filling about 70 % of the image, crisp clean edges.

Square image 1024x1024. No text, no letters, no logo, no watermark, no frame, no background scenery, no ground, no shadow. Solid pure green background #00FF00 filling the whole image, no green on the accessory or in any glow.
```

### Lampe de magma (Lampe, Terminer la zone 9) · `lampe-magma.png`

```
Use the attached image only as the style reference: same 2D cartoon game art, hand-painted, NOT a photo, NOT 3D, thick dark-brown outlines, soft cel shading, warm colors.

A single collectible game icon of a black stone helmet lamp holding a glowing magma core, made to be worn by a small cute dragon miner (the character in the reference). Show ONLY the accessory, no character, no head, no body. Seen slightly from the front, centered, filling about 70 % of the image, crisp clean edges.

Square image 1024x1024. No text, no letters, no logo, no watermark, no frame, no background scenery, no ground, no shadow. Solid pure green background #00FF00 filling the whole image, no green on the accessory or in any glow.
```

### Casque divin (Casque, Terminer la zone 10) · `casque-divin.png`

```
Use the attached image only as the style reference: same 2D cartoon game art, hand-painted, NOT a photo, NOT 3D, thick dark-brown outlines, soft cel shading, warm colors.

A single collectible game icon of a white-gold divine miner helmet with a tiny sun emblem, made to be worn by a small cute dragon miner (the character in the reference). Show ONLY the accessory, no character, no head, no body. Seen slightly from the front, centered, filling about 70 % of the image, crisp clean edges.

Square image 1024x1024. No text, no letters, no logo, no watermark, no frame, no background scenery, no ground, no shadow. Solid pure green background #00FF00 filling the whole image, no green on the accessory or in any glow.
```

### Foulard de mousse (Foulard, Terminer la zone 11) · `foulard-mousse.png`

```
Use the attached image only as the style reference: same 2D cartoon game art, hand-painted, NOT a photo, NOT 3D, thick dark-brown outlines, soft cel shading, warm colors.

A single collectible game icon of a soft scarf made of glowing underground moss with tiny mushrooms, made to be worn by a small cute dragon miner (the character in the reference). Show ONLY the accessory, no character, no head, no body. Seen slightly from the front, centered, filling about 70 % of the image, crisp clean edges.

Square image 1024x1024. No text, no letters, no logo, no watermark, no frame, no background scenery, no ground, no shadow. Solid pure green background #00FF00 filling the whole image, no green on the accessory or in any glow.
```

### Lampe d'obsidienne (Lampe, Terminer la zone 12) · `lampe-obsidienne.png`

```
Use the attached image only as the style reference: same 2D cartoon game art, hand-painted, NOT a photo, NOT 3D, thick dark-brown outlines, soft cel shading, warm colors.

A single collectible game icon of a sharp black obsidian helmet lamp with a cold purple light, made to be worn by a small cute dragon miner (the character in the reference). Show ONLY the accessory, no character, no head, no body. Seen slightly from the front, centered, filling about 70 % of the image, crisp clean edges.

Square image 1024x1024. No text, no letters, no logo, no watermark, no frame, no background scenery, no ground, no shadow. Solid pure green background #00FF00 filling the whole image, no green on the accessory or in any glow.
```

### Casque de givre (Casque, Terminer la zone 13) · `casque-givre.png`

```
Use the attached image only as the style reference: same 2D cartoon game art, hand-painted, NOT a photo, NOT 3D, thick dark-brown outlines, soft cel shading, warm colors.

A single collectible game icon of an icy blue miner helmet with frost crystals on the rim, made to be worn by a small cute dragon miner (the character in the reference). Show ONLY the accessory, no character, no head, no body. Seen slightly from the front, centered, filling about 70 % of the image, crisp clean edges.

Square image 1024x1024. No text, no letters, no logo, no watermark, no frame, no background scenery, no ground, no shadow. Solid pure green background #00FF00 filling the whole image, no green on the accessory or in any glow.
```

### Foulard d'ombre (Foulard, Terminer la zone 14) · `foulard-ombre.png`

```
Use the attached image only as the style reference: same 2D cartoon game art, hand-painted, NOT a photo, NOT 3D, thick dark-brown outlines, soft cel shading, warm colors.

A single collectible game icon of a dark violet scarf trailing wisps of shadow, made to be worn by a small cute dragon miner (the character in the reference). Show ONLY the accessory, no character, no head, no body. Seen slightly from the front, centered, filling about 70 % of the image, crisp clean edges.

Square image 1024x1024. No text, no letters, no logo, no watermark, no frame, no background scenery, no ground, no shadow. Solid pure green background #00FF00 filling the whole image, no green on the accessory or in any glow.
```

### Lampe d'aurore (Lampe, Terminer la zone 15) · `lampe-aurore.png`

```
Use the attached image only as the style reference: same 2D cartoon game art, hand-painted, NOT a photo, NOT 3D, thick dark-brown outlines, soft cel shading, warm colors.

A single collectible game icon of a helmet lamp shining pink and gold dawn light, made to be worn by a small cute dragon miner (the character in the reference). Show ONLY the accessory, no character, no head, no body. Seen slightly from the front, centered, filling about 70 % of the image, crisp clean edges.

Square image 1024x1024. No text, no letters, no logo, no watermark, no frame, no background scenery, no ground, no shadow. Solid pure green background #00FF00 filling the whole image, no green on the accessory or in any glow.
```

### Casque de corail (Casque, Terminer la zone 16) · `casque-corail.png`

```
Use the attached image only as the style reference: same 2D cartoon game art, hand-painted, NOT a photo, NOT 3D, thick dark-brown outlines, soft cel shading, warm colors.

A single collectible game icon of a coral-red miner helmet with sea shell details, made to be worn by a small cute dragon miner (the character in the reference). Show ONLY the accessory, no character, no head, no body. Seen slightly from the front, centered, filling about 70 % of the image, crisp clean edges.

Square image 1024x1024. No text, no letters, no logo, no watermark, no frame, no background scenery, no ground, no shadow. Solid pure green background #00FF00 filling the whole image, no green on the accessory or in any glow.
```

### Foulard étoilé (Foulard, Terminer la zone 17) · `foulard-etoile.png`

```
Use the attached image only as the style reference: same 2D cartoon game art, hand-painted, NOT a photo, NOT 3D, thick dark-brown outlines, soft cel shading, warm colors.

A single collectible game icon of a midnight-blue scarf sprinkled with small golden stars, made to be worn by a small cute dragon miner (the character in the reference). Show ONLY the accessory, no character, no head, no body. Seen slightly from the front, centered, filling about 70 % of the image, crisp clean edges.

Square image 1024x1024. No text, no letters, no logo, no watermark, no frame, no background scenery, no ground, no shadow. Solid pure green background #00FF00 filling the whole image, no green on the accessory or in any glow.
```

### Lampe spectrale (Lampe, Terminer la zone 18) · `lampe-spectrale.png`

```
Use the attached image only as the style reference: same 2D cartoon game art, hand-painted, NOT a photo, NOT 3D, thick dark-brown outlines, soft cel shading, warm colors.

A single collectible game icon of a ghostly teal helmet lamp with a floating spirit flame, made to be worn by a small cute dragon miner (the character in the reference). Show ONLY the accessory, no character, no head, no body. Seen slightly from the front, centered, filling about 70 % of the image, crisp clean edges.

Square image 1024x1024. No text, no letters, no logo, no watermark, no frame, no background scenery, no ground, no shadow. Solid pure green background #00FF00 filling the whole image, no green on the accessory or in any glow.
```

### Casque du gardien (Casque, Terminer la zone 19) · `casque-gardien.png`

```
Use the attached image only as the style reference: same 2D cartoon game art, hand-painted, NOT a photo, NOT 3D, thick dark-brown outlines, soft cel shading, warm colors.

A single collectible game icon of a heavy stone guardian helmet with two small horns and glowing runes, made to be worn by a small cute dragon miner (the character in the reference). Show ONLY the accessory, no character, no head, no body. Seen slightly from the front, centered, filling about 70 % of the image, crisp clean edges.

Square image 1024x1024. No text, no letters, no logo, no watermark, no frame, no background scenery, no ground, no shadow. Solid pure green background #00FF00 filling the whole image, no green on the accessory or in any glow.
```

### Foulard du Cœur (Foulard, Terminer la zone 20) · `foulard-coeur.png`

```
Use the attached image only as the style reference: same 2D cartoon game art, hand-painted, NOT a photo, NOT 3D, thick dark-brown outlines, soft cel shading, warm colors.

A single collectible game icon of a lava-red scarf with a glowing heart-of-the-world emblem, made to be worn by a small cute dragon miner (the character in the reference). Show ONLY the accessory, no character, no head, no body. Seen slightly from the front, centered, filling about 70 % of the image, crisp clean edges.

Square image 1024x1024. No text, no letters, no logo, no watermark, no frame, no background scenery, no ground, no shadow. Solid pure green background #00FF00 filling the whole image, no green on the accessory or in any glow.
```
