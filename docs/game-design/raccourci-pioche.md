# Jouer raccourcit l'amélioration de la pioche

Lot 2 des idées inspirées de Forge Master, demandé par Théo le 19/10/2026.

## Règles

- Pendant l'amélioration de la pioche, chaque **filon épuisé** retire **2 %** de sa durée totale (au moins 5 s), et un **gardien battu** (fin de zone) en retire **10 %** (`upgradeShortcutMs` dans `balance/balance.ts`).
- Seuls les filons de la zone en cours comptent : les filons sans fin d'une zone passée, faciles à enchaîner, ne raccourcissent rien (comme pour les missions).
- Rien hors ligne : ça récompense le jeu actif.
- Le temps gagné ne dépasse jamais ce qu'il reste ; l'amélioration se termine aussitôt si le minuteur arrive à zéro.
- À l'écran, un « −12 s » vert s'envole du bouton de la pioche à chaque gain.

## Simulateur (60 jours, 3 tirages, pioche 30)

| Profil | Sans raccourci | Avec |
|---|---|---|
| Régulier | jours 27,8 / 27,3 / 28,3 | 27,8 / 27,8 / 27,8 |
| Assidu | 16,8 / 16,8 / 16,8 | 16,3 / 16,7 / 16,3 |

La fin de partie ne devient pas triviale : le joueur régulier n'avance pas plus vite (l'or reste le vrai frein), l'assidu gagne moins d'une demi-journée. Option `--sans-raccourci-pioche` pour comparer.
