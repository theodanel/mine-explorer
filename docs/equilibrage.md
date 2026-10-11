# Équilibrage de Mine Explorer

Tous les chiffres de ce document viennent de `frontend/src/app/balance/balance.ts`, le seul fichier à modifier pour rééquilibrer le jeu. Les tests de `balance.spec.ts` vérifient les intentions décrites ici : si un réglage les casse, revois ce document en même temps.

Inspirations : Forge Master (pioche à segments, paliers en fenêtre glissante), Legends of Mushroom et Freaky Duckling (Puissance recommandée, progression automatique).

## La boucle

1. **Miner.** Le mineur tape en continu. Chaque coup retire des PV à la vie de la zone et rapporte 1 pièce par PV miné (plus le bonus du sac). Un coup a 8 % de chances de faire tomber un éclat de géode.
2. **Changer de zone.** Quand la vie de la zone tombe à zéro, le joueur passe tout seul à la zone suivante et reçoit 10 éclats. Il n'y a ni boss ni chrono.
3. **Forger.** 2 éclats = 1 tirage. Le palier de matériau de l'objet dépend uniquement du niveau de la pioche, et son niveau est celui de la pioche.
4. **Équiper ou vendre.** La fenêtre de comparaison montre le gain ou la perte de Puissance, avec une flèche ▲ ou ▼. Équiper vend l'ancien objet, et la vente rapporte de l'or.
5. **Puissance.** C'est le chiffre central, calculé à partir de l'équipement. Chaque zone affiche sa Puissance recommandée et le temps restant à la Puissance actuelle.
6. **Le mur, en temps.** La vie double à chaque zone. Si le joueur n'améliore rien, chaque zone prend deux fois plus de temps que la précédente : la Puissance recommandée passe au rouge et le temps restant s'allonge.
7. **Améliorer la pioche.** L'or remplit les 10 segments d'un niveau de pioche. Chaque niveau décale la fenêtre des paliers vers de meilleurs matériaux, et les objets forgés deviennent plus forts : on revient à l'étape 3.

L'or n'a qu'un usage, la pioche, et c'est un gros puits. Les éclats ne servent qu'à forger.

## Stats

| Stat | Emplacement | Rôle | Base du mineur |
|---|---|---|---|
| Frappe | Pioche | Dégâts d'un coup | 5 |
| Vitesse | Bottes | Coups par seconde en plus | 0 % |
| Critique | Gants | Chance de critique | 5 % |
| Dégâts crit. | Casque | Bonus de dégâts d'un critique | +50 % |
| Bonus d'or | Sac | Or en plus par PV miné | 0 % |

## Formules

- **Coups par seconde** = 12/23 × (1 + Vitesse). L'animation compte 23 frames jouées à 12 fps.
- **Dégâts moyens d'un coup** = Frappe × (1 + Critique × Dégâts crit.)
- **Puissance** = Dégâts moyens × Coups par seconde × 100. Le mineur sans équipement est à 267.
- **Vie d'une zone** = 1 200 × 2^(zone − 1)
- **Puissance recommandée** = la Puissance qui mine la zone en 3 minutes = vie ÷ 180 × 100
- **Temps restant** = PV restants ÷ Puissance × 100 secondes
- **Or** = dégâts × (1 + Bonus d'or)
- **Éclats** : 8 % de chance par coup, plus 10 à chaque zone terminée
- **Stat principale d'un objet** = base × croissance du palier^palier × croissance du niveau^(niveau − 1), avec une variation de ±10 %
  - Frappe : base 4, ×1,6 par palier, ×1,1 par niveau
  - Pourcentages (vitesse 5 %, critique 3 %, dégâts crit. 15 %, or 8 %) : ×1,2 par palier, ×1,01 par niveau. Ils grimpent lentement parce qu'ils se multiplient entre eux.
- **Stats secondaires** : 50 % d'une stat principale. Aucune de Bois à Cuivre, 1 de Fer à Or, 2 de Mithril à Magma, 3 en Divin.
- **Vente** = 5 × 2^palier × 1,08^(niveau − 1) pièces
- **Segment de pioche** = 8 × 1,32^(niveau − 1) pièces, et 10 segments font un niveau
- **Plafonds** : Vitesse +200 %, Critique 100 %

## Pioche : chances par palier et coûts

Le joueur voit ces chances en jeu dans la fenêtre « Probabilités de forge », pour son niveau et le suivant.

- La toute première pioche ne forge que du Bois.
- Ensuite, la fenêtre de 4 paliers (précédent, base, suivant, encore au-dessus) monte d'un cran tous les 3 niveaux. Les paliers supérieurs arrivent par petites touches (0,5 %, puis 2 %, puis 5 %), et l'ancien palier s'efface sur 3 niveaux.
- La Puissance moyenne est celle d'un joueur équipé sur les 5 emplacements d'objets moyens pour ce niveau, sans stats secondaires.

| Pioche | Bois | Pierre | Cuivre | Fer | Acier | Or | Mithril | Cristal | Magma | Divin | Segment | Niveau complet | Puissance moyenne |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 100 % | · | · | · | · | · | · | · | · | · | 8 | 80 | 519 |
| 2 | 88 % | 11,5 % | 0,5 % | · | · | · | · | · | · | · | 11 | 110 | 563 |
| 3 | 75 % | 23 % | 2 % | · | · | · | · | · | · | · | 14 | 140 | 618 |
| 4 | 25 % | 70 % | 5 % | · | · | · | · | · | · | · | 18 | 180 | 759 |
| 5 | 10 % | 78 % | 11,5 % | 0,5 % | · | · | · | · | · | · | 24 | 240 | 867 |
| 6 | 3 % | 72 % | 23 % | 2 % | · | · | · | · | · | · | 32 | 320 | 1 001 |
| 7 | · | 25 % | 70 % | 5 % | · | · | · | · | · | · | 42 | 420 | 1 316 |
| 8 | · | 10 % | 78 % | 11,5 % | 0,5 % | · | · | · | · | · | 56 | 560 | 1 550 |
| 9 | · | 3 % | 72 % | 23 % | 2 % | · | · | · | · | · | 74 | 740 | 1 844 |
| 10 | · | · | 25 % | 70 % | 5 % | · | · | · | · | · | 97 | 970 | 2 535 |
| 11 | · | · | 10 % | 78 % | 11,5 % | 0,5 % | · | · | · | · | 128 | 1 280 | 3 051 |
| 12 | · | · | 3 % | 72 % | 23 % | 2 % | · | · | · | · | 170 | 1 700 | 3 699 |
| 13 | · | · | · | 25 % | 70 % | 5 % | · | · | · | · | 224 | 2 240 | 5 235 |
| 14 | · | · | · | 10 % | 78 % | 11,5 % | 0,5 % | · | · | · | 295 | 2 950 | 6 385 |
| 15 | · | · | · | 3 % | 72 % | 23 % | 2 % | · | · | · | 390 | 3 900 | 7 833 |
| 16 | · | · | · | · | 25 % | 70 % | 5 % | · | · | · | 515 | 5 150 | 11 291 |
| 17 | · | · | · | · | 10 % | 78 % | 11,5 % | 0,5 % | · | · | 680 | 6 800 | 13 887 |
| 18 | · | · | · | · | 3 % | 72 % | 23 % | 2 % | · | · | 897 | 8 970 | 17 168 |
| 19 | · | · | · | · | · | 25 % | 70 % | 5 % | · | · | 1 184 | 11 840 | 25 081 |
| 20 | · | · | · | · | · | 10 % | 78 % | 11,5 % | 0,5 % | · | 1 563 | 15 630 | 31 041 |
| 21 | · | · | · | · | · | 3 % | 72 % | 23 % | 2 % | · | 2 063 | 20 630 | 38 606 |
| 22 | · | · | · | · | · | · | 25 % | 70 % | 5 % | · | 2 724 | 27 240 | 57 081 |
| 23 | · | · | · | · | · | · | 10 % | 78 % | 11,5 % | 0,5 % | 3 595 | 35 950 | 71 056 |
| 24 | · | · | · | · | · | · | 3 % | 72 % | 23 % | 2 % | 4 746 | 47 460 | 88 883 |
| 25 | · | · | · | · | · | · | · | 25 % | 70 % | 5 % | 6 264 | 62 640 | 133 116 |
| 26 | · | · | · | · | · | · | · | 10 % | 78 % | 12 % | 8 269 | 82 690 | 165 875 |
| 27 | · | · | · | · | · | · | · | 3 % | 72 % | 25 % | 10 915 | 109 150 | 205 921 |
| 28 | · | · | · | · | · | · | · | · | 25 % | 75 % | 14 407 | 144 070 | 306 892 |
| 29 | · | · | · | · | · | · | · | · | 10 % | 90 % | 19 018 | 190 180 | 366 757 |
| 30 | · | · | · | · | · | · | · | · | 3 % | 97 % | — | — | 420 380 |

## Courbe attendue

| Zone | Vie | Puissance recommandée (3 min) | Pioche nécessaire | Or miné dans la zone d'avant | Or des niveaux de pioche à acheter | Temps avec la pioche de la zone d'avant |
|---|---|---|---|---|---|---|
| 1 | 1 200 | 667 | 4 | — | 330 | 3,9 min |
| 2 | 2 400 | 1 334 | 8 | 1 200 | 1 160 | 5,3 min |
| 3 | 4 800 | 2 667 | 11 | 2 400 | 2 270 | 5,2 min |
| 4 | 9 600 | 5 334 | 14 | 4 800 | 5 220 | 5,2 min |
| 5 | 19 200 | 10 667 | 16 | 9 600 | 6 850 | 5 min |
| 6 | 38 400 | 21 334 | 19 | 19 200 | 20 920 | 5,7 min |
| 7 | 76 800 | 42 667 | 22 | 38 400 | 48 100 | 5,1 min |
| 8 | 153 600 | 85 334 | 24 | 76 800 | 63 190 | 4,5 min |
| 9 | 307 200 | 170 667 | 27 | 153 600 | 192 790 | 5,8 min |
| 10 | 614 400 | 341 334 | 29 | 307 200 | 253 220 | 5 min |

Lecture :

- **L'or d'une zone paie à peu près la pioche de la suivante.** Comme 1 PV = 1 pièce, l'or miné dans une zone (sa vie) couvre les 3 à 4 niveaux de pioche que demande la zone suivante. Le joueur qui dépense son or au fur et à mesure reste autour de 3 minutes par zone.
- **Le mur est un mur de temps.** Un joueur qui garde la pioche de la zone d'avant met environ 5 minutes au lieu de 3. S'il n'améliore rien pendant plusieurs zones, le temps double à chaque zone : 4 minutes, puis 8, 16, 32…
- **Sans équipement**, la zone 1 prend environ 7,5 minutes. Les premiers éclats tombent vite (8 % par coup), donc le joueur forge ses premiers objets en moins d'une minute.
- **La pioche niveau 30 mène jusqu'à la zone 10.** Au-delà, il faudra d'autres leviers : amélioration des objets, compagnons, talents…

Limites du modèle : il ignore la chance au tirage, les stats secondaires et le fait qu'un joueur n'a pas tout de suite un objet par emplacement.

## Sauvegarde

Pour l'instant, tout est sauvegardé dans le navigateur (`localStorage`). Les anciennes sauvegardes de progression restent lisibles : le joueur garde sa zone, l'étape et le boss disparaissent.
