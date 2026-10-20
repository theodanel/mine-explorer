# Bonus de panoplie

Lot 3 des idées inspirées de Forge Master, demandé par Théo le 19/10/2026.

## Règles

- **3 pièces portées du même palier** (Bois, Fer, Mithril…) : **+3 % de Frappe**. **Les 5** : **+8 %** (le bonus à 3 ne s'y ajoute pas). Valeurs dans `SET_BONUSES` (`balance/balance.ts`).
- Le palier compté est le plus porté ; à égalité, le plus haut.
- Le bonus multiplie la Frappe de l'équipement, avant l'Atelier et l'évolution, qui s'y appliquent ensuite.
- Avec les builds libres, rien ne change : la panoplie ne regarde que le palier, pas les stats portées. Les comparaisons d'objets (« meilleur que celui porté », filtres) en tiennent compte, puisqu'elles passent par `computeStats`.

## Écran

- Une pastille au-dessus de la rangée d'équipement, dès 2 pièces du même palier : « Panoplie Fer 2/5 : bonus à 3 pièces du même rang », puis, une fois le bonus actif, « ✦ Bonus panoplie Fer 3/5 : +3 % Frappe » aux couleurs du palier.
- Bonus actif (demande de Théo, 20/10/2026) : les pièces de la panoplie ont un liseré doré qui pulse et une étoile ✦ au coin.

## Simulateur (60 jours, 3 tirages, pioche 30)

La spec partait de +5 % et +15 %. En fin de partie presque tout l'équipement est du même palier (la forge sort surtout le palier de base) : la pioche 30 arrivait environ 1,3 jour plus tôt (régulier 26,3 / 26,3 / 26,9 contre 27,8 / 27,3 / 28,3 ; assidu 15,8 / 15,8 / 15,3 contre 16,8 ×3). À +3 % et +8 % : régulier 27,8 / 26,9 / 27,3, assidu 16,3 / 16,3 / 15,8, soit un écart de l'ordre du bruit.
