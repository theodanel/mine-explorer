# Atelier

Refonte demandée par Théo le 14/10/2026 : l'Atelier renforce l'équipement **par qualité**, de 1 à 50, il coûte bien moins cher au début, et il s'ouvre dès le Mineur.

## Règles

- **Les niveaux appartiennent à un emplacement et une qualité.** Renforcer un casque d'acier au niveau 24 rend tous les casques d'acier niveau 24 (on peut en changer sans rien perdre). Un casque de mithril a ses propres niveaux, qui partent de 0.
- **On renforce la pièce portée.** Un emplacement vide ne se renforce pas.
- **Niveau maximum : 50.**
- **Effet : +0,4 % par niveau** de la stat d'Atelier de l'emplacement (Frappe pour la pioche, Critique pour les gants, Dégâts critiques pour le casque, Vitesse pour les bottes, Bonus d'or pour le sac), soit +20 % au niveau 50.
- **Prix** :
  - **Or** : un demi-filon de la zone de la qualité au niveau 1, puis +10 % par niveau (×117 au niveau 50). Une qualité plus haute coûte donc plus cher dès le départ, sans excès.

    | Qualité | Niveau 1 | Niveau 25 | Niveau 50 |
    |---|---|---|---|
    | Cuivre | 305 | 3 k | 32 k |
    | Acier | 6 k | 60 k | 650 k |
    | Mithril | 51 k | 500 k | 5,4 M |
    | Divin | 1,2 M | 12 M | 129 M |

  - **Minerai** : celui de la qualité (Acier pour une pièce d'acier), 1 au début puis 1 de plus tous les 10 niveaux. Le Bois n'en demande pas.
- **Ouverture** : forme Mineur (vers 12 h de jeu), au lieu du Contremaître.

Avant la refonte, le niveau valait pour tout l'emplacement, quelle que soit la pièce, et le premier niveau coûtait 4 M d'or.

## Comparaison des objets

Les niveaux d'Atelier comptent dans la comparaison d'un objet forgé : une pièce d'une autre qualité n'a pas les mêmes niveaux, donc sa Puissance « avec cet objet » en tient compte. La forge automatique (filtre « meilleurs objets seulement ») aussi.

## Équilibrage

Simulation du joueur régulier sur 5 graines (`tools/simulate.mts regulier 70`) :

- pioche 30 au jour 47,5 en moyenne, contre 48,1 avant la refonte ;
- l'Atelier vaut ×1,38 de Puissance au jour 70 (×1,37 avant), avec des pièces divines aux niveaux 30 à 40 ;
- un pas de +1,5 % par niveau avançait la pioche 30 au jour 38, et +0,6 % au jour 44 : l'Atelier étant ouvert plus tôt et bien moins cher, le pas a été réduit pour garder le rythme.

## Sauvegarde

Clé `mine-explorer.workshop` : `{ emplacement: { qualité: niveau } }`. L'ancien format (`{ emplacement: niveau }`) est converti une fois : le niveau passe à la qualité de la pièce portée, plafonné à 50 ; un emplacement vide le perd.

## Affinités et reforge (15/10/2026)

Retour de Théo : « il n'y a pas de réel composition de stats ». Les affixes étaient tirés au hasard parmi les 5 stats, sur n'importe quelle pièce : on gardait juste la plus grosse Puissance.

**Affinités** : chaque emplacement a deux stats qui sortent 3 fois plus souvent en affixe (`SLOT_AFFINITIES`, `AFFINITY_WEIGHT`). On sait où chercher quoi. Elles sont affichées sur chaque ligne de l'Atelier.

| Emplacement | Affinités |
|---|---|
| Pioche | Frappe, Dégâts crit. |
| Gants | Critique, Frappe |
| Casque | Dégâts crit., Critique |
| Bottes | Vitesse, Bonus d'or |
| Sac | Bonus d'or, Vitesse |

**Reforge** : sous chaque pièce portée, toucher un affixe en pourcentage le relance vers une stat que la pièce ne porte pas encore, tirée avec les affinités. La qualité du tirage est conservée : un affixe à 90 % de sa valeur attendue le reste dans sa nouvelle stat.
- **Prix** : 12 minerais de la qualité de la pièce, et l'or d'un niveau 5 d'Atelier dans cette qualité.
- **La Frappe ne se reforge pas** : la sauvegarde fond son affixe dans la Frappe de base, on ne saurait pas quelle part relancer.
- **Pièce pleine** : quand elle porte déjà toutes les stats en pourcentage, il n'y a plus rien à reforger.
- **Code** : `equipment/reforge-rules.ts` (pur), `Workshop.reforge`, `Inventory.replaceEquipped`.

## Toutes les stats de la pièce (16/10/2026)

Demande de Théo : l'Atelier renforce toutes les stats de la pièce, pas une seule. Chaque niveau donne +0,4 % à la Frappe de base et à tous les affixes de la pièce portée (avant : +0,4 % à la seule stat d'Atelier de l'emplacement, appliqués au total de cette stat). La Frappe ajoutée suit le bonus d'évolution, et les plafonds (Vitesse, Critique) restent appliqués. Simulé sur 2 graines : pioche 30 au jour 35,8, comme avant (35,8).

