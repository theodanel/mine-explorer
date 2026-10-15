# Chasse au filon

Aventure du Contremaître. Première version le 14/10/2026 en démineur, que Théo n'a pas trouvé fun ; refaite le 15/10/2026 en « Quitte ou double », le choix de Théo. Elle avait elle-même remplacé le Wagonnet fou, retiré du jeu (son ancienne sauvegarde, `mine-explorer.minecart`, est ignorée).

## Règles

- **3 parties par jour**, remises à minuit ; une partie compte dès le départ, et pour la mission du jour « Joue une aventure ».
- **La file** : dix rochers, un par zone (zone 1 à 10), du plus tendre au plus dur. On les casse l'un après l'autre en touchant le rocher du moment.
- **Chaque rocher** ajoute son butin à la cagnotte, de plus en plus gros :
  - minerais de la zone : 2 au premier rocher, +1 par rocher ;
  - or : 0,3 filon au premier, +0,15 par rocher ;
  - à partir du 5e rocher, un sur quatre cache un coffre : +2 filons d'or et +8 minerais.
- **L'éboulement** : chaque rocher peut s'effondrer et emporter toute la cagnotte.
  - Risque : 8 % au premier rocher, +4 % par rocher déjà cassé (44 % au dixième).
  - La Chance (bonus d'or) le réduit de 30 % pour +20 % d'or, au plus de 40 %. Corrigé le 15/10/2026 : à 30 % pour +100 %, la Chance ne servait presque à rien, le bonus d'or plafonnant vers +20 % en fin de partie.
- **Les étais** viennent de la Puissance : un à la Puissance conseillée de la zone, un de plus à chaque doublement au-dessus (jusqu'à 3), aucun en dessous. Chaque étai retient un éboulement : ce rocher ne rapporte rien, mais la cagnotte reste.
- **Encaisser** se fait quand on veut, dès le premier rocher cassé. Casser les dix rochers encaisse d'office avec un bonus de +50 %.
- L'or est compté en filons de la zone où joue le mineur, figés au départ de la partie. Le Puits garde les éclats.

## Technique

- **Fichiers** :
  - chiffres dans `balance/minehunt.ts` ;
  - moteur pur dans `minehunt/minehunt-game.ts` (`startGamble`, `breakRock`, `cashOut`, `nextRisk`) ;
  - parties du jour et sauvegarde dans `minehunt-rules.ts` (clé `mine-explorer.minehunt`, inchangée) ;
  - service `minehunt.ts` et page `minehunt-page/`.
- **Visuels**, tous déjà présents dans le jeu, sans nouvelle image Gemini :
  - les rochers des zones 1 à 10 (`rockUrl`) pour la file ;
  - `assets/ui/aventures/eboulement.webp` pour l'éboulement ;
  - le coffre, la pépite, l'icône du minerai de la zone, et l'icône du bois pour les étais.
- **Animations** : le rocher tremble sous la pioche, le butin jaillit avec des rayons, l'éboulement tombe d'en haut et toute la page tremble ; un étai qui tient s'affiche sous l'éboulement. La jauge de risque passe au rouge au-delà de 25 %.
