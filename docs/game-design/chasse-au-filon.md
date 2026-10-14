# Chasse au filon

Aventure du Contremaître, validée par Théo le 14/10/2026 : un démineur version mine, en 2D plate. Elle remplace le Wagonnet fou, retiré du jeu (Théo le trouvait raté). Son ancienne sauvegarde, `mine-explorer.minecart`, est simplement ignorée.

## Règles

- **3 parties par jour**, remises à minuit ; une partie compte dès le départ, et pour la mission du jour « Joue une aventure ».
- **La paroi** : 6 × 8 cases, dont 8 poches de grisou et 1 coffre. Les autres cases cachent :
  - du minerai, 22 % ;
  - une pépite, 10 % (+10 % par +100 % de bonus d'or) ;
  - sinon rien.
- **Creuser** : on touche une case.
  - Une case vide montre combien de grisous l'entourent, comme au démineur.
  - Une case sans grisou autour ouvre aussi ses voisines, en cascade.
- **Le grisou** abîme la pioche. Sa résistance vient de la Puissance :
  - 3 coups à la Puissance conseillée de la zone ;
  - un de plus à chaque doublement au-dessus, jusqu'à 5 ;
  - un de moins sous la moitié, au moins 2.
- **La Chance** (bonus d'or) ouvre 1 à 3 cases sans grisou au départ et ajoute des pépites.
- **Remonter quand on veut** garde tout le butin. Si la pioche casse, on ne garde que la moitié.
- **Butin** :
  - 2 minerais de la zone par case de minerai ;
  - un tiers de filon d'or par pépite ;
  - le coffre : 4 filons d'or et 10 minerais.

  Le Puits garde les éclats.

## Technique

- **Fichiers** :
  - chiffres dans `balance/minehunt.ts` ;
  - moteur pur dans `minehunt/minehunt-game.ts` (paroi, indices, cascade) ;
  - butin et sauvegarde dans `minehunt-rules.ts` (clé `mine-explorer.minehunt`) ;
  - service `minehunt.ts` et page `minehunt-page/`.
- **Animations** : les cases s'ouvrent en vague, le butin saute, le grisou gonfle en nuage vert et la paroi tremble, et le bilan rayonne quand le coffre est trouvé.
- **Visuels provisoires** en attendant les images Gemini (prompts dans [[aventures-prompts]]) : cases et grisou en CSS, coffre et pépite du jeu.
