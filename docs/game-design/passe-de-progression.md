# Passe de progression

Lot 4 des idées inspirées de Forge Master, demandé par Théo le 19/10/2026.

## Règles

- Un palier **tous les 5 filons** épuisés depuis le début de la partie : 3 par zone, des zones 1 à 20, soit 60 paliers (`balance/progress-pass.ts`).
- Les paliers atteints se lisent dans la progression de la mine (zone et filon de la frontière) : rien à compter à part, et une ancienne partie retrouve d'un coup tous ses paliers.
- Récompenses, récupérées d'un geste (« Tout récupérer ») :
  - éclats : le numéro de la zone (le double au dernier palier d'une zone) ;
  - 2 minerais de la zone (sauf en zone 1, sans minerai).
- Le **dernier palier de chaque zone** réserve une récompense de collection (tenue du lot 7 ou titre du lot 6). Elle sera attribuée d'après les paliers déjà récupérés : un joueur qui a récupéré ses paliers avant ces lots ne perd rien.
- Sauvegarde : seul le nombre de paliers récupérés (`mine-explorer.passe`).

## Écran

- Sur la mine, sous le bandeau de zone : « Passe : +4 dans 3 filons », ou en vert « Passe : 2 récompenses ! ». Il ouvre la page du passe.
- Page « Passe de progression » : « Tout récupérer », puis les 20 zones et leurs 3 paliers (atteint, récupéré ou verrouillé).

## Simulateur (régulier, 60 jours, 3 tirages, pioche 30)

| Récompenses | Pioche 30 |
|---|---|
| Sans passe | jours 27,8 / 27,8 / 27,8 |
| Spec : 5 × la zone, 5 minerais (3 800 éclats) | 25,3 / 25,3 / 25,3 |
| 2 × la zone, 2 minerais | 25,9 / 26,8 / 25,9 |
| **Retenu : 1 × la zone, 2 minerais** | 26,8 / 26,8 / 26,9 |

Les éclats du début comptent beaucoup (chaque forge en plus améliore l'équipement quand il est encore faible). Même petites, les récompenses avancent la pioche 30 d'environ un jour : c'est le prix d'un passe qui récompense vraiment. Le simulateur a l'option `--sans-passe`.
