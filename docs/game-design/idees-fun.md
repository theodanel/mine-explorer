# Rendre Mine Explorer plus fun et plus addictif

Question de Théo le 13/10/2026 : qu'est-ce qui rendrait le jeu plus fun, plus addictif, tout en restant un idle game ? Cette note part de l'état réel du jeu (branche `feat/forge-economy`) et de [[prompt-refonte-majeure]], qui propose déjà beaucoup de systèmes : elle ne les répète pas, elle **les trie** et ajoute ce qui manque. Rien n'est validé tant que Théo ne l'a pas tranché dans [[Decisions]]. Retour à [[Accueil]].

## Le diagnostic

Trois faiblesses ressortent des chiffres de [[equilibrage]] et du code :

1. **Il ne se passe presque rien à l'écran en profondeur.** Un filon dure 5 min en zone 6, 14 min en zone 10, 44 min en zone 14. Pendant ce temps, le joueur regarde le même rocher. Les sorts aident, mais ils tournent en automatique.
2. **Jouer rapporte peu par rapport à l'absence.** Sur 90 jours, 70 % de l'or vient de l'absence et seulement 9 % du minage en jeu. Ouvrir le jeu sert surtout à forger et à payer des segments : il n'y a pas de raison de *rester*.
3. **Plus rien à viser après la pioche 30** (jour 49 pour le joueur régulier) : l'or ne sert plus, les minerais ne servent qu'aux évolutions (30 par forme), et la progression ralentit fortement (zone 16 vers le jour 67).

Ce qui marche déjà bien et qu'il faut garder : la forge et son tri automatique, le moment « artefact trouvé », l'arbre de compétences qui oblige à choisir, les missions du jour toujours faisables.

## Les principes de tri

Une idée passe si elle sert au moins un de ces buts, sans enfreindre les règles de [[Decisions]] (pas de boss, pas de chrono qui fait échouer, rien de perdu sans le choisir, pas d'argent réel) :

- **Une raison de rester** quelques minutes de plus (moment présent).
- **Une raison de revenir** dans quelques heures ou demain (minuteur, récolte).
- **Un choix** qui fait que deux joueurs au même niveau n'ont pas le même mineur.
- **Un but au-delà de la pioche 30.**

Et pour chaque idée : **comment elle reste équilibrée**. La règle déjà en vigueur dans [[competences-et-artefacts]] s'applique : chaque nouvelle famille de bonus se multiplie aux autres, donc chacune reçoit un budget de Puissance mesuré par le simulateur (`frontend/tools/simulate.mts`), et le rythme cible (pioche 30 vers le jour 50 pour le joueur régulier) est rétabli par `balance.ts` si elle l'accélère.

## Les 5 idées prioritaires

### 1. Atelier : renforcer les emplacements (recommandé en premier)

**Quoi.** Dans l'onglet Atelier, chacun des 5 emplacements (pioche, bottes, gants, casque, sac) se renforce niveau par niveau, contre de l'or et des minerais. Le bonus appartient à l'**emplacement**, pas à l'objet : il reste quand on remplace l'objet. C'est la différence avec l'« amélioration d'objet » de [[prompt-refonte-majeure]] (section 5.3), qui se heurte à la forge : un objet amélioré est remplacé vingt minutes plus tard, d'où la nécessité de rembourser 50 %, ce qui complique tout.

**Pourquoi c'est fun.** Un deuxième levier d'amélioration toujours disponible, qu'on fait monter entre deux forges ; un vrai arbitrage avec la pioche pour l'or.

**Ce que ça règle.** C'est la seule idée qui répond directement au problème connu : l'or retrouve un usage sans fin après la pioche 30, et les minerais servent enfin régulièrement.

**Équilibrage.**
- Débloqué à l'évolution Contremaître (zone 7, vers le jour 6), pour ne pas ralentir le début généreux.
- Effet : un petit pourcentage de la stat principale de l'emplacement par niveau (point de départ à simuler : +3 %), en famille séparée, donc multiplicatif avec l'équipement.
- Coût exponentiel par niveau, avec un facteur **supérieur à la croissance du revenu** (le revenu grandit d'environ ×1,4 par zone) : le renforcement reste un puits d'or, jamais un raccourci. Les minerais demandés suivent le palier de la zone en cours.
- Budget proposé : ×1,2 de Puissance au jour 49 au maximum. Comme pour les compétences, si la pioche 30 avance de plus de 2 jours, on relève le coût de la pioche ou les PV des zones.
- `balance.ts` : une table de coûts et d'effets ; simulateur : le joueur répartit son or entre segments et renforcement selon le meilleur gain de Puissance par pièce.

**Visuels.** Presque aucun : les icônes d'emplacement existent déjà. Éventuellement une enclume ou un établi pour l'onglet (prompt Gemini à prévoir).

### 2. Événements de mine à toucher

**Quoi.** Toutes les 2 à 4 minutes de jeu actif, quelque chose apparaît dans la galerie : une géode géante à ouvrir en 5 touchers, un coffre enseveli, un rat voleur qui passe avec un sac (un rat et non une taupe, pour ne pas le confondre avec la taupe compagnon), une pluie de cristaux. Repris de [[prompt-refonte-majeure]] (section 5.8), mais à faire **avant** le reste de cette section (calendrier, carnet de saison, événements thématiques), qui demande beaucoup plus de travail.

**Pourquoi c'est fun.** C'est la réponse aux deux premiers points du diagnostic : il se passe quelque chose pendant les filons longs, et rester devant le jeu rapporte. C'est un geste actif sans tapotage continu, cohérent avec le choix par défaut de la refonte.

**Équilibrage.**
- Récompenses exprimées en **secondes de revenu actuel** (par exemple 30 s d'or, 2 éclats, un minerai de la zone) : elles suivent la progression sans réglage par zone.
- Ignorer un événement ne fait rien perdre : il disparaît simplement. Pas de chrono qui fait échouer.
- Budget : environ +10 % d'or et +15 % d'éclats **en jeu seulement**, rien en absence. Ça fait remonter la part du jeu actif sans toucher au joueur qui joue peu.
- Le simulateur ne peut pas toucher l'écran : il compte la valeur moyenne d'un événement par minute de jeu (en supposant 80 % d'événements touchés). Si la pioche 30 avance, même correction que plus haut.

**Visuels.** Oui, un par événement (géode, coffre, rat voleur, cristaux), plus les animations. Prompts dans [[prompts-gemini]].

### 3. Embranchements : choisir sa galerie

**Quoi.** Idée nouvelle, absente de la refonte. À la fin de chaque zone, le joueur choisit entre **deux galeries** pour la suivante, chacune avec un modificateur visible pour toute la zone. Exemples :
- *Galerie inondée* : +50 % de minerais, filons +15 % de PV.
- *Veine d'or* : +30 % d'or, −30 % d'éclats.
- *Galerie instable* : explosions +50 %, Vitesse −10 %.
- *Grotte de cristal* : +40 % d'éclats, or −20 %.

Si le joueur ne choisit pas (absence, mode passif), une galerie neutre est prise.

**Pourquoi c'est fun.** La progression est aujourd'hui une ligne droite : ce choix toutes les 15 filons casse la routine, donne une petite décision intéressante (« j'ai besoin de minerais pour l'évolution, je prends l'inondée ») et fait varier les sessions, façon roguelite, mais sans échec possible.

**Équilibrage.**
- Chaque galerie est un **échange** : un gain et une contrepartie de valeur comparable. Aucune n'est meilleure en tout, et la neutre reste correcte.
- Le simulateur prend la galerie neutre pour mesurer le rythme de base, puis une stratégie « optimale » pour vérifier que bien choisir ne fait pas gagner plus de 10 % de temps.
- `balance.ts` : une liste de modificateurs. Les filons et missions restent inchangés.

**Visuels.** Rien d'obligatoire : deux cartes texte sur les panneaux en bois existants. Plus tard, une teinte de fond par galerie peut se faire avec les fonds de zone actuels.

### 4. Compagnons et expéditions

**Quoi.** L'onglet Compagnons, comme dans [[prompt-refonte-majeure]] (section 5.6) : canari, taupe, chauve-souris, golem… Un compagnon actif visible à côté du mineur, et des compagnons envoyés en expédition 1 h, 4 h ou 8 h, qui reviennent avec des éclats et des minerais.

**Pourquoi c'est fun.** C'est l'horizon « reviens dans quelques heures » qui manque entre les missions du jour et les minuteurs de pioche (8 h 30 au plus), plus une collection à compléter.

**Équilibrage.**
- Les expéditions rapportent des **éclats et des minerais, pas d'or** : elles n'accélèrent pas la pioche, qui fixe le rythme.
- Bonus passifs en famille séparée, avec un budget mesuré (point de départ : ×1,15 de Puissance au jour 49).
- Œufs trouvés en jouant, probabilités affichées, garantie après N œufs : jamais d'achat.

**Déblocage (validé par Théo le 13/10/2026).**
- Onglet ouvert à la zone 3, avec un premier œuf commun offert.
- Un œuf par zone terminée (comme les artefacts), plus une petite chance dans le coffre enseveli des événements et dans le coffre des missions du jour.
- Éclosion par minuteur qui continue jeu fermé : 1 h pour un œuf commun, jusqu'à 8 h pour un légendaire.
- L'œuf donne un compagnon de sa rareté : commun (canari, taupe), rare (chauve-souris, luciole), épique (golem), légendaire (dragonnet). Probabilités affichées, légendaire garanti après un nombre d'œufs à simuler.
- Les doublons ajoutent des étoiles ; on nourrit le compagnon de minerais pour le faire monter.

**Visuels.** Beaucoup : chaque compagnon en portrait et en animation dans la scène, les œufs. C'est le coût principal de cette idée, d'où sa 4e place.

### 5. Le son et les sensations

**Quoi.** Aujourd'hui, la scène affiche les dégâts, les critiques et les éclats de roche, mais **le jeu n'a aucun son**. Ajouter : un coup de pioche, un son de critique, un « ding » d'éclat, un son de forge par palier (plus le palier est haut, plus il sonne riche), une secousse légère sur les explosions, un réglage du volume.

**Pourquoi c'est fun.** C'est le rapport effet sur effort le plus élevé de cette liste : le son rend chaque forge et chaque critique gratifiants sans changer une seule règle. Le « ding » d'un palier rare est une grande partie de l'attrait des jeux de forge.

**Équilibrage.** Aucun effet sur les chiffres.

**Assets.** Claude ne crée pas de sons non plus. [INCERTAIN] Des banques gratuites existent (par exemple les packs CC0 de Kenney) : à vérifier, licence comprise, avant de les utiliser. L'API Web Audio du navigateur suffit pour les jouer, sans dépendance.

## Pour plus tard

À garder, mais pas maintenant :

- **Prestige « Remonter à la surface »** ([[prompt-refonte-majeure]], 5.10). C'est le vrai levier du très long terme, mais il ne sert qu'une fois le contenu fixe épuisé, soit vers la zone 16 aujourd'hui. Avec l'Atelier, le plateau d'après la pioche 30 est absorbé pendant plusieurs semaines : le prestige peut attendre.
- **Missions de la semaine et calendrier de connexion** (5.8) : simples à faire, utiles pour revenir, mais elles n'ajoutent pas de fun en soi. Sans série perdue au jour manqué.
- **Puits à coups limités** (5.9) : un mode de record sans chrono, bien pour les clés quotidiennes, à faire après les compagnons.
- **Minéralogie** (5.11) : une collection de gemmes, objectif de plusieurs mois.

## À éviter

- Le tapotage continu pour frapper plus fort : fatigant sur mobile, et il punit le joueur qui joue en idle.
- Une série de connexion qui se perd au premier jour manqué, ou une offre qui expire : de l'urgence artificielle, déjà écartée par [[prompt-refonte-majeure]].
- Tout bonus qui ne passe pas par le simulateur : c'est comme ça que la pioche 30 était tombée au jour 35 avant la correction du 12/10/2026.

## Ordre proposé

1. **Atelier** (règle le problème connu, peu de visuels).
2. **Son et sensations** (rapide, en parallèle, dès que les sons sont choisis).
3. **Événements de mine** (dès que les visuels sont prêts).
4. **Embranchements**.
5. **Compagnons** (le plus lourd en visuels).
