# Divin corrompu : l'Éveil des pièces Divin

Retour à [[Accueil]]. Décidé le 21/10/2026 par Théo, sur une proposition du projet : « oui j'aime bien l'idée, met ça en place, et pour le visuel envoie les prompts ». Le problème, remonté par un ami : une fois tout l'équipement en Divin, la Forge et la Forge express ne servaient plus à rien.

## Règles

- **Ouverture** : à la Légende du Cœur du monde (1re étoile).
- **Doublons Divin** : chaque pièce Divin vendue (Forge, forge automatique ou Forge express) met un doublon de côté **pour son emplacement**. Une pioche Divin vendue paie l'Éveil de la pioche.
- **Éveil** : 5 paliers par emplacement. Un seul bouton « Éveiller », sur la fiche de la pièce (toucher une pièce portée dans la barre d'équipement). Pas de nouvel onglet.
- **L'Éveil appartient à l'emplacement**, comme les runes serties : une meilleure pièce Divin garde l'Éveil de l'ancienne. Il ne compte que si la pièce portée est Divin.
- **Coût d'un palier** : des doublons Divin de la pièce et une ressource du Cœur, celle de l'élément de la pièce (Braise pour la pioche, Givre pour les gants, Brume pour le casque, Sève pour les bottes, Éclat d'aurore pour le sac).

| Palier | Doublons | Ressources du Cœur | Stats de la pièce | Châsse de rune |
|---|---|---|---|---|
| Éveil 1 | 50 | 25 | +5 % | |
| Éveil 2 | 150 | 60 | +12 % | +1 |
| Éveil 3 | 400 | 120 | +20 % | |
| Éveil 4 | 900 | 220 | +30 % | +1 (5 en tout) |
| Éveil 5 | 1 800 | 375 | +40 % | |

- **Panoplie** : avec les 5 pièces en Divin, le bonus de panoplie (+8 % de Frappe) gagne +2 % par palier de la pièce **la moins éveillée** (+18 % quand tout est à l'Éveil 5).
- **Résonance des runes** : avec 5 châsses, il suffit de 3 runes du même type sur une pièce ; seules ces runes résonnent.

## Calibrage (simulateur, joueur régulier, 200 jours)

En fin de partie, la Forge sort environ 850 pièces Divin par jour (170 par emplacement) : les doublons rythment les premiers paliers, les ressources du Cœur les derniers. Le joueur simulé passe 10 minutes par jour dans les Échos pour l'Éveil, après les runes.

| Les 5 pièces à | Jour |
|---|---|
| Éveil 1 | 44 |
| Éveil 2 | 50 |
| Éveil 3 | 63 |
| Éveil 4 | 86 |
| Éveil 5 | 119 |

Au jour 200 : Puissance ×2,9 par rapport à une partie sans Éveil, une zone de plus (23 au lieu de 22). Lancement : `node --import ./tools/register-ts.mjs tools/simulate.mts regulier 200` (et `--sans-eveil` pour comparer).

## Visuel

Provisoire, en attendant l'art : la pièce s'assombrit à chaque palier et une lueur orange monte (`[data-awakening]` dans `styles.scss`), jusqu'au noir veiné d'orange de l'Éveil 5. Le cadre passe de l'or au brasier.

Prompts Gemini des versions corrompues (Éveil 5), à générer puis déposer dans `art-source/divin-corrompu/` (casque.png, pioche.png, sac.png, gants.png, bottes.png). Joindre en image de référence l'icône actuelle de la pièce (`frontend/public/assets/ui/helmet.webp`, `pickaxes/divin.webp`, `backpack.webp`, `gloves.webp`, `boots.webp`).

### Casque

```
Crée une icône de jeu vidéo : un casque de mineur « Divin corrompu ». Style : illustration 2D cartoon peinte à la main, comme un jeu mobile idle façon Legend of Mushroom, contours épais brun foncé, couleurs riches, ombrage doux peint ; surtout pas de photo, pas de rendu 3D, pas de réalisme. Le casque reprend la forme exacte du casque de mineur de l'image de référence (casque arrondi avec sa lampe frontale), mais corrompu : métal d'obsidienne noir mat, fissuré, parcouru de fines veines de lave orange lumineuses ; la lampe frontale brille d'une lueur orange-rouge ; quelques braises flottent autour ; légère aura sombre. Cadrage : l'objet seul, centré, vu de trois quarts, occupant environ 80 % d'une image carrée 1024×1024. Fond : vert uni #00FF00, sans dégradé ni ombre portée sur le fond. Aucun texte, aucune lettre, aucun chiffre, aucun cadre. Utilise l'image jointe comme référence de forme et de style.
```

### Pioche

```
Crée une icône de jeu vidéo : une pioche « Divin corrompu ». Style : illustration 2D cartoon peinte à la main, comme un jeu mobile idle façon Legend of Mushroom, contours épais brun foncé, couleurs riches, ombrage doux peint ; surtout pas de photo, pas de rendu 3D, pas de réalisme. La pioche reprend la silhouette exacte de la pioche divine de l'image de référence, mais corrompue : tête en obsidienne noire mate, fissurée, parcourue de veines de lave orange lumineuses, pointes rougeoyantes ; manche sombre cerclé de métal noirci ; quelques braises et une fine fumée sombre s'en échappent. Cadrage : l'objet seul, centré, en diagonale, occupant environ 80 % d'une image carrée 1024×1024. Fond : vert uni #00FF00, sans dégradé ni ombre portée sur le fond. Aucun texte, aucune lettre, aucun chiffre, aucun cadre. Utilise l'image jointe comme référence de forme et de style.
```

### Sac

```
Crée une icône de jeu vidéo : un sac de mineur « Divin corrompu ». Style : illustration 2D cartoon peinte à la main, comme un jeu mobile idle façon Legend of Mushroom, contours épais brun foncé, couleurs riches, ombrage doux peint ; surtout pas de photo, pas de rendu 3D, pas de réalisme. Le sac reprend la forme exacte du sac à dos de l'image de référence (rabat, boucle, sangles), mais corrompu : cuir noirci presque noir, coutures et boucle en métal d'obsidienne, fissures traversées de veines de lave orange lumineuses, une lueur orange s'échappe du rabat entrouvert ; quelques braises flottent autour. Cadrage : l'objet seul, centré, vu de trois quarts, occupant environ 80 % d'une image carrée 1024×1024. Fond : vert uni #00FF00, sans dégradé ni ombre portée sur le fond. Aucun texte, aucune lettre, aucun chiffre, aucun cadre. Utilise l'image jointe comme référence de forme et de style.
```

### Gants

```
Crée une icône de jeu vidéo : une paire de gants de mineur « Divin corrompu ». Style : illustration 2D cartoon peinte à la main, comme un jeu mobile idle façon Legend of Mushroom, contours épais brun foncé, couleurs riches, ombrage doux peint ; surtout pas de photo, pas de rendu 3D, pas de réalisme. Les gants reprennent la forme exacte des gants de l'image de référence, mais corrompus : cuir noirci presque noir renforcé de plaques d'obsidienne, jointures fissurées d'où sortent des veines de lave orange lumineuses, bouts des doigts rougeoyants ; quelques braises flottent autour. Cadrage : la paire seule, centrée, occupant environ 80 % d'une image carrée 1024×1024. Fond : vert uni #00FF00, sans dégradé ni ombre portée sur le fond. Aucun texte, aucune lettre, aucun chiffre, aucun cadre. Utilise l'image jointe comme référence de forme et de style.
```

### Bottes

```
Crée une icône de jeu vidéo : une paire de bottes de mineur « Divin corrompu ». Style : illustration 2D cartoon peinte à la main, comme un jeu mobile idle façon Legend of Mushroom, contours épais brun foncé, couleurs riches, ombrage doux peint ; surtout pas de photo, pas de rendu 3D, pas de réalisme. Les bottes reprennent la forme exacte des bottes de l'image de référence (lacets, semelles épaisses), mais corrompues : cuir noirci presque noir, semelles et coques en obsidienne fissurée, veines de lave orange lumineuses le long des coutures, lacets rougeoyants ; un peu de braise et de fumée sombre au sol sous les semelles. Cadrage : la paire seule, centrée, vue de trois quarts, occupant environ 80 % d'une image carrée 1024×1024. Fond : vert uni #00FF00, sans dégradé ni ombre portée sur le fond. Aucun texte, aucune lettre, aucun chiffre, aucun cadre. Utilise l'image jointe comme référence de forme et de style.
```
