# Refonte majeure de Mine Explorer

Ce document a deux parties :

1. **L'analyse**, pour toi : ce que le prompt doit accomplir, l'état réel du jeu, ce que font les jeux du genre et les décisions à prendre avant de le lancer.
2. **Le prompt**, à coller tel quel dans une nouvelle session Claude Code ouverte dans `mine-explorer/`. Il commence à la ligne « DÉBUT DU PROMPT ».

---

## Partie 1 : analyse

### Le but du prompt

Le jeu a aujourd'hui une boucle qui tourne : miner, gagner de l'or et des éclats, forger, équiper, monter la pioche, évoluer. Elle tient pour une soirée ou deux. Ce qui manque, c'est ce qui fait revenir un joueur pendant des mois dans Forge Master ou Legend of Mushroom :

- **des choix** : deux joueurs au même niveau ne devraient pas avoir le même mineur ;
- **plusieurs horizons en même temps** : quelque chose à faire dans les 30 prochaines secondes, dans l'heure, demain, la semaine prochaine et dans trois mois ;
- **de la surprise** : des événements qui cassent la routine du coup de pioche ;
- **de la profondeur sans confusion** : beaucoup de systèmes, mais débloqués un par un pour ne jamais noyer le joueur.

Le prompt doit donc faire travailler un agent sur une refonte longue, **phase par phase**, avec à chaque fois une version jouable, testée, simulée et documentée. Un prompt « fais tout d'un coup » produirait un jeu cassé et invérifiable : c'est le principal risque à éviter.

### Diagnostic du jeu actuel

Vérifié dans le code et `docs/equilibrage.md` :

| Point | État actuel | Limite |
|---|---|---|
| Boucle de minage | Le mineur frappe seul, 12/23 coups par seconde, 15 filons par zone | Le joueur n'a rien à faire pendant le minage : aucun geste actif |
| Stats | 5 stats (Frappe, Vitesse, Critique, Dégâts crit., Bonus d'or) | Toutes les sources s'additionnent : pas de build, pas d'arbitrage |
| Équipement | 5 emplacements, 10 paliers de matériau, stats secondaires à partir du Fer | Un objet ne sert qu'à être remplacé : pas d'amélioration, pas d'ensemble |
| Forge | 2 éclats par tirage, chances par niveau de pioche, fenêtre de 3 paliers | Un tirage à la fois, pas de garantie ni de tri automatique |
| Pioche | 10 segments d'or puis minuteur, niveau 30 en environ 36 jours de jeu continu | C'est le seul régulateur de rythme du jeu |
| Évolutions | 4 formes, coût en minerais et or, +25 % de Frappe chacune | Elles changent l'apparence mais ne débloquent rien |
| Missions | 1 principale qui s'enchaîne, 4 du jour et un coffre | Pas d'horizon hebdomadaire ni saisonnier |
| Zones | 10 décors, la zone 7 demande déjà la pioche 30 | Au-delà, plus aucun levier : le jeu s'arrête de fait vers la zone 8 |
| Absence | 50 % de l'or et 1 éclat toutes les 10 minutes, 4 h au maximum | Correct, mais rien à améliorer |
| Sauvegarde | Une dizaine de clés `localStorage` séparées, chacune avec sa migration | Fragile dès qu'on ajoute 10 systèmes, et facile à tricher |
| Backend | Spring Boot 4.1, Java 21, JPA, Flyway, H2 : squelette vide | Pas de compte, pas de sauvegarde en ligne, pas d'heure serveur |
| Interface | Un seul écran, des fenêtres modales | Ne tiendra pas 8 systèmes de plus : il faut une navigation |

Le constat le plus important : **la courbe s'arrête vers la zone 8**. La documentation le dit elle-même : « au-delà, il faudra d'autres leviers ». La refonte doit fournir ces leviers.

### Ce que font les jeux du genre

Ce que j'ai vérifié en ligne est sourcé. Le reste vient de ma connaissance du genre, à confirmer en jouant.

- **Forge Master** : une enclume qu'on améliore pour changer d'âge (de l'âge de pierre à l'âge quantique), un arbre de recherche, des compétences actives et passives, des montures, des familiers qu'on fait éclore, des donjons (dont « Hammer Thief »), une arène et des guerres de clans ([App Store](https://apps.apple.com/us/app/id6475646255), [TapTap](https://www.taptap.io/app/33719021), [outil communautaire](https://github.com/Tymotey/fm)). [PROBABLE] Les compétences et familiers s'obtiennent par tirages et se montent avec des doublons.
- **Legend of Mushroom** : des classes au gameplay différent, des compétences, des compagnons qui se combinent, des reliques en 7 catégories, un éveil de fin de jeu, des événements « Rush » sur un système à la fois (montures, reliques, compétences, recherche…), des événements saisonniers et des donjons ([Mobi.gg](https://mobi.gg/en/legend-of-mushroom/tips/), [Theria](https://theriagames.com/?p=8081), [BlueStacks](https://www.bluestacks.com/pt-br/blog/game-guides/legend-of-the-mushroom-brave-3000-free-draws/lotmb-relics-guide-ptbr.html)).
- **Tap Titans 2** : le prestige remet à l'étape 1 mais rapporte des reliques qui achètent des artefacts permanents, et 4 arbres de compétences pour des styles de jeu différents (joueur actif, joueur passif…) ([BlueStacks, prestige](https://www.bluestacks.com:443/blog/game-guides/tap-titans-2/tt2-tips-tricks-en.html), [BlueStacks, arbres](https://www.bluestacks.com/blog/game-guides/tap-titans-2/tt2-skill-tree-guide-en.html)).
- **Freaky Duckling** : la Puissance recommandée, déjà reprise.
- **Genre en général** [PROBABLE] : calendrier de connexion, passe de saison gratuit, expéditions à minuteur, collections qui donnent des bonus permanents, déblocage progressif des menus.

Ce qu'on reprend, adapté à une mine : la recherche de Forge Master devient l'**Atelier**, les familiers deviennent des **compagnons de mine** (le canari de mineur s'impose), les donjons deviennent des **puits à coups limités** (pour respecter ton refus du chrono), le prestige de Tap Titans devient une **remontée à la surface**, et les classes de Legend of Mushroom deviennent trois **voies de talents**.

### Les décisions à prendre avant de lancer

Le prompt contient un choix par défaut pour chacune. Change la ligne correspondante dans le prompt si tu n'es pas d'accord.

1. **Prestige (« Remonter à la surface »).** Remise à zéro des zones et de l'or contre des reliques permanentes. C'est le levier le plus puissant du genre, mais il fait reperdre de la progression. *Par défaut : oui, à partir de la zone 8, en gardant équipement, pioche, compagnons et compétences.*
2. **Tirages de compétences et compagnons.** Tirages avec probabilités affichées et garantie, ou fabrication directe avec une ressource. *Par défaut : tirages avec probabilités affichées et garantie après N tirages, sans argent réel.*
3. **Backend.** Sauvegarde en ligne et heure serveur, ou tout en local. *Par défaut : tout en local jusqu'à la phase 10, avec un format de sauvegarde prêt à être envoyé au serveur.*
4. **Geste actif.** Taper l'écran pour frapper plus fort, ou seulement des compétences à déclencher. *Par défaut : pas de tapotage continu, mais des compétences et des événements à toucher.*
5. **Portée.** Les 12 phases représentent plusieurs semaines de travail. *Par défaut : l'agent s'arrête à la fin de chaque phase et attend ton feu vert.*

### Comment l'utiliser

- Ouvre une nouvelle session dans `mine-explorer/`, colle le prompt, et laisse l'agent faire l'état des lieux puis la phase 0.
- À chaque fin de phase, joue sur le port de test qu'il indique, lis le tableau de simulation, puis dis « phase suivante » ou demande des changements.
- Si une session devient trop longue, ouvre-en une nouvelle avec le même prompt : la section « Où en est la refonte » de `docs/refonte.md`, que l'agent tient à jour, lui permet de reprendre.

---

DÉBUT DU PROMPT

# Mission : faire de Mine Explorer un idle RPG profond, sur plusieurs mois de jeu

Tu travailles sur **Mine Explorer**, un idle RPG mobile de minage en format portrait 9:16, développé par Théo, étudiant développeur en alternance. Il prend les décisions finales. Ta mission est une refonte majeure, découpée en phases livrables, pour faire passer le jeu d'une boucle qui tient quelques soirées à un jeu qui tient plusieurs mois, au niveau de Forge Master, Legend of Mushroom et Tap Titans 2, sans en copier l'univers.

Lis tout ce prompt avant de toucher au code. Réponds toujours en français, de façon naturelle et directe, sans tirets cadratins.

## 1. Le jeu aujourd'hui

Commence par lire, dans cet ordre : `docs/equilibrage.md`, `frontend/src/app/balance/balance.ts`, puis chaque dossier de `frontend/src/app/`. Ce résumé t'oriente mais le code fait foi.

- **Front** : Angular 21 (composants standalone, signals, `computed`, `effect`, `input`/`output`, contrôle de flux `@if`/`@for`, `inject`, jetons d'injection `RANDOM`, `ID_FACTORY`, `CLOCK` pour tester sans hasard ni horloge réelle). La scène est en PixiJS v8 (`mine-scene/`).
- **Règles** : des fonctions TypeScript pures, testables et portables en Java (`*-rules.ts`). Tout l'équilibrage est dans `balance/balance.ts`, documenté dans `docs/equilibrage.md`.
- **Tests** : Vitest via `npx ng test --watch=false`. Les avertissements jsdom sur `canvas.getContext` sont attendus.
- **Mise en page** : un cadre `.game` en 9:16 avec `container-type: inline-size`, toutes les tailles en `cqw`. Classes globales `.game-button` (wood, green, red, stone), `.game-panel`, couleurs de palier via `[data-tier]`. Infobulles avec la directive `[appTooltip]` (texte ou carte).
- **Systèmes existants** : minage automatique (12/23 coups par seconde, multiplié par la Vitesse), zones de 15 filons sans boss ni chrono, or, éclats de géode (gagnés par filon, par zone, en absence et par missions), minerais par zone (pas de minerai en zone 1), 5 emplacements d'équipement, 10 paliers de matériau (Bois à Divin), forge à 2 éclats, pioche à 10 segments d'or puis minuteur (niveau 30 en environ 36 jours), 5 formes d'évolution (Apprenti, Mineur, Contremaître, Maître, Légende) avec animations de frappe pour l'Apprenti, le Contremaître et le Maître, missions principales et du jour, gains d'absence plafonnés à 4 h.
- **Sauvegarde** : `localStorage`, une clé par système (`mine-explorer.coins`, `.equipment`, `.pickaxe`, `.progress`, `.evolution`, `.ores`, `.missions`, `.counters`, `.geode-shards`, `.last-seen`), lue et validée par `shared/local-storage.ts`.
- **Backend** : Spring Boot 4.1, Java 21, Web MVC, JPA, Validation, Flyway, H2. Seulement la classe d'application : rien n'est branché.
- **Graphismes** : Théo génère les images avec Gemini. Les prompts sont dans `docs/prompts-gemini.md`, les sources dans `art-source/`, les fichiers servis dans `frontend/public/assets/`. Les animations viennent de vidéos sur fond vert, détourées en planches de 23 images.

**Le problème central** : la progression s'arrête vers la zone 8, parce que la pioche niveau 30 ne suffit plus (`docs/equilibrage.md`, section « Courbe attendue »). Les joueurs n'ont pas de choix à faire, pas d'objectif hebdomadaire, et rien ne vient casser la routine.

## 2. Ce que Théo a déjà décidé : ne le remets pas en cause sans le lui demander

- **Pas de boss, pas de chrono, pas d'échec.** Un joueur trop faible avance plus lentement, il ne perd jamais rien. Aucun mode ne doit reposer sur un compte à rebours qui fait échouer.
- **Les filons**, pas les « étapes » ni les « rochers » : zone 1-1 à 1-15, puis 2-1, etc.
- **Pas de minerai de bois** : la zone 1 n'en donne pas.
- **Les éclats viennent surtout du jeu**, les missions complètent.
- **Le format mobile 9:16** : tout doit être utilisable au doigt, en 390×844.
- **Interface en français**, chiffres au format français.
- **Pas d'argent réel**, ni de boutique payante, ni de publicité. Le design peut rester compatible avec une monétisation future, mais rien ne doit pousser à payer.

## 3. Les piliers de la refonte

Chaque système que tu ajoutes doit servir au moins un de ces piliers. S'il n'en sert aucun, ne l'ajoute pas.

1. **Toujours une prochaine étape visible**, à 5 horizons : la prochaine seconde (un coup, un critique, un événement), les 5 prochaines minutes (un filon, une forge), la journée (missions, donjons), la semaine (événement, missions hebdomadaires), les mois (évolutions, prestige, collection).
2. **Des choix qui comptent** : deux joueurs au même niveau doivent pouvoir avoir des mineurs différents (talents, compétences, compagnons, ensembles). Un choix doit pouvoir se défaire, avec un coût raisonnable.
3. **Le temps comme régulateur, jamais comme punition** : les minuteurs (pioche, recherche, expéditions) fixent le rythme et avancent jeu fermé. Rien ne se perd si le joueur s'absente.
4. **Du retour à chaque geste** : chaque action a un effet visible et, plus tard, sonore (particules, chiffres, secousse légère, montée de jauge).
5. **Lisible** : chaque stat et chaque ressource a une infobulle qui dit à quoi elle sert et d'où elle vient. Les probabilités sont toujours affichées.
6. **Déblocage progressif** : un nouveau joueur voit 3 boutons, pas 12. Chaque système apparaît au moment où il devient utile, avec une courte présentation.

## 4. Comment tu travailles

Ces règles valent pour toutes les phases.

1. **Une phase à la fois.** Au début de chaque phase, relis le code concerné, puis écris un plan court : fichiers touchés, modèle de données, règles, écrans, tests. **Demande la validation de Théo avant tout changement de schéma de sauvegarde, d'architecture ou toute nouvelle dépendance.** Pour le reste, avance en annonçant tes hypothèses.
2. **Règles pures d'abord.** Chaque système a son fichier de règles pures et ses tests, avant le service et l'interface. Les chiffres vont dans les fichiers d'équilibrage, jamais en dur dans les composants.
3. **Typage strict.** Pas de `any`, pas de catch vide, pas d'erreur avalée, pas de nombre magique, pas de code mort. Commentaires sur le pourquoi, pas sur le quoi. Suis les conventions du code existant (noms en anglais, libellés et commentaires en français).
4. **Sauvegardes jamais cassées.** Toute sauvegarde existante doit se charger après ta phase, avec une migration testée.
5. **Simulation obligatoire.** Après chaque phase qui touche à l'économie, lance l'outil de simulation (créé en phase 0) et mets à jour `docs/equilibrage.md` avec les nouvelles courbes. Si une cible de rythme (section 6) n'est plus tenue, corrige avant de livrer.
6. **Vérification visuelle.** Lance un serveur de test sur un port libre autre que 4200 (le port de Théo, dont tu ne touches jamais la sauvegarde), en 390×844, et vérifie chaque écran nouveau ou modifié. Arrête tes serveurs de test à la fin.
7. **Fin de phase.** Tests verts, simulation à jour, documentation à jour, résumé en quelques lignes pour Théo (ce qui a changé, ce qu'il doit tester, ce qui reste ouvert), et un nom de commit en français. **Ne commite pas et ne pousse pas sans qu'il le demande.** Puis attends son feu vert pour la phase suivante.
8. **Suivi.** Tiens `docs/refonte.md` à jour : décisions prises, phase en cours, ce qui reste à faire, visuels attendus de Théo. Une nouvelle session doit pouvoir reprendre à partir de ce fichier.
9. **Visuels.** Quand une phase a besoin d'images, ajoute leurs prompts dans `docs/prompts-gemini.md`, dans le style existant (bloc « Style commun », prompts en anglais, fond vert pur). En attendant les images, utilise des emplacements propres (icône générique, forme CSS), jamais un écran cassé.
10. **Fiabilité.** N'invente aucune API, option ou version. Si tu n'es pas sûr qu'une API Angular ou Pixi existe dans la version installée, vérifie dans `node_modules` ou la documentation officielle. Distingue ce que tu as testé de ce que tu supposes.

## 5. Les systèmes à construire

Les valeurs chiffrées sont des **points de départ à simuler**, pas des vérités : ajuste-les pour tenir les cibles de la section 6, et documente chaque écart.

### 5.1 Fondations (phase 0)

- **Sauvegarde unique et versionnée.** Un seul objet `SaveGame { version, createdAt, updatedAt, ...systèmes }` sous une seule clé, avec une chaîne de migrations `vN → vN+1` testées, une migration depuis les clés actuelles, et une écriture regroupée (pas une écriture par signal à chaque coup). Ajoute l'export et l'import de sauvegarde en texte, validés comme toute entrée externe. Le format doit pouvoir être envoyé tel quel au backend plus tard.
- **Grands nombres.** Les PV dépassent déjà 100 millions en zone 10 et vont exploser. Un formateur unique : nombres entiers jusqu'à 9 999, puis `12,3 k`, `4,56 M`, `7,8 Md`, puis une notation à lettres (`aa`, `ab`…) ou scientifique au choix dans les réglages. Vérifie la précision : au-delà de 2^53, décide avec Théo entre rester en `number` avec une marge suffisante, ou passer à un type de grand nombre (ce serait une dépendance ou un module maison : demande avant).
- **Navigation.** Une barre d'onglets en bas : Mine, Héros (équipement, stats, talents), Forge, Compagnons, Atelier, Événements. Les onglets apparaissent au fil des déblocages. Badges de notification sur chaque onglet.
- **Déblocages progressifs.** Un fichier unique qui liste chaque fonction, sa condition de déblocage (zone, évolution, niveau de mineur…) et sa courte présentation. Exemple de départ : Forge dès le début, Missions au filon 1-3, Améliorer la pioche au filon 1-5, Talents au niveau de mineur 5, Compétences à la zone 2, Compagnons à la zone 3, Atelier à l'évolution Mineur, Donjons à la zone 4, Événements à la zone 2, Prestige à la zone 8.
- **Équilibrage découpé.** `balance.ts` devient un dossier `balance/` avec un fichier par système, toujours sans aucune logique d'interface.
- **Outil de simulation.** Un script versionné dans le dépôt (par exemple `frontend/tools/simulate.mts`, lancé avec Node 24 qui lit le TypeScript) qui joue l'économie avec les vraies fonctions de règles, pour 3 profils de joueur : **actif** (2 h par jour en jeu, se connecte 4 fois), **régulier** (30 min par jour, 2 connexions), **passif** (3 connexions de 5 minutes par jour). Il produit les tableaux de `docs/equilibrage.md` : moment de chaque évolution, de chaque zone, de chaque niveau de pioche, nombre de tirages par jour, ressources accumulées sans usage. Aucune dépendance ajoutée sans accord.

### 5.2 Stats et règle de cumul (phase 1)

Aujourd'hui, toutes les sources s'additionnent. Définis une règle de cumul unique et documentée :

- **Dans une même famille de sources** (tous les objets, ou tous les talents), les bonus s'additionnent.
- **Entre familles** (équipement, talents, compagnons, recherche, reliques, évolution, événements), ils se multiplient. Ainsi, chaque nouveau système compte vraiment, et l'inflation reste lisible.
- Les plafonds existants (Vitesse +200 %, Critique 100 %) restent, et chaque nouveau pourcentage a son plafond.

Nouvelles stats, à ajouter seulement si un système les utilise :

| Stat | Effet | Source principale |
|---|---|---|
| Double coup | Chance qu'un coup frappe deux fois | Gants, talents de la voie Brute |
| Puissance des compétences | Dégâts et durée des compétences | Amulette, voie Artisan |
| Recharge | Réduit le temps de recharge des compétences | Anneau, recherche |
| Trouvaille d'éclats | Chance d'un éclat en plus par filon | Lampe, voie Prospecteur |
| Trouvaille de minerai | Minerai en plus par filon | Lampe, voie Prospecteur |
| Gains d'absence | Part de l'or gagnée jeu fermé (50 % aujourd'hui) | Recherche, reliques |
| Chance | Fréquence des événements de mine | Compagnon Luciole, recherche |

La **Puissance** reste la mesure unique de la force du mineur. Elle doit intégrer les nouvelles stats offensives (Double coup, et les compétences en moyenne sur leur cycle).

### 5.3 Équipement et forge (phase 1)

- **Nouveaux emplacements, débloqués par les évolutions** : Lampe frontale (Mineur), Amulette (Contremaître), Anneau (Maître), Relique de mineur (Légende). Les évolutions débloquent enfin quelque chose de concret.
- **Amélioration d'objet** : un objet monte de +1 à +10 en dépensant de l'or et le minerai de son propre matériau. Le minerai a enfin un usage régulier. Chaque palier +5 et +10 ajoute une stat secondaire ou en renforce une. Quand un objet est remplacé, une partie des matériaux investis est rendue (par exemple 50 %), pour que forger ne soit jamais une punition.
- **Ensembles** : 2, 3 et 5 pièces du même matériau portées donnent des bonus (exemple : 2 pièces +5 % de Frappe, 3 pièces +10 % d'or, 5 pièces un effet unique par matériau, comme « le Magma brûle le filon : 2 % de ses PV par seconde »).
- **Forge** : forge en série (×5, puis ×10, débloquées par l'Atelier), **tri automatique** (vendre tout objet de Puissance inférieure, ou d'un palier inférieur à X), et une **jauge de chance** qui se remplit à chaque tirage sans le meilleur palier possible et le garantit quand elle est pleine. Les probabilités restent affichées, jauge comprise.
- La comparaison d'objet garde son fonctionnement actuel : cliquer à côté ferme sans rien vendre ni équiper, et la Forge remontre l'objet en attente.

### 5.4 Niveau de mineur et talents (phase 2)

- **Niveau de mineur** : de l'expérience gagnée en épuisant des filons et en terminant des missions. Chaque niveau donne 1 point de talent et un petit bonus fixe. La courbe d'expérience est simulée pour que le niveau suive la zone.
- **Trois voies de talents**, comme les arbres de Tap Titans 2 ou les classes de Legend of Mushroom :
  - **Brute** : Frappe, critiques, Double coup. Pour le joueur qui veut avancer dans les zones.
  - **Prospecteur** : or, éclats, minerais, gains d'absence. Pour le joueur qui joue peu.
  - **Artisan** : forge, amélioration d'objets, compétences, compagnons. Pour le joueur qui aime optimiser.
- Chaque voie a une quinzaine de nœuds, dont 3 nœuds « clés » qui changent une règle (exemples : « chaque 10e coup est un critique garanti », « un filon épuisé a 5 % de chances de donner un coffre », « les compétences se déclenchent seules »). Les points sont assez rares pour obliger à choisir une voie principale.
- **Réinitialisation** possible contre de l'or, gratuite une fois par semaine.

### 5.5 Compétences actives (phase 3)

- 3 emplacements de compétences (le 2e à l'évolution Mineur, le 3e au Contremaître), des boutons ronds au-dessus de la barre du bas, avec recharge visible.
- Le joueur les touche pour les lancer. Le lancement automatique se débloque par un talent clé ou la recherche, pour que le jeu reste jouable sans l'écran allumé.
- Huit compétences de départ :

| Compétence | Effet de départ | Recharge |
|---|---|---|
| Coup de grisou | Un coup unique à ×25 la Frappe, avec explosion à l'écran | 30 s |
| Frénésie | +100 % de Vitesse pendant 10 s | 45 s |
| Filon doré | Or ×3 pendant 15 s | 60 s |
| Œil du géologue | Tous les coups sont critiques pendant 8 s | 50 s |
| Écho de géode | Chaque coup a 15 % de chances de donner un éclat pendant 10 s | 90 s |
| Pluie de stalactites | 10 coups automatiques à ×3 la Frappe sur 5 s | 40 s |
| Second souffle | Remet à zéro la recharge des autres compétences | 180 s |
| Lampe aveuglante | +50 % aux dégâts de critique pendant 12 s | 45 s |

- Les compétences s'obtiennent par des **parchemins** (coffres, missions, donjons, événements). Les doublons les font monter de niveau. Les probabilités sont affichées, et une garantie donne une compétence rare au plus tard tous les 30 tirages.

### 5.6 Compagnons et expéditions (phase 4)

- 1 compagnon actif, visible dans la scène à côté du mineur, et 2 compagnons de soutien qui donnent seulement leur bonus passif.
- Compagnons de départ : **Canari** (bonus d'or, et il chante juste avant un événement de mine), **Taupe** (creuse : dégâts réguliers), **Chauve-souris** (Vitesse), **Golem de pierre** (Frappe), **Luciole** (Chance), **Dragonnet de magma** (fin de jeu : brûle les filons).
- Ils éclosent d'**œufs** trouvés dans les filons, les coffres et les donjons, avec raretés et probabilités affichées. On les nourrit avec des minerais pour les faire monter, et les doublons les font évoluer en étoiles.
- **Expéditions** : un compagnon de soutien peut partir 1 h, 4 h ou 8 h et rapporter des ressources selon son niveau. Le minuteur avance jeu fermé, comme la pioche.

### 5.7 Atelier : arbre de recherche (phase 5)

Inspiré de l'arbre de recherche de Forge Master, à l'image de la pioche :

- Chaque nœud coûte de l'or et des minerais, puis un minuteur. Une recherche à la fois, puis une 2e file plus tard.
- Six branches : **Forge** (forge en série, tri automatique, jauge de chance plus rapide, coût en éclats réduit), **Pioche** (minuteur d'amélioration réduit), **Mine** (dégâts, Vitesse), **Économie** (or, plafond d'absence de 4 h à 12 h), **Compagnons** (expéditions plus rentables, 2e expédition), **Exploration** (Chance, donjons).
- Environ 60 nœuds sur toute la durée du jeu. Les derniers prennent plusieurs jours, et c'est voulu.

### 5.8 Événements (phase 6)

**Événements de mine**, pendant que le joueur joue, environ un toutes les 2 à 4 minutes de jeu actif, plus souvent avec la Chance :

| Événement | Ce qui se passe | Récompense |
|---|---|---|
| Filon d'or | Le filon brille et devient doré | Or ×5 sur ce filon |
| Géode géante | Une géode apparaît : le joueur la touche plusieurs fois pour l'ouvrir | Une pluie d'éclats |
| Coffre enseveli | Un coffre sort du sol au filon épuisé | Parchemin, œuf ou minerais |
| Taupe voleuse | Une taupe passe avec un sac : la toucher la fait lâcher son butin | Or et éclats ; rien n'est perdu si elle s'échappe |
| Marchand ambulant | Un marchand propose 3 échanges | Échanges entre ressources |
| Pluie de cristaux | Des cristaux tombent : chacun se touche | Minerais du palier supérieur |

Aucun événement ne fait perdre quoi que ce soit, et tous peuvent être ignorés.

**Rendez-vous réguliers** :

- **Calendrier de connexion** sur 7 jours, puis sur 28 jours, sans perte de série si le joueur saute un jour (la récompense attend).
- **Missions hebdomadaires** avec un coffre de semaine.
- **Carnet du mineur** : un passe de saison gratuit de 4 semaines, avec de l'expérience de saison gagnée par les missions et 30 paliers de récompenses.
- **Événements thématiques** de 7 jours, avec une monnaie d'événement gagnée en minant, une boutique et des paliers de récompenses. Exemples : « Ruée vers l'or » (or ×2 le week-end), « Semaine des géodes », et des événements saisonniers comme « Mine hantée » à Halloween ou « Grotte gelée » en hiver. Chaque événement a son calendrier dans un fichier de données, pas dans le code.
- **Ruée sur un système**, comme les événements « Rush » de Legend of Mushroom : pendant 3 jours, un système (compagnons, compétences, recherche…) donne des points d'événement à chaque progrès.

Tant qu'il n'y a pas de serveur, l'heure vient de l'appareil : documente ce risque de triche et prévois l'heure serveur en phase 10.

### 5.9 Donjons à coups limités (phase 7)

Pour respecter le refus du chrono, un donjon ne se joue pas contre la montre mais **avec un nombre de coups fixe** (par exemple 100 coups) : le score est la profondeur atteinte avec ces coups, et la récompense grandit avec la profondeur. Chaque donjon a 2 clés par jour, et une clé non utilisée reste disponible jusqu'à un maximum.

- **Mine abandonnée** : de l'or.
- **Grotte de cristal** : des éclats.
- **Forge ancestrale** : des minerais de tous les paliers atteints.
- **Nid des profondeurs** : des œufs de compagnons.
- **Puits sans fond** : un donjon sans fin, où le record personnel de la semaine donne des récompenses par palier.
- Un **balayage** permet de rejouer instantanément un donjon au niveau du record, une fois débloqué par la recherche.

### 5.10 Prestige : Remonter à la surface (phase 8)

À valider par Théo avant de commencer cette phase.

- Débloqué à la zone 8, là où la progression s'arrête aujourd'hui.
- La remontée remet la zone à 1-1 et l'or à zéro. Elle garde l'équipement, la pioche, les évolutions, les talents, les compétences, les compagnons, la recherche et les collections.
- Elle rapporte des **Pépites d'étoile**, selon la profondeur maximale atteinte.
- Les pépites achètent des **Reliques de la surface** : bonus permanents et multiplicatifs (Frappe, or, éclats, Vitesse, gains d'absence, coût de la pioche, départ direct à une zone plus loin après la remontée).
- Une remontée doit faire regagner la profondeur précédente en une fraction du temps initial : simule-le. Le joueur doit sentir qu'il va plus loin à chaque cycle, pas qu'il recommence.
- Un écran explique clairement ce qui est perdu, ce qui est gardé et ce qui est gagné, avec confirmation.

### 5.11 Profondeurs, collections et succès (phase 9)

- **Au-delà de la zone 10** : de nouveaux biomes (Ruines naines, Lac souterrain, Forêt de champignons géants, Cœur du monde…), chacun sur 10 zones, avec ses propres décors et un modificateur doux (par exemple « Lac souterrain : +20 % de minerais, −10 % de Vitesse »). En attendant les décors, réutilise les fonds existants teintés.
- **Minéralogie** : une collection de gemmes rares (environ 40) qui tombent des filons selon le biome. Chaque gemme et chaque série complète donnent un petit bonus permanent. C'est l'objectif de très long terme.
- **Succès** : environ 60 succès (filons épuisés, objets forgés, compagnons, records), qui donnent des titres et des cadres de portrait.

### 5.12 Backend Spring (phase 10)

Sous réserve de l'accord de Théo sur l'architecture avant de commencer :

- **Comptes** : inscription et connexion, mots de passe hachés avec Argon2 ou bcrypt, jetons à durée courte avec renouvellement révocable, limitation du nombre d'essais sur la connexion et la réinitialisation du mot de passe.
- **Sauvegarde en ligne** : envoi de l'objet `SaveGame` versionné, validé côté serveur (structure, bornes, cohérence), avec gestion des conflits entre appareils.
- **Heure serveur** : les minuteurs (pioche, recherche, expéditions, événements, missions du jour) sont calculés à partir de l'heure du serveur, pour que changer l'heure du téléphone ne serve à rien.
- **Classements** : record du Puits sans fond et profondeur maximale, par semaine.
- Règles de sécurité : autorisation vérifiée sur chaque ressource (un joueur ne lit et n'écrit que sa sauvegarde), requêtes paramétrées via JPA, aucune trace d'erreur ni information interne dans les réponses, aucun secret dans le dépôt (variables d'environnement), migrations Flyway, tests d'intégration sur les contrôles d'accès. Rappelle à Théo de lancer l'audit des dépendances (`npm audit` côté front, Dependabot ou OWASP Dependency-Check côté Maven).

### 5.13 Finitions (phase 11)

- **Son** : effets pour la frappe, le critique, la forge, l'événement et la montée de niveau, avec un réglage du volume. Utilise l'API Web Audio du navigateur ; propose une bibliothèque seulement si elle apporte un vrai gain, et demande d'abord.
- **Effets** : particules de roche et d'étincelles dans Pixi, secousse légère sur les gros coups, avec un réglage pour réduire les animations. Les effets sont recyclés (pas de nouvel objet à chaque coup) pour tenir sur un téléphone moyen.
- **Tutoriel** : les présentations de déblocage de la phase 0, plus une première minute guidée (forger, équiper, améliorer la pioche).
- **Performance** : la scène doit rester fluide avec tous les effets, et le jeu ne doit pas écrire la sauvegarde à chaque coup.

## 6. Le rythme visé

Ces cibles servent de tests pour l'outil de simulation, pour le profil **régulier** (30 min par jour) sauf mention contraire. Si une phase les casse, corrige l'équilibrage avant de la livrer.

| Moment | Ce que le joueur doit avoir vécu |
|---|---|
| 5 premières minutes | Premier objet forgé et équipé, premier filon épuisé, premier niveau de pioche lancé |
| Première session (30 min) | Zone 2 atteinte, missions et compétences découvertes, premier événement de mine |
| Jour 1 | Zone 3, premier compagnon, 2 compétences |
| Semaine 1 | Évolution en Mineur, Atelier ouvert, premiers donjons, premier événement thématique en cours |
| Mois 1 | Contremaître, une voie de talents bien engagée, premier prestige possible pour le profil actif |
| Mois 3 | Maître, plusieurs prestiges, premières profondeurs au-delà de la zone 10 |
| Mois 6 et après | Légende, Puits sans fond, collection de gemmes : toujours un objectif |

Règles de santé de l'économie, à vérifier par la simulation :

- Aucune ressource ne doit s'accumuler sans usage pendant plus de quelques jours.
- Le joueur doit pouvoir forger au moins 15 fois par jour en jouant 30 minutes.
- Aucune session ne doit se terminer sans rien à faire ni rien à attendre.
- Le profil passif progresse, plus lentement, mais il progresse.

## 7. Ordre des phases

| Phase | Contenu | Livré quand |
|---|---|---|
| 0 | Sauvegarde unique, grands nombres, navigation, déblocages, équilibrage découpé, simulation | Anciennes sauvegardes migrées, simulation qui reproduit les courbes actuelles |
| 1 | Règle de cumul, nouvelles stats, nouveaux emplacements, amélioration, ensembles, forge en série et tri | Les évolutions débloquent des emplacements, le minerai a un usage régulier |
| 2 | Niveau de mineur, 3 voies de talents | Deux builds différents donnent des résultats différents en simulation |
| 3 | Compétences actives, parchemins | Les compétences comptent dans la Puissance |
| 4 | Compagnons, œufs, expéditions | Le compagnon actif est visible dans la scène |
| 5 | Atelier | Le plafond d'absence et la forge en série passent par la recherche |
| 6 | Événements de mine, calendrier, missions hebdomadaires, carnet, événements thématiques | Un événement de mine toutes les 2 à 4 minutes en moyenne |
| 7 | Donjons à coups limités, Puits sans fond | Aucun donjon ne repose sur un chrono |
| 8 | Prestige et reliques | La simulation montre une progression plus rapide à chaque cycle |
| 9 | Biomes au-delà de la zone 10, minéralogie, succès | La simulation tient la cible des 6 mois |
| 10 | Backend : comptes, sauvegarde en ligne, heure serveur, classements | Tests d'intégration sur l'authentification et les contrôles d'accès |
| 11 | Son, effets, tutoriel, performance | Le jeu reste fluide en 390×844 avec tous les effets |

Les phases 0 et 1 viennent en premier. Pour les suivantes, si une autre priorité te semble meilleure, propose-la à Théo avec tes raisons.

## 8. À ne pas faire

- Ajouter un boss, un chrono qui fait échouer, une perte de ressource ou de progression non choisie par le joueur.
- Cacher une probabilité, ou créer une urgence artificielle (offre qui expire en poussant à payer, série perdue au moindre jour manqué).
- Ajouter une dépendance, changer le schéma de sauvegarde ou l'architecture sans l'accord de Théo.
- Livrer une phase sans tests, sans simulation ou sans mise à jour de `docs/equilibrage.md`.
- Mettre des chiffres d'équilibrage dans les composants.
- Toucher à la sauvegarde du port 4200.
- Commiter ou pousser sans qu'on te le demande.
- Copier un nom, un visuel ou un texte d'un jeu existant : on s'inspire des mécaniques, pas de l'univers.

## 9. Pour commencer

1. Lis la documentation et le code comme indiqué en section 1.
2. Fais un état des lieux en une quinzaine de lignes : ce que tu as compris du jeu, ce qui te semble fragile, et ce que tu changerais dans ce plan avec tes raisons.
3. Pose à Théo les questions qui bloquent la phase 0, en particulier le format de la sauvegarde unique et la gestion des grands nombres.
4. Écris `docs/refonte.md` avec les décisions et le plan, puis attends son feu vert pour coder la phase 0.

FIN DU PROMPT
