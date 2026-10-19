# Donjons de ressources

Lot 5 des idées inspirées de Forge Master, demandé par Théo le 19/10/2026, d'après le principe de `prompt-refonte-majeure.md` §5.9 : pas de chrono, un nombre de coups fixe.

## Règles

- Ouverts à la **zone 4**, dans l'onglet Aventures. Deux donjons :
  - **Grotte de cristal** : des éclats de géode ;
  - **Forge ancestrale** : le minerai de la zone la plus profonde atteinte.
- **2 clés par jour** et par donjon ; les clés non utilisées s'accumulent jusqu'à **4**.
- Un niveau = un rocher à casser en **20 coups** (la Frappe et les critiques permanents du mineur, sans les sorts). Ses PV grandissent de 20 % par niveau, sans fin.
- Une **victoire** dépense une clé, donne la récompense et ouvre le niveau suivant. Une **défaite ne coûte rien** : la clé est gardée (pas de progression bloquée par la malchance aux critiques).
- **Balayage** : rejoue instantanément le meilleur niveau battu, contre une clé.
- Récompense : une base plus une hausse linéaire par niveau (Grotte : 5 + 1 éclat par niveau ; Forge : 2 + 0,5 minerai par niveau).
- Sauvegarde : `mine-explorer.donjons` (clés, record de chaque donjon, jour des dernières clés).

## Simulateur (régulier, 60 jours, 3 tirages)

Le joueur simulé dépense chaque jour ses clés au niveau suivant s'il le casse en 20 coups moyens, sinon au balayage. Il atteint le niveau 78 environ au jour 60.

| Récompenses | Éclats des donjons | Pioche 30 |
|---|---|---|
| Sans donjons | 0 | jours 26,3 / 25,3 / 25,3 |
| Départ : 10 + 2 éclats, 4 + 1 minerai par niveau | 13 800 | 24,8 / 24,3 / 24,3 |
| **Retenu : 5 + 1 éclat, 2 + 0,5 minerai par niveau** | 6 900 | 24,3 / 24,8 / 25,3 |

Option `--sans-donjons` pour comparer. Les visuels reprennent les décors des zones 8 (cristal) et 5 (forge naine) et leurs rochers.
