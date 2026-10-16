# Compétences des familiers

Demande de Théo, 16/10/2026 : chaque familier a une compétence unique, qui s'active comme un sort et aide à faire des dégâts ou autre.

## Règles

- Le familier qui accompagne le mineur ajoute sa compétence dans la barre de sorts, avant les sorts. C'est une pastille carrée à son portrait, pour la distinguer des sorts ronds.
- Elle se lance au toucher, ou toute seule avec « Auto », comme les sorts. Elle reste visible même sans aucun sort appris.
- Chaque familier a son propre minuteur : en changer ne remet pas la recharge à zéro.
- **Les étoiles la renforcent** : une explosion frappe ×1 à 1 étoile et ×3 à 5, comme le bonus du familier. Un effet dure 1 seconde de plus par étoile.
- Les bonus des sorts s'appliquent aussi : Mèche courte (recharge), Concentration (durée), Maître artificier et Dragonnet (explosions).

| Familier | Compétence | Effet | Recharge |
|---|---|---|---|
| Canari | Chant de prospecteur | or ×2 pendant 8 s | 60 s |
| Taupe | Galerie souterraine | coup de 6 fois la Frappe | 40 s |
| Chauve-souris | Écholocation | tous les coups critiques pendant 5 s | 50 s |
| Luciole | Nuée lumineuse | +20 % de chance d'éclat par coup pendant 8 s | 60 s |
| Golem | Poing de pierre | coup de 15 fois la Frappe | 60 s |
| Dragonnet de magma | Souffle de magma | Vitesse ×2 pendant 7 s | 50 s |

## Équilibrage

Simulé (joueur régulier, 3 graines) : la compétence du familier fait environ 6 % des dégâts de la partie. Légende vers le jour 13,4 (14,4 avant), pioche 30 vers le jour 36,3 (37 avant).

## Technique

- **Données** : `ability` dans `COMPANIONS` (`balance/companions.ts`).
- **Règles pures** : `companions/companion-ability-rules.ts` (recharge, durée, explosion, effets).
- **Minuteurs et effets** : `Spells` (`companionSlot`, `triggerCompanion`), cumulés aux effets des sorts.
- **Lancement** : `SpellCaster.castCompanion`, aussi en automatique. La scène montre l'explosion de la dynamite, faute d'effet visuel propre.
- **Affichage** : `spells/spell-bar/`.
- **Simulateur** : il lance la compétence du familier actif comme un sort.
