# Runes d'équipement

Demande de Théo (19/10/2026) : « rendre unique les équipements des joueurs », avec des runes que le joueur sertit sur ses pièces, dès la 1re étoile du Cœur du monde, et qui augmentent considérablement les stats. Théo a laissé les choix ouverts (« fais ce qui serait le mieux pour un joueur ») : runes sur l'emplacement, mêmes runes que les étoiles, retrait gratuit.

## Règles

- **Châsses** : dès la ★ du Cœur du monde, chaque emplacement (pioche, gants, casque, bottes, sac) a une châsse par étoile, trois au plus : 1 à la ★, 2 à la ★★, 3 dès la ★★★.
- **Sur l'emplacement, pas sur l'objet** : un joueur forge des milliers d'objets ; une rune sertie reste quand une meilleure pièce remplace l'ancienne.
- **Mêmes runes que les étoiles** : celles du Creuset et de la réserve de la Forge du Cœur. Le joueur choisit où mettre ses runes : l'étoile suivante ou son équipement.
- **Retrait gratuit** : la rune retourne dans la réserve, prête à être sertie ailleurs (ou fusionnée). Remplacer une rune rend aussi l'ancienne.
- **Effets** : chaque élément renforce une stat, d'autant plus que le rang est haut.

| Rune | Bonus | Rang 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|---|
| Feu | Frappe | +5 % | +12 % | +25 % | +50 % | +100 % |
| Lumière | Or | +5 % | +12 % | +25 % | +50 % | +100 % |
| Terre | Vitesse (points) | +1,2 | +3 | +6 | +10 | +18 |
| Glace | Critique (points) | +0,6 | +1,5 | +3 | +5 | +8 |
| Ombre | Dégâts critiques | +6 % | +15 % | +30 % | +60 % | +120 % |

- **Runes d'alliance** : 120 % d'une rune élémentaire du même rang, partagés entre les éléments de leur recette (Magma : Frappe et Vitesse ; Tempête : Critique et Dégâts critiques ; Bosquet : Vitesse et Or ; Éclipse : Dégâts critiques et Or ; Cœur : Frappe, Critique et Or).
- **Affinité** : une rune sur la pièce de son esprit (Feu sur la pioche, Glace sur les gants, Ombre sur le casque, Terre sur les bottes, Lumière sur le sac) compte une fois et demie.
- **Résonance** : les trois châsses d'une pièce serties du même type de rune (rangs libres) : +25 % sur ces trois runes. La pièce s'illumine.
- **Cumul** : toutes les runes serties forment une famille de bonus, comme les compétences, l'artefact ou le compagnon. Elles s'additionnent entre elles, et la famille se multiplie avec les autres pour la Frappe et l'or.

C'est la combinaison de runes, d'affinités et de résonances qui rend l'équipement de chaque joueur unique.

## Écran

- **Runes d'équipement**, ouvert depuis la Forge du Cœur (« Sertir mon équipement ») : le total des bonus, puis une carte par pièce avec ses trois châsses (les fermées affichent l'étoile qui les ouvre) et ce qu'elles donnent. Toucher une châsse ouvre la liste des runes de la réserve, avec ce que chacune donnerait sur cette pièce, et « Retirer la rune ».
- Dans le panneau d'équipement, les runes serties apparaissent en petites gemmes en haut du cadre de chaque pièce.

## Ce que dit le simulateur (régulier, 200 jours)

Le joueur simulé garde la priorité aux runes des étoiles, passe 10 minutes de plus par jour dans les Échos pour son équipement, et sertit sur chaque pièce la rune de son esprit au rang visé.

| Puissance | Sans runes d'équipement | Runes de rang 2 | Runes de rang 3 |
|---|---|---|---|
| Jour 98 | 1,6 Md | 3,2 Md (×2) | 4,3 Md (×2,7) |
| Jour 200 | 3,3 Md | 6,3 Md (×1,9) | 9,9 Md (×3) |

Les étoiles arrivent aux mêmes jours à quelques jours près (la 5e étoile varie de toute façon avec la chance aux fusions). Une première version, deux fois plus forte, donnait ×6 dès le jour 56 et faisait atteindre la zone 20 bien trop tôt : les valeurs ont été divisées par deux et la résonance ramenée de +50 % à +25 %.

## Technique

- Chiffres : `balance/gear-runes.ts`.
- Règles pures : `heart-forge/gear-runes-rules.ts` (sertir, retirer, bonus) ; les runes serties sont dans l'état de la Forge du Cœur (`gear`, clé `mine-explorer.forge-du-coeur`), une ancienne sauvegarde sans ce champ a ses châsses vides.
- Service `heart-forge/gear-runes.ts` (châsses ouvertes selon les étoiles, famille de bonus ajoutée par `Miner`), page `heart-forge/gear-runes-page/`.
- Simulateur : `craftGearRunes` dans `tools/simulate.mts` (`GEAR_ECHO_MINUTES`, `GEAR_RANK`, `--sans-runes-equipement`).
