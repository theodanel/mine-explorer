# Astre du Cœur

Retour à [[Accueil]]. Décidé le 26/10/2026 par Théo : le Creuset (créer des runes, les faire grandir, les sertir dans l'anneau) faisait trop d'étapes pour un résultat simple ; « un autre concept qui change du lot », « similaire au compagnon mais en rapport avec les étoiles ». Ce document est à valider **avant** le code. Les chiffres seront calés au simulateur.

## L'idée

Une petite étoile vivante, l'**Astre du Cœur**, remplace l'anneau et les runes de la Forge du Cœur. Elle naît à la Légende de la mine, grandit quand on la nourrit avec les ressources des Échos, change d'apparence à chaque stade et gagne des pouvoirs. Ses 5 stades **sont** les 5 étoiles de la Légende du Cœur du monde.

## Les 5 stades

| Stade | Étoile | Ressources pour y arriver (cumul à caler) | Apparence | Pouvoir débloqué |
|---|---|---|---|---|
| 1. Étincelle | ★1 | 10 | Une petite braise qui flotte | Elle suit le mineur et frappe avec lui (5 % de sa Frappe, toutes les 2 s) |
| 2. Éclat | ★2 | 35 | Une étoile à 4 branches | Une chance sur 10 de ramasser une ressource de plus dans les Échos |
| 3. Flamme | ★3 | 110 | Une étoile enflammée avec un visage | Sa frappe passe à 15 %, ramassage une chance sur 5 |
| 4. Soleil | ★4 | 300 | Un petit soleil rayonnant | Pluie d'étoiles sur le gardien de zone, au début de chaque combat |
| 5. Supernova | ★5 | 1 300 | Un astre éclatant entouré d'anneaux | Sa frappe passe à 30 %, la pluie d'étoiles s'abat aussi sur chaque 5e filon |

- Comme aujourd'hui, une étoile demande aussi ses missions : l'Astre remplace seulement les 2 runes de l'anneau.
- Le cumul vise les mêmes jours qu'avec les runes (étoiles aux jours 19, 26, 34, 44 et 58 au simulateur : l'Astre ne retient plus la 5e étoile comme le faisait la rune de rang 5).

## La nourriture : ton Astre à toi

- On nourrit l'Astre depuis sa page, une ressource à la fois ou « tout donner ». Toutes les ressources comptent pour le faire grandir.
- **Chaque élément le teinte et le renforce dans son domaine**, selon la part qu'il représente dans tout ce qu'on lui a donné :

| Ressource | Couleur | Bonus de l'Astre |
|---|---|---|
| Braise vive | Rouge | Frappe |
| Givre ancien | Bleu glacé | Chance de critique |
| Brume d'ombre | Violet | Dégâts critiques |
| Sève de pierre | Vert mousse | Vitesse |
| Éclat d'aurore | Or | Or |

- Le bonus total grandit avec le stade. Un Astre nourri surtout de Braise est rouge et tape fort ; un Astre équilibré a un peu de tout. Deux joueurs n'ont pas le même Astre, et il se voit sur la fiche ouverte depuis le chat.

## Les éclats d'Astre (runes d'équipement)

Les châsses d'équipement restent (une par étoile, deux de plus par l'Éveil du Divin corrompu), mais plus de runes à fabriquer : on choisit un élément pour la châsse et on la nourrit directement avec ses ressources, comme une jauge, jusqu'au rang 5. Mêmes effets qu'aujourd'hui (affinité ×1,5, résonance à 3 éclats du même élément sur une pièce).

## Ce que deviennent les sauvegardes

- L'Astre démarre au stade de l'étoile déjà obtenue (un joueur ★3 a un Astre au stade 3), avec la couleur de ses runes déjà serties.
- Les runes en réserve sont rendues en ressources (ce qu'elles avaient coûté).
- Les runes serties sur l'équipement deviennent des éclats du même élément et du même rang.

## Visuel : dessiné en code

Choix de Théo (26/10/2026) après des essais d'images refusés : un cercle à 5 pointes dessiné en PixiJS (`mine-scene/astre-view.ts`), qui flotte en haut à gauche du mineur, derrière lui, tourne lentement et monte et descend. Chaque pointe s'allume à un stade ; terne au stade 1, il brille de plus en plus. Sa couleur est le mélange de ses ressources. Toutes les 2 s il lance un éclat d'étoile sur le filon ; aux stades 4 et 5, une pluie d'étoiles frappe le gardien dès le début du combat. La page de la Forge du Cœur reprend le même cercle en SVG.

## Constellation (fin de jeu)

Choix de Théo (26/10/2026) : en fin de jeu, l'Astre doit apporter de vraies stats et demander un vrai effort. Après Supernova, chaque renaissance ouvre un niveau de Constellation. Pour l'allumer, il faut trois choses :

- l'avoir nourri : 120 ressources pour le 1er niveau, puis 20 % de plus à chaque niveau ;
- réussir son épreuve : atteindre la zone 20 + 2 × niveau dans la vie en cours, alors que les filons durcissent à chaque renaissance ;
- appuyer sur « Allumer ».

Chaque niveau ajoute +50 % de la puissance de Supernova à ses bonus, à sa frappe et à sa pluie d'étoiles. Le niveau est gardé dans la sauvegarde et ne se perd pas à la renaissance. En mine, chaque niveau ajoute une petite étoile en orbite (12 au plus). Le visuel est devenu une constellation : chaque stade allume une étoile et le trait vers sa voisine, puis l'étoile intérieure s'illumine à Supernova.
