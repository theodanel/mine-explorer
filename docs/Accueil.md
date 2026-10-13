# Mine Explorer : accueil

Bibliothèque de connaissance du jeu, versionnée avec le code. Idle RPG mobile où un mineur creuse des filons, forge son équipement et fait évoluer sa pioche, inspiré de Legend of Mushroom, Forge Master et Freaky Duckling.

Commence par [[Decisions]] : ce qui est déjà tranché, en game design comme en technique.

## Game design

- [[GDD_Mine_Explorer]] : le document de conception (version d'octobre 2026, converti depuis le .docx). Plusieurs points ont changé depuis, voir [[Decisions]].
- [[GDD_points_a_trancher]] : les incohérences relevées dans le GDD et ce qui restait à décider.
- [[recherche-equilibrage]] : comment Forge Master et Legend of Mushroom gèrent leur progression (minuteurs, coûts exponentiels).
- [[ressources-game-design]] : synthèse des articles partagés (Deconstructor of Fun sur LoM, Math of Idle Games III sur le prestige, exemple de GDD) et chiffres des jeux de référence.
- [[competences-et-artefacts]] : arbre de compétences, sorts actifs et artefacts (budget de puissance, tables, découvertes).
- [[idees-fun]] : ce qui rendrait le jeu plus fun et plus addictif (Atelier, événements de mine, embranchements, compagnons, son), avec l'équilibrage de chaque idée.
- [[equilibrage]] : les chiffres en vigueur dans le jeu (formules, coûts, zones, courbe simulée). Source de vérité : `frontend/src/app/balance/balance.ts`.
- [[prompt-refonte-majeure]] : analyse et plan de la refonte en phases (talents, compagnons, prestige, événements…).

## Technique

- [[faisabilite]] : faisabilité Spring Boot + Angular, architecture recommandée, périmètre MVP.
- [[guide-demarrage-technique]] : relier le GDD au code, formules, 2D avec PixiJS, organisation du monorepo, GDD/TDD/roadmap.
- [[mvp-parcours]] : le parcours MVP en 7 étapes.
- [[evaluation-plugins]] : les plugins Claude Code évalués et pourquoi ils ont été écartés.

## Art

- [[prompts-gemini]] : prompts de génération des visuels (style commun, fond vert, détourage).

## Organisation du coffre

- `game-design/` et `technique/` : notes copiées depuis le dossier partagé du projet le 12/10/2026. C'est désormais ici qu'elles vivent.
- À la racine : les notes de travail liées au code (`equilibrage.md`, `prompts-gemini.md`, `prompt-refonte-majeure.md`).
- Les PDF de référence (guides Gamearly) et les images restent hors du coffre.
