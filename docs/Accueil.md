# Mine Explorer : accueil

Bibliothèque de connaissance du jeu, versionnée avec le code. Idle RPG mobile où un mineur creuse des filons, forge son équipement et fait évoluer sa pioche, inspiré de Legend of Mushroom, Forge Master et Freaky Duckling.

Commence par [[Decisions]] : ce qui est déjà tranché, en game design comme en technique.

## Game design

- [[GDD_Mine_Explorer]] : le document de conception (version d'octobre 2026, converti depuis le .docx). Plusieurs points ont changé depuis, voir [[Decisions]].
- [[GDD_points_a_trancher]] : les incohérences relevées dans le GDD et ce qui restait à décider.
- [[recherche-equilibrage]] : comment Forge Master et Legend of Mushroom gèrent leur progression (minuteurs, coûts exponentiels).
- [[ressources-game-design]] : synthèse des articles partagés (Deconstructor of Fun sur LoM, Math of Idle Games III sur le prestige, exemple de GDD) et chiffres des jeux de référence.
- [[competences-et-artefacts]] : arbre de compétences, sorts actifs et artefacts (budget de puissance, tables, découvertes).
- [[carte-des-zones]] : carte des zones façon jeu mobile, retour dans une zone passée pour miner son minerai sans fin (14/10/2026).
- [[atelier]] : renforcement de l'équipement par qualité, niveaux 1 à 50, prix et ouverture au Mineur (14/10/2026).
- [[idees-fun]] : ce qui rendrait le jeu plus fun et plus addictif (Atelier, événements de mine, embranchements, compagnons, son), avec l'équilibrage de chaque idée.
- [[refonte-compagnons-evolution]] : équipements en bas, évolution par objectifs, Défi de la mine et pierres d'éveil, éclats plus faciles (13/10/2026).
- [[puits-sans-fond]] : 3 descentes chronométrées par jour, étages de plus en plus durs, record personnel (14/10/2026).
- [[zones-11-20]] : décors et rochers des zones 11 à 20 (prompts Gemini), rythme simulé au-delà de la zone 10 (14/10/2026).
- [[loterie-du-jour]] : un tirage gratuit par jour, six lots (or, éclats, pierres d'éveil, œufs) qui changent à minuit (14/10/2026).
- [[aventures-prompts]] : prompts Gemini des quatre nouvelles aventures (Chasse au filon, Marchand nain, Forge express, Expédition aux flambeaux), 14/10/2026.
- [[forge-express]] : rythme à l'enclume dès le Maître des profondeurs, un objet bonus selon le score (14/10/2026).
- [[marchand-nain]] : marchand qui passe 5 jours par mois, annoncé par des indices, à marchander ou bluffer (14/10/2026).
- [[chasse-au-filon]] : « Quitte ou double » dès le Contremaître, une file de rochers à casser avant l'éboulement, 3 parties par jour (15/10/2026, remplace le démineur du 14/10).
- [[wagonnet-fou]] (retiré) : dès le Contremaître, 3 courses de wagonnet par jour sur 3 voies, aiguillages sûrs ou risqués, or et minerai pour l'Atelier (14/10/2026).
- [[campement]] : Taverne, Entrepôt et Puits, à faire grandir lentement dans l'onglet Aventures (14/10/2026).
- [[direction-visuelle]] : ce qui plaît dans le genre, couleurs par écran, par stat et par qualité, prochaines étapes (14/10/2026).
- [[builds-libres]] : toutes les stats sur toutes les pièces, affixes selon la qualité, réglage des builds (13/10/2026).
- [[equilibrage]] : les chiffres en vigueur dans le jeu (formules, coûts, zones, courbe simulée). Source de vérité : `frontend/src/app/balance/balance.ts`.
- [[prompt-refonte-majeure]] : analyse et plan de la refonte en phases (talents, compagnons, prestige, événements…).

## Technique

Documentation technique de référence, tenue à jour à chaque changement du code : [[documentation-technique]].

- [[architecture]] : découpage du frontend, état et sauvegarde, backend.
- [[installation]] : prérequis, lancement en local, commandes.
- [[tests]] : stratégie, couverture, simulateur d'économie.
- [[ci-cd]] : intégration continue, CodeQL, Dependabot.
- [[deploiement]] : mise en ligne sur Cloudflare Pages, secrets, restriction d'accès.
- [[securite]] : modèle de menace, en-têtes, limites assumées.
- [[choix-techniques]] : décisions techniques justifiées.

### Historique technique

Notes d'étude du début du projet, conservées pour mémoire ; elles ne décrivent plus forcément le code actuel.

- [[faisabilite]] : faisabilité Spring Boot + Angular, architecture recommandée, périmètre MVP.
- [[guide-demarrage-technique]] : relier le GDD au code, formules, 2D avec PixiJS, organisation du monorepo, GDD/TDD/roadmap.
- [[mvp-parcours]] : le parcours MVP en 7 étapes.
- [[evaluation-plugins]] : les plugins Claude Code évalués et pourquoi ils ont été écartés.

## Art

- [[prompts-gemini]] : prompts de génération des visuels (style commun, fond vert, détourage).

## Organisation du coffre

- `game-design/` : conception du jeu, équilibrage et prompts de visuels.
- `technique/` : documentation technique à jour ; `technique/historique/` : études du début du projet.
- À la racine : cet accueil et [[Decisions]].
- Les PDF de référence (guides Gamearly) et les images restent hors du coffre.
