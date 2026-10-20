# Puits sans fond

Retour à [[Accueil]]. Décidé le 13/10/2026 par Théo (son préféré) : « une zone à part, 3 essais par jour, où tu descends le plus loin possible en un temps limité. Récompenses par étage atteint et record personnel. C'est là que ton build compte vraiment. »

## Règle (mini-jeu, depuis le 14/10/2026)

La première version (un chrono qui défilait seul, étages calés sur les filons de la mine) était illisible et trop dure : « c'est super nul, je pige pas le truc ». Le Puits est devenu un mini-jeu à part, joué au doigt.

- **Ouverture** : quand le mineur devient Contremaître, dans l'onglet **Aventures**. **3 descentes par jour**, remises à minuit ; un essai compte dès le départ.
- **30 secondes**. Le mineur (sa vraie animation) frappe seul à sa vitesse ; le joueur **tape le rocher** pour frapper en plus. Enchaîner les touchers à moins de 0,6 s monte un **combo** jusqu'à ×1,9.
- **Étages variés** (tirés au hasard) :
  - **normal** (50 %) ;
  - **rocher à cristal** (30 %, PV ×1,3) : un point faible lumineux bouge toutes les 1,2 s, le toucher fait ×3 ;
  - **rocher piégé** (20 %, dès l'étage 3, PV ×0,8) : une mèche de 3 s ; s'il n'est pas cassé, il explose, l'étage est passé sans éclat et coûte 3 s ;
  - **gardien** tous les 10 étages : PV ×4.
- **Cristal de temps** : il tombe toutes les 6 à 10 s et reste 2,5 s ; l'attraper donne +2 s.
- **Sorts** équipés, une fois chacun par descente : Dynamite et Coup de grisou frappent fort, Frénésie double les dégâts, Œil du géologue rend tout critique, Filon doré et Écho de géode donnent un éclat de plus par étage pendant leur durée.
- **PV des étages** : les mêmes pour tout le monde. L'étage 1 vaut 2 s de la Puissance attendue à l'ouverture du Puits (zone 7), puis +15 % par étage. Un mineur plus fort descend donc plus bas, et son record suit sa progression. Corrigé le 20/10/2026 à la demande de Théo : les étages suivaient la zone et la Puissance du joueur, et le record restait bloqué vers 20 étages de la zone 7 à la zone 20 (simulateur : 22 étages en zone 7, 88 en zone 19).
- **Récompenses** : 2 éclats par étage cassé (4 sous bonus) ; chaque palier de 5 étages battu pour la première fois donne 30 éclats et 2 pierres d'éveil. Relevé le 14/10/2026 (1 éclat et 20 avant), Théo trouvait le Puits trop pauvre.

## Réglage

Le simulateur joue le mini-jeu avec un joueur moyen (5 touchers par seconde, point faible visé une fois sur deux, un cristal de temps sur deux attrapé, sans sort). Joueur régulier, 70 jours :
- 18,7 étages par descente en moyenne, record 24 ;
- en tapant 2 fois par seconde : 15,7 étages ; 8 fois par seconde : 24,1 (l'adresse compte, sans tout décider) ;
- environ 3 900 éclats et 8 pierres d'éveil sur la partie ; pioche 30 au jour 47,6 en moyenne sur 5 tirages.

## Visuels

Planche 11 et fond du Puits livrés le 14/10/2026 (sources dans `art-source/aventures/`). Le mini-jeu réutilise les rochers des zones, le cristal qui tombe et le coffre des événements, et l'animation de frappe de la forme du mineur. Le **rocher piégé** et le **gardien** ont leurs images depuis le 14/10/2026 (`art-source/aventures/`).

## Pistes

- Des étages à particularité (roche dure qui ignore les critiques, filon friable qui récompense la vitesse) pour que chaque build ait ses étages favoris.
- Un classement entre amis, le jour où le jeu aura un serveur.
