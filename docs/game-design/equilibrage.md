# Équilibrage de Mine Explorer

Tous les chiffres de ce document viennent de `frontend/src/app/balance/balance.ts`, le seul fichier à modifier pour rééquilibrer le jeu. Les tests de `balance.spec.ts` vérifient les intentions décrites ici : si un réglage les casse, revois ce document en même temps.

Inspirations : Forge Master (pioche à segments et minuteur, paliers en fenêtre glissante, absence plafonnée à 4 h), Legend of Mushroom (filons par zone, missions, vente qui compte, début très généreux), Freaky Duckling (Puissance recommandée), et la série d'articles « The Math of Idle Games » (coûts exponentiels face à une production qui grandit moins vite, paliers multiplicateurs pour franchir les murs).

## Outils

Depuis `frontend/` :

- `node --import ./tools/register-ts.mjs tools/simulate.mts regulier 90` (variable `SEED` pour changer de tirage, `--sans-atelier`, `--sans-evenements`) joue l'économie avec les vraies règles du jeu (forge, équipement, filons, pioche, missions, évolutions, absence). Profils : `regulier` (4 sessions de 15 min par jour), `assidu` (6 sessions de 30 min), `continu` (sans arrêt).
- `node --import ./tools/register-ts.mjs tools/balance-tables.mts` recalcule les tableaux de coûts et de zones de ce document.

## Les principes

1. **Un début qui arrose, puis un rythme qui ralentit doucement.** Comme Legend of Mushroom : plus de 200 forges et 10 niveaux de pioche le premier jour, puis une centaine de forges par jour et des niveaux de plus en plus espacés.
2. **L'or fixe le rythme, pas l'attente.** Le coût de la pioche est multiplié par 2,09 à chaque niveau alors que le revenu grandit d'environ ×1,4 : c'est le mur classique des jeux idle. Les minuteurs restent courts (8 h 30 au maximum). Quand ils duraient des jours, l'or s'entassait sans usage.
3. **Les évolutions sont les grands bonds.** Chacune multiplie la Frappe par 1,5 (×5 en Légende) : ce sont les paliers multiplicateurs qui font franchir un mur d'un coup.
4. **Vendre compte.** Le prix de vente suit le niveau de l'objet et vaut 20 à 25 % de l'or gagné sur une partie.
5. **Les éclats ne s'arrêtent jamais.** Un éclat peut tomber à chaque coup, en plus des filons, des missions et de l'absence : environ une forge par minute et demie de jeu actif, à tout moment de la partie.
6. **Des choix et des surprises, pas un raccourci.** L'arbre de compétences, les sorts et les artefacts (voir [[competences-et-artefacts]]) donnent environ ×1,5 de Puissance et 21 % des dégâts en explosions, compensés par le coût de la pioche.
7. **Aucune mission impossible.** Les objectifs liés aux filons et aux segments sont plafonnés, car en profondeur un filon peut durer une demi-heure.

## La boucle

1. **Miner.** Chaque zone compte 15 filons, de 1-1 à 1-15, puis 2-1, etc. Chaque filon a un peu plus de PV que le précédent. Chaque coup rapporte 0,34 pièce par PV miné (plus le bonus d'or).
2. **Éclats de géode.** Chaque coup a 4 % de chances d'en déterrer un (environ 75 par heure sans bonus de Vitesse). En plus, les 5 premiers filons en donnent 4 (les 5 emplacements remplis en une minute), puis chaque filon 3 jusqu'à la fin de la zone 4, et 2 ensuite. Une zone terminée en donne 5, et l'absence 1 toutes les 6 minutes (40 au maximum). Les missions, les objectifs d'évolution, le Défi de la mine, les événements et les expéditions complètent :
   - une mission principale à la fois, qui s'enchaîne sans fin (épuise des filons, forge, atteins un filon, paie des segments, vends, monte la pioche) ; les objectifs grandissent à chaque tour, mais les filons et les segments sont plafonnés à 3, et la mission de segments se valide d'elle-même quand la pioche est au maximum ;
   - des missions du jour qui changent à minuit, heure du joueur, et un coffre de 15 éclats quand toutes sont récupérées. Depuis le 14/10/2026, il y en a sept, chacune liée à un pan du jeu et visible une fois ce menu ouvert :
     - épuise un filon, forge 10 objets, vends 5 objets ;
     - touche 3 événements ;
     - renforce 3 fois à l'Atelier (dès le Mineur) ;
     - joue une aventure (dès le Contremaître) ;
     - envoie un compagnon en expédition (dès la zone 3).

     Soit jusqu'à 60 éclats par jour.
3. **Forger.** 2 éclats = 1 tirage. Le palier de l'objet dépend uniquement du niveau de la pioche.
4. **Équiper ou vendre.** La comparaison montre le gain ou la perte de Puissance. L'objet remplacé est vendu automatiquement.
5. **Améliorer la pioche.** L'or remplit 10 segments, puis un minuteur fait passer au niveau suivant. Le minuteur continue quand le jeu est fermé.
6. **Évoluer.** Le mineur change de forme en remplissant des objectifs (zone, pioche, forges, événements), sans rien payer.
7. **Absence.** Jeu fermé ou onglet caché, le mineur rapporte la moitié de l'or habituel et un éclat toutes les 6 minutes, sur 4 h au maximum. Les filons et les missions n'avancent qu'en jeu.

## Évolutions du mineur

Depuis le 13/10/2026 (voir [[refonte-compagnons-evolution]]), une forme se gagne en remplissant des missions rangées en **3 paliers**, façon « Adventure Rank » de Legend of Mushroom, sans rien payer. Un palier s'ouvre quand le précédent est rempli ; chaque mission remplie donne des éclats (4 par mission pour le Mineur, 6, 8 puis 10), et la promotion donne ceux qu'on a oubliés. Chaque forme multiplie toujours la Frappe par 1,5. Le tableau donne le **dernier palier** ; les deux premiers jalonnent le chemin (voir `EVOLUTION_FORMS`).

| Forme | Zone | Pioche | Objets forgés | Filons épuisés | Frappe totale |
|---|---|---|---|---|---|
| Apprenti | départ | | | | ×1 |
| Mineur | 4 | 8 | 220 | 45 | ×1,5 |
| Contremaître | 6 | 13 | 600 | 80 | ×2,25 |
| Maître des profondeurs | 9 | 20 | 1 200 | 140 | ×3,4 |
| Légende de la mine | 12 | 24 | 4 000 | 180 | ×5,1 |
| ★ à ★★★★★ (une par zone) | 13 à 17 | 25 à 30 | 7 500 à 21 000 | 190 à 245 | ×1,5 chacune, ×38 à ★★★★★ |
| Légende du Cœur du monde | 19 | | 28 000 | 275 | ×77 |

- **Étoiles de Légende** (16/10/2026) : cinq rangs de plus après la Légende, puis une forme finale, pour que les zones 13 à 20 aient toujours un rang à viser et la Puissance qui manquait après la zone 16. Détails, calage et prompts dans [[etoiles-de-legende]].

- **Calage** : les objectifs reprenaient d'abord ce que le joueur régulier faisait avec l'ancien coût en or et minerais. Le 14/10/2026, Théo a demandé un Mineur et un Contremaître plus rapides, pour ouvrir plus tôt l'Atelier et le Puits sans fond : leurs objectifs ont baissé (Contremaître en zone 6 et pioche 13 au lieu de 7 et 16), et l'Atelier coûte désormais au départ des segments de la pioche 14 au lieu de 17, pour être vraiment utilisable à son ouverture. Simulé (régulier) : Mineur en 12 h (deuxième session du premier jour), Contremaître jour 2,8 (au lieu de 4,5), Maître jour 7,9, Légende jour 16,3. Pour que la fin de partie reste longue, le segment de pioche passe à ×2,09 : pioche 30 au jour 47,8 en moyenne sur 5 tirages.
- **Minerais** : chaque zone donne le minerai de son décor (Pierre en zone 2, Cuivre en zone 3… Divin à partir de la zone 10), 1 par filon et 20 de plus en fin de zone. Ils ne servent plus qu'à l'Atelier.
- **Visuel** : les cinq formes ont leur animation de frappe (Mineur et Légende depuis le 14/10/2026, découpées par `art-source/animations/decouper-frappe.py`).

## Atelier

Réglages dans `frontend/src/app/balance/workshop.ts`, règles dans `workshop/workshop-rules.ts`. Idée 1 de [[idees-fun]].

- **Ouverture** : avec la forme Contremaître (vers le jour 6 pour le joueur régulier). Avant, l'onglet montre ce qui attend le joueur.
- **Effet** : chaque niveau d'un emplacement donne +1,5 % à sa stat d'Atelier (Frappe pour la pioche, Vitesse pour les bottes, Critique pour les gants, Dégâts crit. pour le casque, Bonus d'or pour le sac). Le bonus appartient à l'emplacement et reste quand on change d'objet. Les niveaux s'additionnent, et l'Atelier multiplie les autres familles.
- **Or** : le niveau 1 coûte 20 segments de pioche du niveau 17 (environ 29 M), puis chaque niveau coûte ×3. Le prix monte bien plus vite que le revenu (×1,4 par zone) : c'est un puits d'or sans fin, pas un raccourci.
- **Minerai** : celui de la dernière zone terminée (Or en zone 7, Mithril en zone 8…, Divin ensuite), 2 par niveau puis 1 de plus tous les 5 niveaux. L'Atelier ne prend jamais les minerais des évolutions encore à faire, sinon une évolution pourrait être bloquée pour de bon (une zone ne redonne son minerai qu'en la traversant).
- **Mesure (régulier)** : ×1,08 de Puissance au jour 21, ×1,18 juste avant la pioche 30, puis ×1,25 au jour 49 et ×1,39 au jour 90, quand tout l'or y passe. Seul, l'Atelier avançait la pioche 30 de 1,9 jour ; avec les événements de mine, de 2,9 jours : le segment de pioche a été relevé (voir Compagnons pour la valeur finale). Le joueur simulé met dans l'Atelier au plus un quart du prix d'un segment tant que la pioche n'est pas au maximum (`--sans-atelier` pour comparer).
- **Essais écartés** : +3 % par niveau et ×1,6 par niveau donnaient ×3,5 de Puissance et la pioche 30 au jour 33. L'Atelier touche quatre stats de Puissance à la fois, qui se multiplient : il faut un petit pas par niveau.

## Événements de mine

Réglages dans `frontend/src/app/balance/mine-events.ts`. Idée 2 de [[idees-fun]].

- **Rythme** : un événement toutes les 2 à 4 minutes de jeu actif (mine affichée, onglet visible). Rien pendant l'absence ni sur les autres pages. Un événement ignoré disparaît sans rien faire perdre.
- **Les quatre** : géode géante (5 coups, 20 s d'or et 1 éclat), coffre enseveli (60 s d'or et 1 minerai de la zone), rat voleur (traverse la galerie en 7 s, 80 s d'or), pluie de 3 cristaux (1 éclat chacun). L'or est compté en secondes de revenu actuel : la récompense suit la progression sans réglage par zone.
- **Mesure (régulier, 5 tirages)** : +10 % d'or et +17 % d'éclats en jeu actif, en supposant 80 % d'événements touchés (`--sans-evenements` pour comparer).

## Embranchements

Réglages dans `frontend/src/app/balance/galleries.ts`. Idée 3 de [[idees-fun]].

- **Le choix** : à la fin de chaque zone, deux galeries tirées au hasard sont proposées pour la suivante. Le choix reste ouvert pendant le premier filon de la zone ; sans choix, c'est la galerie ordinaire, sans effet.
- **Les galeries** : inondée (+50 % de minerai, filons 15 % plus durs), veine d'or (+30 % d'or en minant, −30 % d'éclats déterrés), instable (+50 % de dégâts des explosions, −10 points de Vitesse), grotte de cristal (+40 % d'éclats déterrés, −20 % d'or en minant).
- **En jeu seulement** : l'absence ne tient pas compte de la galerie, sinon la veine d'or rapportait 30 % de l'or d'absence, qui fait 70 % de l'or d'une partie.
- **Mesure (régulier, 5 tirages, `GALLERY=neutre|optimal|hasard`)** : pioche 30 au jour 47,1 sans jamais choisir, 46,1 en choisissant toujours au mieux, 47,0 au hasard. Bien choisir fait gagner environ 2 % de temps, sous la limite de 10 %.

## Compagnons

Réglages dans `frontend/src/app/balance/companions.ts` et `balance/challenge.ts`. Revu le 13/10/2026 avec [[refonte-compagnons-evolution]].

- **Œufs** : l'onglet s'ouvre à la zone 3 avec un œuf commun offert. Les suivants viennent du **Défi de la mine** (plus des fins de zone ni des coffres). Rareté affichée : commun 60 %, rare 28 %, épique 10 %, légendaire 2 %, légendaire garanti au 15e œuf sans légendaire.
- **Défi de la mine** : un défi de 3 jours, puis le suivant. 5 points par filon épuisé, 1 par forge, 3 par événement touché. Paliers : 30 (œuf), 80 (3 pierres), 150 (20 éclats), 250 (5 pierres), 380 (40 éclats), 550 (œuf), 750 (8 pierres), 1 000 (œuf rare ou mieux). Un palier oublié est donné à la fin du défi. Simulé : 6,5 paliers par défi pour le régulier, 8 pour l'assidu.
- **Éclosion** : un œuf à la fois, 1 h (commun), 2 h (rare), 4 h (épique), 8 h (légendaire), minuteur qui continue jeu fermé.
- **Bonus** : seul le compagnon qui accompagne le mineur compte (famille à part, multipliée aux autres) : canari +5 % d'or, taupe +3 % de Frappe, chauve-souris +1,5 point de Critique, luciole +10 % de Dégâts crit., golem +5 % de Frappe et +2 points de Vitesse, dragonnet +6 % de Frappe et +15 % d'explosions, à 1 étoile.
- **Étoiles et pierres d'éveil** : chaque étoile au-delà de la première ajoute 50 % de l'effet de base (×3 à 5 étoiles). Monter coûte 10, 25, 50 puis 100 pierres. Pierres : paliers du défi, doublons (3 commun, 6 rare, 12 épique, 25 légendaire), expéditions. Les anciens niveaux sont remboursés à 2 pierres par niveau.
- **Expéditions** : 2 compagnons au plus, 1, 4 ou 8 h ; par heure 1 éclat et un quart de pierre (×1,25 rare, ×1,5 épique, ×2 légendaire). Jamais d'or.
- **Mesure (régulier, 90 jours)** : une soixantaine d'œufs, le compagnon actif à 5 étoiles vers le jour 30, ×1,18 de Puissance en fin de partie.

## Stats

Depuis les builds libres ([[builds-libres]]), n'importe quelle pièce peut porter n'importe quelle stat. L'emplacement ne fixe plus que la stat que l'Atelier renforce.

| Stat | Stat d'Atelier de | Rôle | Base du mineur |
|---|---|---|---|
| Frappe | Pioche | Dégâts d'un coup | 5 |
| Vitesse | Bottes | Coups par seconde en plus (donc plus d'or et plus d'éclats déterrés) | 0 % |
| Critique | Gants | Chance de critique | 5 % |
| Dégâts crit. | Casque | Bonus de dégâts d'un critique | +50 % |
| Bonus d'or | Sac | Or en plus par PV miné | 0 % |

Stats simulées d'un joueur régulier : Frappe 566, Vitesse +13 %, Critique 12 % et Dégâts crit. +110 % au jour 3 ; Frappe 72 k, Vitesse +91 %, Critique 70 % et Dégâts crit. +384 % au jour 60. Les plafonds (Vitesse +200 %, Critique 100 %) ne sont pas atteints avant la pioche 30.

## Formules

- **Coups par seconde** = 12/23 × (1 + Vitesse). L'animation compte 23 frames jouées à 12 fps.
- **Dégâts moyens d'un coup** = Frappe × (1 + Critique × Dégâts crit.)
- **Puissance** = Dégâts moyens × Coups par seconde × 100. Le mineur sans équipement est à 267.
- **PV d'un filon** = 320 × 1,073^n × adoucissement, où n = (zone − 1) × 15 + (filon − 1). Une zone est environ 2,9 fois plus dure que la précédente, ce que gagne la Puissance en 2 à 3 niveaux de pioche. L'adoucissement vaut 0,1^(1 − n/60) dans les zones 1 à 4 et 1 ensuite : le 1-1 n'a que 32 PV (une dizaine de secondes sans équipement), les PV sont divisés par 4 environ en zone 2 et par 2,4 en zone 3, et la courbe normale est rejointe au 5-1. Jusqu'au 13/10/2026, l'adoucissement s'arrêtait au 1-15 et les zones 2 et 3 demandaient plusieurs minutes par filon.
- **Puissance recommandée** = la Puissance qui épuise le filon dans le temps visé : 40 secondes en zone 1, puis 30 % de plus à chaque zone.
- **Or** = dégâts × 0,34 × (1 + Bonus d'or). C'était 0,25 tant que le sac portait toujours de l'or : l'or est devenu un choix de build, le revenu de base compense.
- **Segment de pioche** = 15 × 2,09^(niveau − 1) pièces (2,065 jusqu'au Campement, 2,085 avec lui, 2,09 depuis les évolutions plus rapides du 14/10/2026), et 10 segments font un niveau. À ×2, l'arbre de compétences et les artefacts amenaient la pioche 30 au jour 35 ; à ×2,05, les éclats plus faciles du 13/10/2026 (deux fois plus de forges) l'amenaient au jour 43 : le coût a été relevé pour garder le rythme (pioche 30 au jour 49,3 en moyenne sur 5 tirages).
- **Minuteur d'amélioration** = 1 min × 1,25^(niveau − 1), moins de 2 jours cumulés jusqu'au niveau 30.
- **Absence** = or de 35 % du DPS (50 % avant le 15/10/2026) et 1 éclat toutes les 6 minutes, sur 4 h au maximum.
- **Éclats** = 4 % de chances par coup, plus 4 par filon du 1-1 au 1-5, 3 jusqu'au 4-15, puis 2.
- **Valeur de référence d'une stat** = base × croissance du palier^palier × croissance du niveau^(niveau − 1), avec une variation de ±10 %
  - Frappe : base 4, ×1,6 par palier, ×1,1 par niveau
  - Pourcentages (vitesse 5 %, critique 3 %, dégâts crit. 15 %, or 8 %) : ×1,2 par palier, ×1,01 par niveau
- **Objet** = une Frappe de base (25 % de la référence) et des affixes tirés dans les 5 stats, sans doublon : 1 de Bois à Cuivre, 2 de Fer à Or, 3 de Mithril à Magma, 4 en Divin. Un affixe vaut une part de la référence (Frappe 30 %, Vitesse 110 %, Critique 110 %, Dégâts crit. 90 %, or 120 %), plein tarif pour le premier, 60 % pour les suivants. Détails et réglage dans [[builds-libres]].
- **Vente** = 5 × 1,66^(niveau − 1) pièces, ×1,5 pour un palier au-dessus de la base du niveau et ÷1,5 pour un palier en dessous. Une vente vaut environ 5 % d'un segment au niveau 10, 0,5 % au niveau 20 et 0,07 % au niveau 29 : généreuse au début, toujours utile. Avec deux fois plus de forges, les ventes font environ 18 % de l'or d'une partie.
- **Plafonds** : Vitesse +200 %, Critique 100 %

### Coûts, minuteurs et ventes

| Niveau | Segment | Niveau complet | Minuteur vers le suivant | Vente d'un objet du palier de base |
|---|---|---|---|---|
| 1 | 15 | 150 | 1 min | 5 |
| 2 | 31 | 310 | 1 min | 8 |
| 3 | 64 | 640 | 2 min | 14 |
| 5 | 273 | 2 730 | 2 min | 38 |
| 8 | 2 402 | 24 020 | 5 min | 174 |
| 10 | 10 242 | 102 420 | 7 min | 479 |
| 12 | 43 673 | 436 730 | 12 min | 1 319 |
| 15 | 384 567 | 3,8 M | 23 min | 6 032 |
| 18 | 3,4 M | 33,9 M | 44 min | 27 594 |
| 20 | 14,4 M | 144,4 M | 1,2 h | 76 037 |
| 22 | 61,6 M | 615,8 M | 1,8 h | 209 527 |
| 25 | 542,2 M | 5,4 Md | 3,5 h | 958 438 |
| 28 | 4,8 Md | 47,7 Md | 6,9 h | 4,4 M |
| 29 | 9,9 Md | 98,6 Md | 8,6 h | 7,3 M |

## Pioche : chances par palier

Le joueur voit ces chances en jeu dans la fenêtre « Probabilités de forge », pour son niveau et le suivant.

- La toute première pioche ne forge que du Bois.
- Ensuite, la fenêtre de 3 paliers (précédent, base, suivant) monte d'un cran tous les 3 niveaux. Le palier suivant arrive par petites touches (3 %, puis 8 %, puis 16 %), et l'ancien palier s'efface sur 3 niveaux. Pas de palier deux crans au-dessus : le Fer n'apparaît qu'au niveau 7.
- La Puissance moyenne est celle d'un joueur équipé sur les 5 emplacements d'objets moyens pour ce niveau, sans stats secondaires ni évolution.

| Pioche | Bois | Pierre | Cuivre | Fer | Acier | Or | Mithril | Cristal | Magma | Divin | Puissance moyenne |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 100 % | · | · | · | · | · | · | · | · | · | 519 |
| 2 | 92 % | 8 % | · | · | · | · | · | · | · | · | 555 |
| 3 | 84 % | 16 % | · | · | · | · | · | · | · | · | 596 |
| 4 | 25 % | 72 % | 3 % | · | · | · | · | · | · | · | 753 |
| 5 | 12 % | 80 % | 8 % | · | · | · | · | · | · | · | 846 |
| 6 | 4 % | 80 % | 16 % | · | · | · | · | · | · | · | 952 |
| 7 | · | 25 % | 72 % | 3 % | · | · | · | · | · | · | 1 302 |
| 8 | · | 12 % | 80 % | 8 % | · | · | · | · | · | · | 1 504 |
| 9 | · | 4 % | 80 % | 16 % | · | · | · | · | · | · | 1 736 |
| 10 | · | · | 25 % | 72 % | 3 % | · | · | · | · | · | 2 505 |
| 11 | · | · | 12 % | 80 % | 8 % | · | · | · | · | · | 2 950 |
| 12 | · | · | 4 % | 80 % | 16 % | · | · | · | · | · | 3 461 |
| 13 | · | · | · | 25 % | 72 % | 3 % | · | · | · | · | 5 168 |
| 14 | · | · | · | 12 % | 80 % | 8 % | · | · | · | · | 6 158 |
| 15 | · | · | · | 4 % | 80 % | 16 % | · | · | · | · | 7 298 |
| 16 | · | · | · | · | 25 % | 72 % | 3 % | · | · | · | 11 139 |
| 17 | · | · | · | · | 12 % | 80 % | 8 % | · | · | · | 13 371 |
| 18 | · | · | · | · | 4 % | 80 % | 16 % | · | · | · | 15 949 |
| 19 | · | · | · | · | · | 25 % | 72 % | 3 % | · | · | 24 732 |
| 20 | · | · | · | · | · | 12 % | 80 % | 8 % | · | · | 29 848 |
| 21 | · | · | · | · | · | 4 % | 80 % | 16 % | · | · | 35 776 |
| 22 | · | · | · | · | · | · | 25 % | 72 % | 3 % | · | 56 263 |
| 23 | · | · | · | · | · | · | 12 % | 80 % | 8 % | · | 68 234 |
| 24 | · | · | · | · | · | · | 4 % | 80 % | 16 % | · | 82 156 |
| 25 | · | · | · | · | · | · | · | 25 % | 72 % | 3 % | 131 144 |
| 26 | · | · | · | · | · | · | · | 12 % | 80 % | 8 % | 159 882 |
| 27 | · | · | · | · | · | · | · | 4 % | 80 % | 16 % | 193 458 |
| 28 | · | · | · | · | · | · | · | · | 25 % | 75 % | 306 892 |
| 29 | · | · | · | · | · | · | · | · | 12 % | 88 % | 363 097 |
| 30 | · | · | · | · | · | · | · | · | 4 % | 96 % | 418 318 |

## Les zones

| Zone | 1er filon | Dernier filon | Puissance recommandée (1er → dernier) | Pioche pour la finir (sans évolution) |
|---|---|---|---|---|
| 1 | 32 PV | 858 PV | 80 → 2 145 | 10 |
| 2 | 921 PV | 2 469 PV | 1 772 → 4 749 | 13 |
| 3 | 2 649 PV | 7 105 PV | 3 919 → 10 511 | 16 |
| 5 | 21 935 PV | 58 821 PV | 19 201 → 51 488 | 22 |
| 7 | 181 604 PV | 486 991 PV | 94 061 → 252 233 | 28 |
| 9 | 1,5 M PV | 4 M PV | 460 798 → 1,2 M | > 30 |
| 11 | 12,4 M PV | 33,4 M PV | 2,3 M → 6,1 M | > 30 |
| 13 | 103,1 M PV | 276,4 M PV | 11,1 M → 29,7 M | > 30 |
| 15 | 853,3 M PV | 2,3 Md PV | 54,2 M → 145,3 M | > 30 |

Sans évolution, la pioche 30 s'arrête vers la zone 7 ; avec les quatre évolutions (×5), elle mène jusqu'à la zone 15 ou 16.

## Courbe simulée

Résultats de `tools/simulate.mts`, avec les vraies règles du jeu. Le joueur forge dès qu'il a 2 éclats, équipe ce qui augmente sa Puissance et vend le reste, évolue dès qu'il le peut, puis paie ses segments. Il dépense ses points de compétence dans la Force puis la Maîtrise, lance ses sorts en automatique, porte son meilleur artefact, renforce l'Atelier, touche 80 % des événements, récupère les paliers du Défi et monte l'étoile de son compagnon. Les jours dépendent un peu du hasard : le rythme de référence est la moyenne de 5 tirages (`SEED=…`). `--sans-nouveautes` mesure le jeu sans arbre, sorts ni artefacts (pioche 30 au jour 53 avec l'ancien coût ×2).

| Moment | Régulier (1 h par jour) | Assidu (3 h par jour) | Continu |
|---|---|---|---|
| Zone 2 | 12 min de jeu | 12 min de jeu | 12 min |
| Pioche 10 | jour 1 | jour 1 | 2 h 10 |
| Mineur | jour 1 (12 h) | jour 1 | 2 h 25 |
| Contremaître | jour 3 | jour 4 | 11 h |
| Pioche 20 | jour 8 | jour 6 | jour 2 |
| Maître des profondeurs | jour 9 | jour 6 | jour 2 |
| Légende de la mine | jour 19 | jour 12 | jour 4 |
| Pioche 30 | jour 49 | jour 33 | jour 10 |
| Forges le premier jour | 293 | 523 | 1 966 |
| Forges par jour ensuite | 190 à 280 | 350 à 430 | 1 700 à 2 000 |
| Points de compétence (jour 1 / jour 7 / jour 28) | 9 / 27 / 42 | 15 / 33 / 48 | 30 / 48 / 54 |

- **Or sur 90 jours (régulier)** : 68 % vient de l'absence, 18 % des ventes, 13 % du minage en jeu, 1 % des événements.
- **Durée d'un filon (régulier)** : 37 s en zone 1, 2 min en zone 4, 5 min en zone 6, 8 min en zone 8, 14 min en zone 10, 27 min en zone 12, 44 min en zone 14. Les filons longs de la fin sont le mur : l'or et les éclats continuent d'arriver pendant ce temps.
- **Éclats (régulier, 90 jours)** : coups 12 000, absence 13 900, missions 4 400, expéditions 3 200, Défi de la mine 1 800, événements 1 300, filons 500, objectifs d'évolution 400.
- **Après la pioche 30**, la progression ralentit fortement (zone 16 vers le jour 42, zone 17 vers le jour 65 pour le joueur régulier). L'or part alors dans l'Atelier, qui gagne environ un niveau par emplacement tous les 10 jours.

## Sauvegarde

Tout est sauvegardé dans le navigateur (`localStorage`). Une ancienne sauvegarde « vie de zone » garde sa zone et repart du premier rocher de cette zone. Une ancienne pioche sans minuteur est complétée automatiquement. Les nouveaux réglages s'appliquent aux sauvegardes existantes sans migration : seuls les prix, les PV et les minuteurs changent.


## Économie relevée (14/10/2026)

Demande de Théo : le minerai doit tomber au coup de pioche dans toutes les zones, et les éclats manquaient pour forger.

- **Minerai** : 3 % par coup de pioche, au lieu d'un par filon épuisé ; le lot de fin de zone reste. Plus abondant en profondeur, où un filon demande des centaines de coups. L'Atelier demande donc plus de minerai : 6, puis un de plus tous les 4 niveaux.
- **Éclats** : 6 % par coup (4 % avant).
- **Missions du jour** : 3 de plus, coffre à 15 (voir plus haut).
- **Puits sans fond** : 2 éclats par étage et 30 par palier de record.
- **Expéditions** : 3 éclats et 0,5 pierre d'éveil par heure (1 et 0,25 avant).

Simulé (joueur régulier, 5 graines) :
- la pioche 30 arrive vers le jour 42 au lieu de 47,6 : le jeu est plus riche, comme demandé ;
- le Contremaître arrive au jour 2,5 au lieu de 2,8 ;
- le Mineur (12 h), le Maître (jour 7,3) et la Légende (jour 16) ne bougent pas.

## Gardien de zone (15/10/2026)

Le dernier filon de chaque zone est un gardien à casser en 30 secondes, ses PV calculés sur 50 % de la Puissance conseillée du filon 15 (voir [[gardien-de-zone]]). Simulé : pioche 30 toujours vers le jour 41, gardiens cassés en 15 à 28 s, mais blocage en fin de partie au gardien de la zone 16.

## Jeu actif et creux de la pioche (15/10/2026)

Retour de Théo : bloqué avant le Maître des profondeurs en zone magma, avec un stuff mithril, faute d'or et d'éclats. Constat chiffré : en zone 9, environ 9 M d'or par heure de jeu pour une pioche 19 → 20 à 87 M. Et 78 % de l'or du joueur régulier venait de l'absence, 10 % seulement du minage.

- **Or en jeu ×2** (`ACTIVE_GOLD_MULTIPLIER`, `minedGold`) : chaque PV miné en jeu rapporte 0,68 pièce. L'absence passe de 50 % à 35 % des dégâts, au tarif de base (0,34).
- **Pioche** : ×1,95 par niveau entre 15 et 25 au lieu de ×2,09. Les niveaux 25 à 29 rattrapent l'écart (×2,4), si bien que le dernier niveau coûte comme avant.
- **Maître des profondeurs** : 900 / 1 050 / 1 200 objets forgés au lieu de 1 300 / 1 600 / 1 900.
- **Éclats par filon** : un par tranche de 40 s de son temps visé (3 en zone 5, 8 en zone 9, 18 en zone 12) au lieu de 2. Le coffre du gardien en donne 5 par numéro de zone, au lieu de 5.

Simulé sur 5 graines :

| Profil | Avant | Après |
|---|---|---|
| Régulier : Maître / Légende / pioche 30 | jour 6,9 / 15,5 / 41,4 | jour 6,9 / 14,4 / 37,0 |
| Régulier : or du minage | 63 Md | 136 Md |
| Assidu (graine 12345) : Maître / Légende / pioche 30 | jour 4,7 / 9,4 / 28,9 | jour 4,3 / 6,9 / 22,8 |
| Assidu : or du minage / absence | 67 / 184 Md | 166 / 178 Md |
| Éclats des filons (régulier) | 540 | 3 300 |

Le joueur assidu progresse nettement plus vite, et le joueur régulier un peu. La fin de partie reste bloquée au gardien de la zone 16 ([[gardien-de-zone]]).
