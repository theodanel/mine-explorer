# Builds libres

Retour à [[Accueil]]. Décidé le 13/10/2026 à la demande de Théo : « que chaque pièce d'équipement puisse avoir chaque stat […] full speed mais pas de dégâts, full critique et dégâts des coups critiques, full frappe ».

## Règle

- **Toute pièce** (casque, pioche, sac, gants, bottes) peut porter **n'importe quelle stat**. L'emplacement ne décide plus de la stat ; il garde seulement la stat que l'Atelier renforce.
- **Frappe de base** : chaque pièce a un peu de Frappe (25 % de la valeur de référence de son palier et de son niveau). Un build sans affixe de Frappe tape donc quand même : le build « tout en Vitesse » existe vraiment.
- **Affixes selon la qualité**, tirés dans les 5 stats, sans doublon sur un même objet :

| Palier | Affixes | Exemple |
|---|---|---|
| Bois, Pierre, Cuivre | 1 | Bottes en Cuivre : Frappe de base, Critique |
| Fer, Acier, Or | 2 | Pioche en Or : Frappe de base, Vitesse, Dégâts crit. |
| Mithril, Cristal, Magma | 3 | Casque en Cristal : Frappe de base, Frappe, Critique, or |
| Divin | 4 | Gants divins : les 5 stats |

- **Valeur d'un affixe** : part de la valeur de référence (Frappe 30 %, Vitesse 110 %, Critique 110 %, Dégâts crit. 90 %, or 120 %), plein tarif pour le premier affixe, 60 % pour les suivants, ±10 % de variation.
- Comme un objet ne porte jamais deux fois la même stat, un build pousse une stat au plus 5 fois (une par pièce) : c'est la limite naturelle des builds extrêmes.

## Pourquoi ces chiffres

Laissées à leur ancienne valeur, les stats libres donnaient un build tout en Frappe **4 fois plus fort** que l'ancien équipement : le jeu devenait trop facile, et Frappe était le seul build qui valait quelque chose (tout en Vitesse : 4 % de sa Puissance au niveau 10). Les valeurs ont été réglées en deux temps.

1. **Au calcul**, pour que les builds se tiennent. Puissance de chaque build, en part du meilleur, avec des objets moyens du niveau de pioche :

| Pioche | Tout Frappe | Tout Vitesse | Tout critique | Mixte | Frappe + Vitesse | Frappe + critique | Tout or |
|---|---|---|---|---|---|---|---|
| 6 | 100 % | 72 % | 60 % | 80 % | 93 % | 77 % | 53 % |
| 15 | 100 % | 83 % | 71 % | 88 % | 99 % | 84 % | 54 % |
| 25 | 88 % | 93 % | 100 % | 98 % | 95 % | 98 % | 55 % |
| 30 | 80 % | 87 % | 100 % | 93 % | 86 % | 94 % | 56 % |

   La Frappe mène au début, le critique en fin de partie, les mélanges sont toujours proches du meilleur : aucun build n'écrase les autres, et changer de build en cours de partie a du sens. Le build « tout or » échange environ 45 % de Puissance contre de l'or : un choix d'économie, pas un piège.

2. **Au simulateur**, pour que l'économie ne bouge pas. Le simulateur équipe chaque objet qui monte la Puissance, donc il ignore l'or : il finissait avec +5 % d'or au lieu de +89 %, et la pioche 30 n'arrivait plus en 70 jours. Le revenu de base passe de 0,25 à 0,34 pièce par PV miné pour compenser. Résultat (joueur 1 h par jour, 5 tirages) : pioche 30 au jour 48,0 (48,2 avant), évolutions aux jours 0,9 / 4,5 / 7,9 / 16,8 (0,9 / 4,8 / 8,3 / 17,3 avant).

## Ce qui change pour le joueur

- La comparaison d'un objet forgé montre toutes ses stats face à celles de l'objet porté, comme avant.
- Le filtre de stat de la forge auto garde les objets qui portent la stat **en affixe** : la Frappe de base de chaque pièce ne compte pas, sinon le filtre Frappe laisserait tout passer.
- Les objets déjà forgés (une stat par emplacement) restent tels quels dans la sauvegarde : ils marchent toujours, et seront remplacés au fil des forges.
- L'Atelier renforce toujours la même stat par emplacement (Frappe pour la pioche, Vitesse pour les bottes…), quel que soit l'objet porté.

## Pistes

- Un bouton « verrouiller une stat » à la forge, ou des filtres par build enregistrés.
- Des bonus d'ensemble (3 pièces Vitesse : +x %) pour récompenser les builds purs.
