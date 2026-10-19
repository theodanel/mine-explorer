# Jackpot de la Forge

Demande de Théo (19/10/2026), lot 1 des idées inspirées de Forge Master : « petite chance jackpot deux paliers au-dessus (0,05 à 0,5 %, bien plus bas que ce qui avait été retiré). Un moment fort rare, sans casser la courbe ».

## Règles

- À chaque tirage de la Forge, **0,05 %** de chance d'obtenir un objet **deux paliers au-dessus** du palier de base du niveau de pioche (`JACKPOT_CHANCE` dans `balance/balance.ts`).
- La chance est prise sur la part du palier de base : la table reste à 100 %.
- Pas de jackpot au niveau 1 de la pioche (Bois seulement), ni quand le palier visé dépasserait le Divin (niveaux 28 à 30).
- Au rythme du joueur régulier (environ 200 forges par jour), cela fait environ 5 jackpots sur toute une partie.
- Un jackpot n'est **jamais vendu par les filtres** de la forge automatique : il est toujours montré au joueur.
- La Forge express, qui choisit elle-même la qualité, ne compte pas comme un jackpot.

## Mise en scène

- Un éclair doré couvre la forge, les étincelles sont plus grandes, un bandeau « Jackpot ! » jaillit au-dessus de l'objet.
- Son synthétisé dédié (`jackpot` dans `audio/synth.ts`) : le coup d'enclume, une montée de cloches sur deux octaves, une pluie de pièces.
- Dans « Probabilités de forge », la ligne du palier jackpot porte l'étiquette « Jackpot », et une phrase sous la table rappelle la règle.

## Simulateur

Profil régulier, 60 jours, 3 tirages : pioche 30 aux jours 27,8 / 28,8 / 27,9 avant, 27,8 / 27,3 / 28,3 après. L'écart (moins de 0,5 jour en moyenne) est du même ordre que le hasard entre deux tirages : 0,05 % ne bouge pas la courbe.

> La référence « pioche 30 vers le jour 47,8 » des anciennes notes ne correspond plus au simulateur actuel (jour 28 environ pour le profil régulier) : c'est cette valeur qui sert de garde-fou pour les lots suivants.
