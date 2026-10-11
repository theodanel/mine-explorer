# Équilibrage de Mine Explorer

Tous les chiffres de ce document viennent de `frontend/src/app/balance/balance.ts`, le seul fichier à modifier pour rééquilibrer le jeu. Les tests de `balance.spec.ts` vérifient les intentions décrites ici : si un réglage les casse, revois ce document en même temps.

Inspirations : Forge Master (pioche à segments et minuteur, paliers en fenêtre glissante, absence plafonnée à 4 h), Legends of Mushroom (étapes, missions) et Freaky Duckling (Puissance recommandée).

## La boucle

1. **Miner.** Chaque zone compte 15 étapes, de 1-1 à 1-15, puis 2-1, etc. Chaque étape est un rocher, un peu plus dur que le précédent. Chaque coup rapporte 0,25 pièce par PV miné (plus le bonus du sac).
2. **Missions.** Elles sont la source principale d'éclats de géode, comme dans Legends of Mushroom :
   - une mission principale à la fois, qui s'enchaîne sans fin (termine des étapes, forge, atteins une étape, paie des segments, vends, monte la pioche), avec des objectifs qui grandissent à chaque tour ;
   - quatre missions du jour (20 étapes, 5 objets forgés, 5 segments, 3 ventes) et un coffre de 10 éclats quand les quatre sont récupérées. Elles changent à minuit, heure du joueur.
   - Une zone terminée donne aussi 5 éclats.
3. **Forger.** 2 éclats = 1 tirage. Le palier de l'objet dépend uniquement du niveau de la pioche.
4. **Équiper ou vendre.** La comparaison montre le gain ou la perte de Puissance.
5. **Puissance.** Chaque étape affiche sa Puissance recommandée, en rouge si le joueur est en dessous. Pas de boss ni de chrono : un joueur trop faible avance simplement plus lentement.
6. **Améliorer la pioche.** L'or remplit 10 segments, puis un minuteur fait passer au niveau suivant. Le minuteur continue quand le jeu est fermé.
7. **Absence.** Jeu fermé ou onglet caché, le mineur rapporte la moitié de l'or habituel, sur 4 h au maximum. Les étapes et les missions n'avancent qu'en jeu.

## Évolutions du mineur

Le mineur change de forme en avançant. Chaque forme change son visuel et donne +25 % de Frappe, cumulés.

| Forme | Zone à atteindre | Minerais | Or | Frappe totale |
|---|---|---|---|---|
| Apprenti | départ | — | — | ×1 |
| Mineur | 5 | 30 Pierre, 30 Cuivre, 30 Fer | 20 000 | ×1,25 |
| Contremaître | 7 | 30 Acier, 30 Or | 1 000 000 | ×1,56 |
| Maître des profondeurs | 9 | 30 Mithril, 30 Cristal | 10 000 000 | ×1,95 |
| Légende de la mine | 11 | 30 Magma, 30 Divin | 300 000 000 | ×2,44 |

- **Minerais** : chaque zone donne le minerai de son décor (Bois en zone 1, Pierre en zone 2… Divin à partir de la zone 10). Chaque rocher cassé en donne 1, et une zone terminée 20 de plus, soit 35 par zone traversée. Le coût en minerais tient donc en un passage : c'est l'or qui retient.
- **Visuel** : tant que les nouvelles formes n'ont pas leur animation, elles s'affichent en image fixe, avec un petit écrasement à chaque coup.

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
- **PV d'un rocher** = 320 × 1,09^n, où n = (zone − 1) × 15 + (étape − 1). Une zone est donc environ 3,6 fois plus dure que la précédente.
- **Puissance recommandée** = la Puissance qui casse le rocher dans le temps visé : 1 minute en zone 1, puis 50 % de plus à chaque zone.
- **Or** = dégâts × 0,25 × (1 + Bonus d'or)
- **Segment de pioche** = 15 × 1,7^(niveau − 1) pièces, et 10 segments font un niveau. Le coût grandit plus vite que la Puissance (×1,26 par niveau), sinon le revenu, qui suit les dégâts, rattraperait toujours le prix.
- **Minuteur d'amélioration** = 2 min × 1,36^(niveau − 1)
- **Absence** = or de 50 % du DPS, sur 4 h au maximum
- **Stat principale d'un objet** = base × croissance du palier^palier × croissance du niveau^(niveau − 1), avec une variation de ±10 %
  - Frappe : base 4, ×1,6 par palier, ×1,1 par niveau
  - Pourcentages (vitesse 5 %, critique 3 %, dégâts crit. 15 %, or 8 %) : ×1,2 par palier, ×1,01 par niveau
- **Stats secondaires** : 50 % d'une stat principale. Aucune de Bois à Cuivre, 1 de Fer à Or, 2 de Mithril à Magma, 3 en Divin.
- **Vente** = 5 × 2^palier × 1,08^(niveau − 1) pièces
- **Plafonds** : Vitesse +200 %, Critique 100 %

### Coûts et minuteurs de la pioche

| Niveau | Segment | Niveau complet | Minuteur vers le niveau suivant |
|---|---|---|---|
| 1 | 15 | 150 | 2 min |
| 2 | 26 | 260 | 3 min |
| 3 | 43 | 430 | 4 min |
| 5 | 125 | 1 250 | 7 min |
| 8 | 616 | 6 160 | 17 min |
| 10 | 1 779 | 17 790 | 32 min |
| 12 | 5 141 | 51 410 | 59 min |
| 15 | 25 257 | 252 570 | 2,5 h |
| 18 | 124 086 | 1 240 860 | 6,2 h |
| 20 | 358 609 | 3 586 090 | 11,5 h |
| 22 | 1 036 379 | 10 363 790 | 21,2 h |
| 25 | 5 091 730 | 50 917 300 | 2,2 j |
| 28 | 25 015 670 | 250 156 700 | 5,6 j |
| 29 | 42 526 639 | 425 266 390 | 7,6 j |

## Pioche : chances par palier

Le joueur voit ces chances en jeu dans la fenêtre « Probabilités de forge », pour son niveau et le suivant.

- La toute première pioche ne forge que du Bois.
- Ensuite, la fenêtre de 4 paliers (précédent, base, suivant, encore au-dessus) monte d'un cran tous les 3 niveaux. Les paliers supérieurs arrivent par petites touches (0,5 %, puis 2 %, puis 5 %), et l'ancien palier s'efface sur 3 niveaux.
- La Puissance moyenne est celle d'un joueur équipé sur les 5 emplacements d'objets moyens pour ce niveau, sans stats secondaires.

| Pioche | Bois | Pierre | Cuivre | Fer | Acier | Or | Mithril | Cristal | Magma | Divin | Puissance moyenne |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 100 % | · | · | · | · | · | · | · | · | · | 519 |
| 2 | 88 % | 11,5 % | 0,5 % | · | · | · | · | · | · | · | 563 |
| 3 | 75 % | 23 % | 2 % | · | · | · | · | · | · | · | 618 |
| 4 | 25 % | 70 % | 5 % | · | · | · | · | · | · | · | 759 |
| 5 | 10 % | 78 % | 11,5 % | 0,5 % | · | · | · | · | · | · | 867 |
| 6 | 3 % | 72 % | 23 % | 2 % | · | · | · | · | · | · | 1 001 |
| 7 | · | 25 % | 70 % | 5 % | · | · | · | · | · | · | 1 316 |
| 8 | · | 10 % | 78 % | 11,5 % | 0,5 % | · | · | · | · | · | 1 550 |
| 9 | · | 3 % | 72 % | 23 % | 2 % | · | · | · | · | · | 1 844 |
| 10 | · | · | 25 % | 70 % | 5 % | · | · | · | · | · | 2 535 |
| 11 | · | · | 10 % | 78 % | 11,5 % | 0,5 % | · | · | · | · | 3 051 |
| 12 | · | · | 3 % | 72 % | 23 % | 2 % | · | · | · | · | 3 699 |
| 13 | · | · | · | 25 % | 70 % | 5 % | · | · | · | · | 5 235 |
| 14 | · | · | · | 10 % | 78 % | 11,5 % | 0,5 % | · | · | · | 6 385 |
| 15 | · | · | · | 3 % | 72 % | 23 % | 2 % | · | · | · | 7 833 |
| 16 | · | · | · | · | 25 % | 70 % | 5 % | · | · | · | 11 291 |
| 17 | · | · | · | · | 10 % | 78 % | 11,5 % | 0,5 % | · | · | 13 887 |
| 18 | · | · | · | · | 3 % | 72 % | 23 % | 2 % | · | · | 17 168 |
| 19 | · | · | · | · | · | 25 % | 70 % | 5 % | · | · | 25 081 |
| 20 | · | · | · | · | · | 10 % | 78 % | 11,5 % | 0,5 % | · | 31 041 |
| 21 | · | · | · | · | · | 3 % | 72 % | 23 % | 2 % | · | 38 606 |
| 22 | · | · | · | · | · | · | 25 % | 70 % | 5 % | · | 57 081 |
| 23 | · | · | · | · | · | · | 10 % | 78 % | 11,5 % | 0,5 % | 71 056 |
| 24 | · | · | · | · | · | · | 3 % | 72 % | 23 % | 2 % | 88 883 |
| 25 | · | · | · | · | · | · | · | 25 % | 70 % | 5 % | 133 116 |
| 26 | · | · | · | · | · | · | · | 10 % | 78 % | 12 % | 165 875 |
| 27 | · | · | · | · | · | · | · | 3 % | 72 % | 25 % | 205 921 |
| 28 | · | · | · | · | · | · | · | · | 25 % | 75 % | 306 892 |
| 29 | · | · | · | · | · | · | · | · | 10 % | 90 % | 366 757 |
| 30 | · | · | · | · | · | · | · | · | 3 % | 97 % | 420 380 |

## Courbe attendue

Simulation d'un joueur équipé d'objets moyens, qui joue sans interruption et dépense son or dès qu'il peut. Un vrai joueur, qui joue quelques heures par jour, ira nettement moins vite : les étapes n'avancent qu'en jeu.

| Pioche | Atteinte après |
|---|---|
| 2 | 4 min |
| 5 | 22 min |
| 10 | 2,6 h |
| 15 | 12,7 h |
| 20 | 2,3 j |
| 25 | 9,2 j |
| 30 | 35,6 j |

| Zone | Atteinte après | 1er rocher | Dernier rocher | Puissance recommandée (1er → dernier) | Pioche pour la finir |
|---|---|---|---|---|---|
| 1 | début | 320 PV | 1 069 PV | 534 → 1 782 | 9 |
| 2 | 24 min | 1 166 PV | 3 895 PV | 1 296 → 4 328 | 13 |
| 3 | 1,2 h | 4 246 PV | 14 188 PV | 3 146 → 10 510 | 16 |
| 5 | 6,9 h | 56 330 PV | 188 240 PV | 18 545 → 61 973 | 23 |
| 8 | 2,4 j | 2,7 M PV | 9,1 M PV | 265 548 → 887 388 | > 30 |
| 10 | 9 j | 36 M PV | 121 M PV | 1,6 M → 5,2 M | > 30 |

Lecture :

- **La pioche fixe le rythme** : environ 1 mois pour le niveau 30, quel que soit le temps de jeu, grâce au minuteur.
- **Les zones suivent** : un joueur qui ne dépense pas son or voit la Puissance recommandée passer au rouge, et chaque rocher prend de plus en plus de temps.
- **La pioche niveau 30 mène jusqu'à la zone 7.** Au-delà, il faudra d'autres leviers (amélioration des objets, compagnons, talents…).
- **Éclats** : les missions du jour en donnent 27 par jour (17 + 10 pour le coffre), soit une quinzaine de tirages. Les missions principales et les fins de zone complètent.

## Sauvegarde

Tout est sauvegardé dans le navigateur (`localStorage`). Une ancienne sauvegarde « vie de zone » garde sa zone et repart du premier rocher de cette zone. Une ancienne pioche sans minuteur est complétée automatiquement.
