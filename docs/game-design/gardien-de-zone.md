# Gardien de zone

Demande de Théo, 15/10/2026 : en laissant tourner le jeu, n'importe quelle Frappe finissait par passer toutes les zones, puisqu'un filon garde les dégâts reçus. Un ami de Théo était en zone 8 avec un équipement bien trop faible. Il fallait un mur que le temps seul ne franchit pas.

## Règles

- **Le dernier filon de chaque zone (15/15) est un gardien**, à casser en **30 secondes**. Le chrono démarre quand on arrive devant lui.
- **Raté** : le gardien se reforme, le mineur retombe sur le filon 14. Ce filon se reforme alors sans fin : on continue de gagner or, éclats et minerai, mais on ne passe plus.
- **Défier le gardien** : un petit bouton discret sous le bandeau de zone relance le combat quand on veut, avec la Puissance conseillée pour le passer (demande de Théo, 15/10/2026).
- Une partie rechargée devant le gardien repart d'un combat neuf, sans garder les dégâts : recharger ne sert pas à tricher sur le chrono.
- Les joueurs déjà plus loin gardent leur zone : rien n'est repris.
- En zone passée (retour pour récolter), pas de gardien : les filons y sont sans fin.

## Calibrage des PV

Les PV du gardien ne suivent pas la courbe des filons, ils sont calculés sur le temps :

`PV = 30 s × 50 % × (Puissance conseillée pour le filon 15 de la zone ÷ 100)`

La Puissance conseillée est celle qui casse le filon 15 dans le temps visé de la zone. Le joueur régulier du simulateur arrive au gardien autour de 60 à 80 % de cette Puissance, parce que le filon 15 est le plus dur de la zone. À 50 %, il casse le gardien en 15 à 28 secondes selon les zones (simulé sur 3 graines). À 70 %, il le ratait souvent (25 à 30 s) ; à 100 %, il bloquait en zone 15 pour de bon.

Un joueur qui laisse tourner le jeu sans améliorer son équipement bloque au premier gardien qu'il ne casse pas en 30 secondes, même toute une nuit : l'absence ne fait pas avancer, et le combat ne garde pas les dégâts d'un essai à l'autre.

**Fin de partie** : la pioche 30 arrive toujours vers le jour 41. Mais le joueur régulier bloque ensuite au gardien de la zone 16, qu'il ne casse plus avec l'équipement maximal. Avant, il atteignait la zone 17 vers le jour 50, avec des filons d'une heure et quart. Les zones 17 à 20 demanderont une nouvelle source de Puissance en fin de partie.

## Technique

- **Chiffres** : `GUARDIAN_SECONDS`, `GUARDIAN_POWER_SHARE`, `guardianHp`, `guardianPower` dans `balance/balance.ts`.
- **Règles pures** : `progression/progression-rules.ts` (`stageHp`, `applyDamage(…, blocked)`, `failGuardian`, `challengeGuardian`, `guardianTimeLeft`).
- **Service** : `progression.ts` tient le chrono (rafraîchi toutes les 100 ms) et le blocage (clé `mine-explorer.guardian-blocked`).
- **Affichage** : `mine-scene/` montre le rocher gardien du Puits sans fond, sa vie violette et le chrono ; le bandeau de zone affiche « Gardien », et sous lui le bouton « Défier le gardien » après un échec (`zone-banner/`).
- **Simulateur** : le joueur retente le gardien quand sa Puissance a gagné 5 %, ou au bout de 30 minutes ; le bilan liste les échecs et les temps de victoire par zone.
