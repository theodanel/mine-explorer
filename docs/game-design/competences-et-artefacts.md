# Compétences, sorts et artefacts

Conception de l'arbre de compétences, des sorts actifs et des artefacts, demandés par Théo le 12/10/2026. Les chiffres vivent dans `frontend/src/app/balance/skill-tree.ts` et `frontend/src/app/balance/artifacts.ts` ; cette note explique les choix. Retour à [[Accueil]], voir aussi [[equilibrage]] et [[Decisions]].

## Le budget de puissance

La consigne : rien de déséquilibré, rien qui rende le jeu trop facile. Tous les nouveaux bonus passent donc par un budget mesuré avec le simulateur (`tools/simulate.mts`, profil régulier : 4 sessions de 15 min par jour).

| Mesure (90 jours, joueur régulier) | Sans les nouveautés | Avec |
|---|---|---|
| Puissance permanente apportée par l'arbre et l'artefact | ×1 | ×1,5 |
| Part des dégâts faite par les explosions (Dynamite, Coup de grisou) | 0 | 21 % |
| Pioche 10 | jour 1 | jour 1 |
| Pioche 20 | jour 9 | jour 8 |
| Légende de la mine | jour 25 | jour 23 |
| Pioche 30 | jour 53 | jour 49 |

Pour garder ce rythme, le coût de la pioche passe de ×2 à ×2,03 par niveau. Sans cette correction, les nouveautés amenaient la pioche 30 au jour 35 : chaque gain de Puissance accélère l'or, donc la pioche, donc les zones, donc les points. Les compétences rendent la progression plus riche et plus fluide (des filons plus courts, des explosions, des choix), sans la raccourcir.

**Règle de cumul** : les bonus d'une même famille s'additionnent (tous les passifs de l'arbre entre eux), les familles se multiplient pour la Frappe et l'or (équipement × évolution × arbre × artefact × sort). Les points de Critique, de Vitesse et de chance d'éclat s'ajoutent toujours. Plafonds inchangés : Critique 100 %, Vitesse +200 % (un sort peut passer au-dessus le temps de son effet), recharge réduite de 40 % au maximum.

## Points de compétence

- **3 points par zone terminée**, rien d'autre. Joueur régulier : 9 points le premier jour, 27 vers le jour 7, 39 vers le jour 28, 48 vers le jour 90.
- **L'arbre complet coûte 67 points** : il faut choisir une voie principale.
- Un passif coûte 1 point par rang. Un sort coûte 2 points à apprendre, puis 1 par rang (3 rangs).
- **Rangées** : chaque branche a 4 rangées, ouvertes après 0, 3, 7 et 12 points dépensés dans la branche. Les sorts les plus rares sont au fond.
- **Réinitialisation** : tout rembourser coûte un segment de pioche du niveau actuel. Assez pour réfléchir, pas pour punir.

## L'arbre

| Branche | Rangée | Nœud | Type | Effet | Rangs |
|---|---|---|---|---|---|
| Force | 1 | Poigne solide | passif | +3 % de Frappe par rang | 5 |
| Force | 1 | Dynamite | sort commun | voir les sorts | 3 |
| Force | 2 | Œil vif | passif | +1 point de Critique par rang | 5 |
| Force | 3 | Coups précis | passif | +8 % de Dégâts crit. par rang | 5 |
| Force | 4 | Coup de grisou | sort légendaire | voir les sorts | 3 |
| Prospection | 1 | Flair de l'or | passif | +5 % d'or par rang | 5 |
| Prospection | 2 | Filon doré | sort rare | voir les sorts | 3 |
| Prospection | 2 | Chercheur de géodes | passif | +0,2 point de chance d'éclat par coup, par rang (2 % → 3 %) | 5 |
| Prospection | 3 | Sac sans fond | passif | +5 points d'or d'absence par rang (35 % → 60 %) | 5 |
| Prospection | 4 | Écho de géode | sort épique | voir les sorts | 3 |
| Maîtrise | 1 | Frénésie | sort commun | voir les sorts | 3 |
| Maîtrise | 1 | Mèche courte | passif | −4 % de recharge des sorts par rang | 5 |
| Maîtrise | 2 | Œil du géologue | sort rare | voir les sorts | 3 |
| Maîtrise | 3 | Concentration | passif | +10 % de durée des sorts par rang | 5 |
| Maîtrise | 4 | Maître artificier | passif | +20 % de dégâts des explosions par rang | 3 |

## Les sorts

Trois emplacements, sous l'équipement de droite et au-dessus des stats : des ronds avec l'icône au centre et un fond à la couleur de la rareté. Un bouton « Auto » à côté lance chaque sort dès qu'il est prêt. Un sort prêt brille, un sort en recharge montre le temps restant.

| Sort | Rareté | Effet au rang 1 | Gain par rang | Durée | Recharge | Effet moyen en automatique |
|---|---|---|---|---|---|---|
| Dynamite | Commun | Un coup à ×6 la Frappe | +2× | instantané | 30 s | +30 % de dégâts au début, +5 % en fin de partie |
| Frénésie | Commun | +100 % de Vitesse | +2 s | 6 s | 40 s | environ +15 % de coups |
| Filon doré | Rare | Or ×3 | +3 s | 10 s | 60 s | environ +33 % d'or |
| Œil du géologue | Rare | Tous les coups critiques | +2 s | 6 s | 45 s | +5 à +15 % de dégâts selon la Critique |
| Écho de géode | Épique | 10 % de chances d'éclat par coup | +5 points | 8 s | 120 s | environ +30 % d'éclats déterrés en frappant |
| Coup de grisou | Légendaire | Un coup à ×25 la Frappe, la galerie tremble | +8× | instantané | 90 s | +20 % de dégâts en milieu de partie, +8 % à la fin |

Les explosions ne font pas de critique et n'épuisent qu'un filon à la fois (comme un coup normal). Les sorts ne fonctionnent qu'en jeu, pas pendant l'absence.

## Les artefacts

Des objets rares de la mine, porteurs de son histoire. Jusqu'à trois se portent à la fois (le 2e emplacement s'ouvre au Contremaître, le 3e à la Légende) ; le 1er s'affiche dans la case d'artefact de l'équipement. Le premier trouvé s'équipe tout seul.

- **Découverte** : un artefact garanti à chaque zone terminée, plus une chance sur 30 000 à chaque coup. Joueur régulier : 3 le premier jour, 6 vers le jour 7, 26 en 90 jours, dont 11 différents sur 13.
- **Rareté** : Commun 55 %, Rare 30 %, Épique 12 %, Légendaire 3 %.
- **Doublons** : chaque doublon fait monter l'artefact d'un niveau (+25 % d'effet), jusqu'au niveau 5 (effet ×2). Au-delà, il donne une réforge gratuite de cet artefact (10 éclats avant le 18/10/2026).
- **Emplacements et réforge** (18/10/2026) : 3 artefacts portés, et une réforge à l'Atelier au niveau 5. Voir [[reliques]].
- Chaque découverte ouvre une fenêtre avec le nom, la rareté, l'histoire et l'effet : c'est le moment « butin rare » qui donne envie de continuer.

| Artefact | Rareté | Effet au niveau 1 | Au niveau 5 | Histoire |
|---|---|---|---|---|
| Lanterne fêlée | Commun | +8 % d'or | +16 % | Elle éclaire encore, mais seulement quand on ne la regarde pas. |
| Dent de taupe géante | Commun | +5 % de Frappe | +10 % | Personne n'a jamais vu la taupe. Seulement ses dents, plantées dans la roche la plus dure. |
| Boussole rouillée | Commun | +2 points de Critique | +4 | Elle n'indique pas le nord : elle indique la faille la plus proche. |
| Gourde du mineur | Commun | +6 points de Vitesse | +12 | Toujours à moitié pleine. Personne ne sait de quoi. |
| Pépite chantante | Rare | +10 points de Vitesse | +20 | Approchée de l'oreille, elle fredonne une vieille berceuse naine. |
| Fiole de grisou | Rare | +25 % de dégâts des explosions | +50 % | « Ne pas secouer. Surtout ne pas secouer. » |
| Carnet du premier mineur | Rare | +0,3 point de chance d'éclat | +0,6 | Des cartes de galeries qui n'existent plus… ou pas encore. |
| Cœur de géode | Épique | +0,5 point d'éclat, +10 % d'or | ×2 | Il bat très lentement. Une fois par siècle, disent les anciens. |
| Casque du contremaître disparu | Épique | +3 points de Critique, +20 % de Dégâts crit. | ×2 | Sa lampe s'allume toute seule devant les filons les plus riches. |
| Sablier de cristal | Épique | −12 % de recharge des sorts | −24 % | Le sable y remonte au lieu de tomber. |
| Larme de magma | Légendaire | +12 % de Frappe, +8 points de Vitesse | ×2 | Une goutte du cœur du monde, encore tiède après mille ans. |
| Étoile tombée | Légendaire | +20 % d'or, +0,5 point d'éclat | ×2 | Elle a percé toutes les couches de la mine pour finir ici. |
| Pioche du Roi Nain | Légendaire | +15 % de Frappe, +4 points de Critique | ×2 | Le Roi Nain a creusé la première galerie avec elle. |

## Navigation

Une barre de menus tout en bas du jeu : **Mine**, **Compétences**, **Artefacts**, puis des onglets grisés « Bientôt » pour les futurs menus (Compagnons, Atelier). Les pages s'ouvrent par-dessus la mine, qui continue de tourner derrière. Un point rouge signale des points à dépenser ou un artefact nouveau.

## Visuels attendus de Théo

Les prompts sont dans [[prompts-gemini]], section « Compétences et artefacts ». En attendant, les emplacements sont neutres : un rond à la couleur de la rareté avec l'initiale, et des libellés en texte.
