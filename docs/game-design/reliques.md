# Reliques : emplacements en plus et réforge

Proposition du 18/10/2026, après le retour d'un ami de Théo : « les reliques ne servent pas beaucoup ». **Validée par Théo le 18/10/2026 telle quelle** (emplacements au Contremaître et à la Légende, réforge à l'Atelier, coût en minerais seuls) et codée : `artifacts/artifact-rules.ts`, `artifacts/artifact-reforge/`, page Artefacts.

## Le constat

- **Un seul artefact porté** : on en trouve 26 en 90 jours (11 différents sur 13), mais un seul compte. Les autres dorment dans la collection.
- **Effets modestes** : +5 à +15 % au niveau 1, ×2 au niveau 5. Le meilleur légendaire au niveau 5 vaut à peu près un niveau de pioche.
- **Doublons sans intérêt** au-delà du niveau 5 : 10 éclats, rien d'autre.
- **Minerais qui s'empilent** : ils ne servent plus qu'à l'Atelier, et la fin de partie en accumule.

## 1. Trois emplacements

| Emplacement | S'ouvre | Pourquoi là |
|---|---|---|
| 1 | dès le premier artefact (comme aujourd'hui) | |
| 2 | au Contremaître (rang 3) | le joueur a alors 4 ou 5 artefacts : le choix devient réel |
| 3 | à la Légende de la mine (rang 5) | une récompense de plus pour le grand palier, en même temps que le Cœur du monde |

- Les emplacements se remplissent dans la page Artefacts : on touche un artefact, puis l'emplacement.
- Un même artefact ne se porte qu'une fois.
- Sauvegarde : l'artefact porté aujourd'hui passe dans l'emplacement 1, rien n'est perdu.

## 2. La réforge (le « pari » proposé)

> **19/10/2026** (demande de Théo) : le bloc de réforge de l'Atelier n'apparaît plus qu'avec un artefact au niveau 5, sans texte d'explication.

À l'Atelier, un artefact **au niveau 5** peut être réforgé. Il garde son effet et gagne un **effet secondaire** tiré au hasard, avec sa qualité.

| Effet secondaire | Commun | Rare | Épique | Légendaire |
|---|---|---|---|---|
| Frappe | +4 % | +6 % | +8 % | +10 % |
| Or | +6 % | +9 % | +12 % | +15 % |
| Vitesse | +3 pts | +5 pts | +6 pts | +8 pts |
| Critique | +1 pt | +1,5 pt | +2 pts | +3 pts |
| Dégâts critiques | +8 % | +12 % | +16 % | +20 % |
| Chance d'éclat | +0,2 pt | +0,3 pt | +0,4 pt | +0,5 pt |

- **Qualité** : Commun 50 %, Rare 30 %, Épique 15 %, Légendaire 5 %.
- **Choix après le tirage**, comme dans Forge Master : on garde le nouvel effet ou on revient à l'ancien. Un tirage raté ne fait jamais perdre.
- **Coût** : des minerais de **trois matériaux différents** (ceux des zones déjà traversées), 30 de chacun pour la première réforge. Chaque réforge du même artefact coûte 50 % de plus, jusqu'à 3 fois le prix de départ. C'est enfin un usage pour les minerais qui s'empilent.
- **Les doublons servent** : au-delà du niveau 5, un doublon donne un **jeton de réforge** (une réforge gratuite de cet artefact) au lieu de 10 éclats.

## Ce que dit le simulateur (régulier, 2 tirages, 100 jours)

Essai sur une copie du simulateur : le joueur porte ses meilleurs artefacts, et la réforge est comptée comme +6 % de Frappe moyen sur chaque artefact au niveau 5.

| | Aujourd'hui | 3 emplacements | 3 emplacements + réforge |
|---|---|---|---|
| Puissance au jour 70 | 2,7 Md | 3,1 à 3,2 Md | 3,5 à 3,7 Md |
| Zone 19 atteinte | jour 46,5 | jour 45,4 | jour 45,2 |
| Zone 20 atteinte | jour 66,5 | jour 63,4 | jour 61,7 |
| Gardiens des zones 13 à 20 | 7 à 28 s | 5 à 29 s | 5 à 27 s |

Les artefacts gagnent environ 15 à 35 % de Puissance en fin de partie. Ils comptent enfin, sans casser la progression : la zone 20 arrive 3 à 5 jours plus tôt, et les gardiens restent un vrai combat.

## Dans le jeu

- **Page Artefacts** : les 3 emplacements en haut (ceux encore fermés affichent le rang qui les ouvre). On sélectionne un artefact, puis on touche un emplacement pour l'y porter ; on retouche l'emplacement pour le retirer. Le bouton « Équiper » le met dans le premier emplacement libre.
- **Atelier** : une section « Réforge des artefacts » sous les emplacements d'équipement, avec chaque artefact au niveau 5, son effet actuel, le prix (ou ses réforges gratuites) et, après un tirage, « Garder » ou « Revenir ».
- **Prix** : les 3 matériaux dont le joueur a le plus sont pris automatiquement.
- **Simulateur** (régulier, 120 jours, réforge une fois par jour quand c'est payable, effet gardé s'il est meilleur) : zone 20 terminée vers le jour 109 à 113 au lieu de 120. Les minerais partent surtout dans l'Atelier : 2 ou 3 réforges payées en 120 jours, les doublons au-delà du niveau 5 restent la source principale.
