# Décisions prises

Ce qui est tranché pour Mine Explorer, avec la date quand elle est connue. Les chiffres exacts vivent dans [[equilibrage]] (et `balance/balance.ts`) : cette note donne les choix, pas les valeurs. Quand un document plus ancien dit autre chose (le [[GDD_Mine_Explorer]] notamment), c'est cette note qui fait foi.

Retour à [[Accueil]].

## Game design

### Principes

- **Pas de boss, pas de chrono, pas d'échec.** Un joueur trop faible avance plus lentement, il ne perd jamais rien. Répond au point 1 de [[GDD_points_a_trancher]].
- **Pas d'argent réel**, ni boutique payante, ni publicité pour l'instant. Le design peut rester compatible avec une monétisation future, sans rien qui pousse à payer.
- **Format mobile 9:16**, utilisable au doigt en 390×844. Interface en français, chiffres au format français.
- **Une progression longue.** La première version allait beaucoup trop vite (11/10/2026) : cible d'environ un mois pour atteindre la pioche 30. Début très généreux façon Legend of Mushroom, puis ralentissement progressif. Voir [[recherche-equilibrage]].

### Zones et filons

- Chaque zone compte **15 filons** (1-1 à 1-15, puis 2-1…). Le mot « filon » remplace « étape » et « rocher ».
- Chaque filon est un peu plus résistant que le précédent, et chaque zone nettement plus dure que la précédente. Bandeau « Zone 3 · Filon 4/15 ».
- **10 paliers de matériaux**, de Bois à Divin, un fond de zone par palier.

### Économie

- **Les raretés sont remplacées par les 10 paliers de matériaux** (refonte du 11/10/2026).
- **Le palier forgé dépend uniquement du niveau de pioche**, en fenêtre glissante façon Forge Master. 100 % Bois au niveau 1, paliers supérieurs très progressifs.
- **La pioche s'améliore par segments payés en or**, puis un minuteur façon Forge Master qui continue jeu fermé. L'or est le puits principal ; les minuteurs restent courts.
- **Forger coûte des éclats de géode**, qui tombent surtout en minant (chaque coup, chaque filon, chaque zone terminée, l'absence). Les missions complètent.
- **Minerais** : un par zone à partir de la zone 2 (Pierre). Pas de minerai de Bois. Ils servent aux évolutions.
- **Vendre compte** : l'objet remplacé est vendu automatiquement.
- **Absence** plafonnée à 4 h : moitié de l'or habituel et des éclats ; filons et missions n'avancent qu'en jeu.

### Mineur

- Cinq formes : Apprenti → Mineur (zone 5) → Contremaître (zone 7) → Maître des profondeurs (zone 9) → Légende de la mine (zone 11). Chacune coûte des minerais de paliers et de l'or et multiplie la Frappe. Fenêtre ouverte en tapant le portrait.
- Après la Légende (17/10/2026) : la Légende du Cœur du monde en cinq étoiles (zones 12, 14, 16, 18 et 20), gagnées par missions comme les formes, plutôt qu'un prestige. Voir [[etoiles-de-legende]].
- Cinq stats liées aux emplacements : Frappe (pioche), Vitesse (bottes), Critique (gants), Dégâts critiques (casque), Bonus d'or (sac). Le vocabulaire de combat est ainsi rattaché au forage (point 5 de [[GDD_points_a_trancher]]).

### Compétences et artefacts (12/10/2026)

- **Arbre de compétences** : 3 points par zone terminée, 3 branches (Force, Prospection, Maîtrise) de 4 rangées, 9 passifs et 6 sorts. Réinitialisation contre un segment de pioche.
- **Sorts actifs** : 3 emplacements sous l'équipement de droite, bouton « Auto ». Effets de quelques secondes ou explosions, recharges de 30 à 120 s.
- **Artefacts** : 13 objets avec leur histoire, un garanti par zone terminée, équipés dans la 6e case. Les doublons les font monter jusqu'au niveau 5.
- **Barre de menus** en bas du jeu : Mine, Compétences, Artefacts, puis des menus « Bientôt ».
- **Équilibrage** : environ ×1,5 de Puissance au total ; le coût de la pioche passe à ×2,03 par niveau pour garder la pioche 30 vers le jour 50. Détails dans [[competences-et-artefacts]].
- **Visuels** : aucun dessiné à la main ; Théo génère les icônes avec Gemini. En attendant, des ronds de couleur avec une initiale.

### Refonte compagnons, évolution et équipements (13/10/2026)

Demande de Théo, détaillée dans [[refonte-compagnons-evolution]]. Choix par défaut annoncés dans le fil, à confirmer :
- **Équipements en bas** de l'écran, comme Legend of Mushroom ; les stats passent derrière un bouton rond « Stats ».
- **Évolution par objectifs** (zone, pioche, forges, événements touchés), chacun récompensé en éclats, puis un bouton « Promotion ». Plus de coût en or ni en minerai.
- **Œufs de compagnon** gagnés dans le **Défi de la mine**, une page d'événement de 3 jours à paliers de points. Plus d'œuf en fin de zone ni dans les coffres ; le premier œuf reste offert.
- **Pierres d'éveil** : nouvelle ressource visible, gagnée par le défi, les doublons et les expéditions ; améliorer un compagnon = monter son étoile (1 à 5). Plus de niveaux ni de minerai à donner.
- **Éclats** plus faciles à obtenir ; coût de la pioche réajusté au simulateur.

### Missions

- Façon Legend of Mushroom : une mission principale en chaîne infinie, plus des missions du jour avec un coffre d'éclats, remises à zéro à minuit. Aucune mission impossible : les objectifs liés aux filons sont plafonnés.

### Puissance

- Le 11/10/2026, Théo a retiré de l'écran la Puissance recommandée (bandeau de zone) et le cartouche « Puissance » sous le mineur.
- Restent : le gain de Puissance (▲ +5) dans la comparaison d'objet forgé, et la Puissance recommandée dans `balance.ts` pour le réglage et les tests. **Pas encore tranché** : les retirer aussi ou non.

### Interface et art

- Interface façon Freaky Duckling, aux couleurs bois et pierre. Infobulles sur les ressources, les stats et l'équipement (survol, focus, appui long sur mobile).
- Visuels générés avec Gemini sur fond vert #00FF00, détourés avec Photoroom ; animations de frappe en 23 images par coup, impact calé sur la même image pour toutes les formes. Voir [[prompts-gemini]].

### Proposés, pas encore validés

Les choix par défaut de [[prompt-refonte-majeure]] (prestige « Remonter à la surface » à partir de la zone 8, tirages de compétences et compagnons avec probabilités affichées, pas de tapotage continu) sont des propositions : Théo ne les a pas encore confirmés.

## Technique

- **Stack** : monorepo `mine-explorer` avec `backend/` (Spring Boot, Java 25, H2 + Flyway) et `frontend/` (Angular + PixiJS pour la scène animée). PixiJS plutôt que Phaser : Angular gère l'interface, PixiJS seulement la mine. Voir [[faisabilite]] et [[guide-demarrage-technique]].
- **Serveur autoritaire à terme** : c'est le backend qui calculera les gains, y compris hors ligne à la reconnexion. Pour l'instant, l'état est sauvegardé dans le navigateur (`localStorage`).
- **Équilibrage centralisé** dans `frontend/src/app/balance/balance.ts`, documenté dans [[equilibrage]] et vérifié par `balance.spec.ts`.
- **Mobile** : test sur iPhone via `ng serve --host 0.0.0.0` et Safari. Capacitor viendra plus tard (nouvelle dépendance, à valider ; iOS natif demande un Mac).
- **Aucun plugin Claude Code tiers** (11/10/2026) : Ponytail, Graphify, OmniRoute et « agent skills » écartés pour limiter la consommation de tokens et la surface de risque. Voir [[evaluation-plugins]].
- **Documentation** : ce dossier `docs/` est le coffre Obsidian du projet depuis le 12/10/2026, versionné avec le code.

## Façon de travailler

- Claude fait les modifications de code demandées, **sans commiter par défaut**. Théo commite lui-même, ou demande explicitement un commit, avec un message en français.
- Faire ce qui est demandé, sans en faire plus. Ne jamais déplacer ni supprimer de fichiers sans accord.
- Une branche par chantier, fusionnée par PR après relecture de Théo.
