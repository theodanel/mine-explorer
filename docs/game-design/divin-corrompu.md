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
| Éveil 1 | 300 | 25 | +5 % | |
| Éveil 2 | 900 | 60 | +12 % | +1 |
| Éveil 3 | 2 400 | 120 | +20 % | |
| Éveil 4 | 5 400 | 220 | +30 % | +1 (5 en tout) |
| Éveil 5 | 10 800 | 375 | +40 % | |

- **Panoplie** : avec les 5 pièces en Divin, le bonus de panoplie (+8 % de Frappe) gagne +2 % par palier de la pièce **la moins éveillée** (+18 % quand tout est à l'Éveil 5).
- **Résonance des runes** : avec 5 châsses, il suffit de 3 runes du même type sur une pièce ; seules ces runes résonnent.

## Avec la Renaissance (26/10/2026)

Idée de Théo : le Divin corrompu avance de vie en vie au lieu de se perdre.
- **Paliers liés aux renaissances** : l'Éveil 1 se fait dès la première vie, l'Éveil 2 demande d'avoir renaît 1 fois, l'Éveil 3 2 fois, l'Éveil 4 3 fois, l'Éveil 5 4 fois (en plus des doublons et des ressources).
- **L'Éveil compte sur toute pièce portée à l'emplacement** : après une renaissance, la première pièce forgée en profite déjà, et une pièce Divin reforgée est aussitôt corrompue. On éveille toujours depuis une pièce Divin.
- **Le bonus grandit avec les renaissances**, comme la dureté des filons : ×1,3 par renaissance (+40 % à l'Éveil 5, +114 % après 4 renaissances).

## Calibrage (simulateur, joueur régulier, 200 jours)

En fin de partie, la Forge sort environ 850 pièces Divin par jour (170 par emplacement). Les doublons ont été multipliés par 6 le 25/10/2026 (Théo les trouvait trop faciles) : ils freinent maintenant les derniers paliers, avec les ressources du Cœur. Depuis l'anneau dans l'ordre des étoiles, les ressources ne partent plus d'avance dans les runes : les premiers paliers arrivent plus tôt. Le joueur simulé passe 10 minutes par jour dans les Échos pour l'Éveil, après les runes.

| Les 5 pièces à | Jour |
|---|---|
| Éveil 1 | 23 |
| Éveil 2 | 30 |
| Éveil 3 | 69 |
| Éveil 4 | 91 |
| Éveil 5 | 137 |

Au jour 200 : Puissance ×2,9 par rapport à une partie sans Éveil, une zone de plus (23 au lieu de 22). Lancement : `node --import ./tools/register-ts.mjs tools/simulate.mts regulier 200` (et `--sans-eveil` pour comparer).

## Visuel

Dès l'Éveil 1, l'icône de la pièce passe à sa version corrompue (obsidienne veinée de lave), dessinée par Théo le 25/10/2026 à partir des prompts ci-dessous. Sa lueur orange grandit à chaque palier, et le cadre arc-en-ciel du Divin vire au brasier (`[data-awakening]` dans `styles.scss`). Sources dans `art-source/divin-corrompu/`, détourées par `preparer-divin-corrompu.py` vers `frontend/public/assets/ui/divin-corrompu/`.

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

## Les 5 phases (27/10/2026, remplace les paliers liés aux renaissances)

Décidé par Théo (doc « La Corruption : une fin de jeu pour chaque système ») : une vie = une phase.

- Phase N = les 5 emplacements éveillés au palier N. Elle se fait avec le Divin de la famille de la vie : la vie 1 forge du Bois → Divin, la vie 2 du « corrompu I », etc. Seuls les Divin de cette famille comptent comme doublons, et les doublons en trop repartent à zéro après un palier.
- Doublons : 3 000 pour la phase 1 (la vie 1 va jusqu'en zone 19-20 vers J40), puis 900, 2 400, 5 400, 10 800. Bonus +5/12/20/30/40 %, sans multiplicateur de renaissance.
- La phase de la vie ouvre la renaissance (plus la zone 20) ; après la phase 5, la zone 20. Renaître reste un choix : descendre plus loin rapporte plus de Braises (10 × (zone − 15)²).
- Familles : Frappe des pièces ×1 000 par famille, puis ×10 par renaissance après la phase 5 (« ✦N »). La Frappe seule (avant, les ✦ multipliaient aussi les dégâts critiques et l'or).
- Filons : ×80 par renaissance pendant les phases, puis ×3.
- Frappe ancestrale : coût 10 × 1,5^palier. Plafonds convertis : vitesse en trop → Frappe (1 point = +100 %), critique en trop → dégâts critiques (×2).

Simulateur (regulier, 80 jours) : phases J39 (zone 19), J46 (24), J57 (28), J67 (31), J78 (35).

Sceaux (lot 2) : branche « Sceaux » de l'arbre de compétences, un sceau par phase (3, 4, 5, 6 puis 7 points, +10 % de Frappe chacun). La phase N demande le sceau N : les points venant de la profondeur atteinte dans la vie, il faut descendre assez loin. Arbre complet + 5 sceaux = 92 points, soit la zone 32. Simulateur avec sceaux : phases J38 (zone 19), J51 (25), J60 (29), J70 (32), J78 (35). Icônes des pièces corrompues assombries et rougeoyantes en code, plus fort à chaque phase.
