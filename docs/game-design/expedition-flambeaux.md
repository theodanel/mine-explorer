# Expédition aux flambeaux

Aventure de la Légende, la dernière forme du mineur, validée par Théo le 14/10/2026 et codée le 15/10/2026. Elle donne une raison d'atteindre la Légende, et sa récompense propre : des pierres d'éveil pour les compagnons.

## Règles

- **2 expéditions par jour**, remises à minuit ; une expédition compte dès le départ, et pour la mission du jour « Joue une aventure ».
- **La grotte** : 7 colonnes sur 9 rangées, tirée au hasard à chaque expédition. Le mineur part du bas, au milieu.
  - Le trésor dort dans les 3 rangées du haut.
  - 9 rochers bloquent le passage ; il reste toujours un chemin jusqu'au trésor.
  - 6 monstres, 7 pierres d'éveil, 2 coffres, 3 fioles d'huile.
  - Rien ne bloque ni n'attaque à côté du départ.
- **La torche** n'éclaire que les cases autour du mineur, diagonales comprises. Les cases déjà vues restent sur la carte, sans ce qui s'y cache.
  - La Chance l'agrandit d'une case dès +15 % de bonus d'or.
  - Les yeux des monstres et la lueur du trésor se voient une case plus loin que la lumière.
- **Avancer** : on touche une case voisine (haut, bas, gauche, droite). Chaque pas coûte 1 pas sur 30.
- **Ce qu'on trouve** :
  - pierre d'éveil : +1 pierre ;
  - coffre : +2 pierres et 3 filons d'or ;
  - huile : +4 pas ;
  - monstre : il coûte 2 pas à la Puissance conseillée de la zone, 4 en dessous, et lâche une pierre.
- **La fin** :
  - le trésor (le coffre rare) termine l'expédition : +5 pierres, 10 filons d'or, et 30 % de chance d'un œuf au moins rare ;
  - à court de pas, la torche s'éteint : on garde ce qu'on a ramassé ;
  - on peut aussi rentrer au camp quand on veut.

  Il faut donc choisir entre ramasser ce qu'on voit et filer au trésor avant d'être à court de pas.

## Technique

- **Fichiers** :
  - chiffres dans `balance/torchlight.ts` ;
  - moteur pur dans `torchlight/torchlight-game.ts` (`generateCave`, `startExpedition`, `step`, `isLit`, `isGlimpsed`) ;
  - service `torchlight.ts` (parties du jour, clé `mine-explorer.torchlight`, et butin) ;
  - page `torchlight-page/`.
- **Visuels** :
  - images Gemini : la carte, la torche (compteur de pas), le monstre et la dalle du sol, préparées par `art-source/aventures/preparer-aventures.py` ;
  - visuels du jeu : la fiole du mineur pour l'huile, le sac d'or pour les coffres, le coffre des événements pour le trésor, la pierre d'éveil, le rocher de la zone 4, le portrait de la Légende pour le mineur ;
  - la flamme sur l'épaule du mineur est dessinée en CSS.
- **Animations** : la lumière faiblit avec la distance, les cases où avancer respirent, la flamme vacille, les yeux clignent, la grotte tremble sous un monstre, et une annonce dit ce qu'on vient de trouver.
