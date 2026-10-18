# Recherches (compétences façon Forge Master)

Proposition du 16/10/2026, **à valider par Théo avant le code**. Demande : une variété de compétences bien plus grande, et chaque amélioration payée avec une ressource dédiée et un temps d'étude, comme les Technologies de Forge Master, au lieu de points qu'on débloque trop peu.

## Ce qui change

**Aujourd'hui** : 3 points de compétence par zone terminée, 15 nœuds (9 passifs, 6 sorts) en 3 branches. Les zones s'allongent, donc les points se raréfient justement quand on en voudrait plus.

**Demain** :
- **Une ressource, les parchemins**, gagnée en jouant. Plus de points par zone.
- **Chaque rang coûte des parchemins et un temps d'étude.** Une seule étude à la fois, qui continue jeu fermé, comme la pioche.
- **Un arbre de 40 nœuds en 4 branches.** Chaque branche s'ouvre rangée par rangée : il faut avoir étudié assez de rangs dans les rangées précédentes.
- **Les sorts restent dans l'arbre** : on les apprend puis on les améliore avec des parchemins.

## La ressource : les parchemins

| Source | Quantité |
|---|---|
| Filon épuisé | 1 parchemin, 1 fois sur 4 |
| Gardien de zone | 3 + 1 par numéro de zone (12 en zone 9) |
| Missions du jour | 2 par mission, 10 dans le coffre |
| Aventures | 2 par partie, plus selon le résultat |
| Marchand nain | lot de 30 parchemins |

Repère : environ 50 parchemins par jour pour le joueur régulier, 100 pour l'assidu, à confirmer au simulateur.

## Le prix d'un rang

- **Parchemins** : 3 au rang 1, ×1,35 par rang (3, 4, 5, 7, 10, 13, 18, 24, 33, 44). Une rangée profonde coûte ×1,5 de plus.
- **Temps d'étude** : 2 min au rang 1, ×1,5 par rang (2 min, 3 min, 4 min 30, 7 min, 10 min, 15 min, 23 min, 34 min, 51 min, 1 h 17). Les nœuds des rangées profondes étudient 2 fois plus longtemps.
- **Rangées** : la rangée 2 s'ouvre à 5 rangs étudiés dans la branche, la 3 à 15, la 4 à 30.

## Les 40 nœuds

Ce qui existe déjà est marqué ★ (conservé, les rangs déjà appris restent).

### Force : casser plus fort

| Rangée | Nœud | Effet par rang | Rangs |
|---|---|---|---|
| 1 | ★ Poigne solide | +3 % de Frappe | 10 |
| 1 | ★ Dynamite (sort) | gros coup, +2× Frappe par rang | 5 |
| 1 | Bras d'acier | +1 % de Frappe par zone terminée, plafonné | 5 |
| 2 | ★ Œil vif | +1 % de Critique | 10 |
| 2 | ★ Coups précis | +8 % de Dégâts critiques | 10 |
| 2 | Tailleur de gardiens | +5 % de dégâts aux gardiens | 5 |
| 3 | Dernier souffle | +1 s au chrono du gardien | 5 |
| 3 | Fissure | 1 coup sur 20 inflige ×3 | 5 |
| 3 | ★ Coup de grisou (sort) | explosion énorme, plus forte à chaque rang | 5 |
| 4 | Brise-roche | +10 % de dégâts sur un filon au-dessus de 80 % de PV | 5 |

### Prospection : gagner plus

| Rangée | Nœud | Effet par rang | Rangs |
|---|---|---|---|
| 1 | ★ Flair de l'or | +5 % d'or | 10 |
| 1 | Prospecteur | +5 % de minerai par coup | 5 |
| 1 | ★ Chercheur de géodes | +0,2 point de chance d'éclat par coup | 10 |
| 2 | ★ Filon doré (sort) | or ×3 pendant quelques secondes | 5 |
| 2 | Bourse pleine | +3 % au prix de vente des objets | 5 |
| 2 | Coffre du gardien | +10 % d'éclats au gardien | 5 |
| 3 | ★ Sac sans fond | +5 points d'or d'absence | 5 |
| 3 | Lettré | +5 % de parchemins | 5 |
| 3 | ★ Écho de géode (sort) | chaque coup peut faire tomber un éclat, pendant quelques secondes | 5 |
| 4 | Veine royale | 1 filon sur 10 rapporte ×5 d'or | 5 |

### Maîtrise : les sorts

| Rangée | Nœud | Effet par rang | Rangs |
|---|---|---|---|
| 1 | ★ Frénésie (sort) | Vitesse ×2 pendant quelques secondes | 5 |
| 1 | ★ Mèche courte | −4 % de recharge des sorts | 10 |
| 1 | Réflexes | +2 % de Vitesse | 10 |
| 2 | ★ Œil du géologue (sort) | coups tous critiques | 5 |
| 2 | ★ Concentration | +10 % de durée des sorts | 10 |
| 2 | Enchaînement | 5 % de chance qu'un sort ne se recharge pas | 5 |
| 3 | ★ Maître artificier | +20 % de dégâts des explosions | 5 |
| 3 | Lien animal | −5 % de recharge de la compétence du familier | 5 |
| 3 | Double mèche | la Dynamite part 2 fois, 1 fois sur 10 par rang | 5 |
| 4 | Grand maître | +3 % à tous les effets de sorts | 5 |

### Expédition : la vie autour de la mine

| Rangée | Nœud | Effet par rang | Rangs |
|---|---|---|---|
| 1 | Entrepôt souterrain | +15 min d'absence prise en compte | 8 |
| 1 | Forge rapide | −5 % de durée d'amélioration de la pioche | 10 |
| 1 | Nid douillet | −5 % de temps d'éclosion des œufs | 10 |
| 2 | Aventurier | +1 partie par jour dans une aventure (rangs 1 à 3 : Puits, Chasse, Forge express) | 3 |
| 2 | Forgeron économe | 2 % de chance qu'une forge ne coûte pas d'éclats | 10 |
| 2 | Expéditions longues | +5 % de butin des expéditions des familiers | 10 |
| 3 | Atelier fraternel | −3 % d'or à l'Atelier | 10 |
| 3 | Éveilleur | +5 % de pierres d'éveil | 5 |
| 3 | Étudiant | −5 % de temps d'étude | 10 |
| 4 | Érudit | 2 études en même temps | 1 |

## Bascule depuis l'arbre actuel

- Les rangs déjà appris sont conservés, et les sorts appris restent appris.
- Les points de compétence non dépensés deviennent des parchemins : 10 par point.
- Les rangs maximum montent de 5 à 10 sur les nœuds de base : il reste de quoi étudier.

## À trancher par Théo

1. **Le nom de la ressource** : parchemins (proposé), grimoires, notes de mine ?
2. **La liste des 40 nœuds** : à garder, retirer ou ajouter.
3. **Accélérer une étude** avec des éclats ou des gemmes, comme dans Forge Master, ou pas du tout (proposé : pas du tout, pour ne pas ouvrir la porte à une monnaie payante).
4. **Images Gemini** : une icône par nouveau nœud (25), ou des icônes génériques par branche (4, proposé pour commencer).
