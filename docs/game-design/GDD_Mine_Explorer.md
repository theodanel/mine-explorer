# Mine Explorer : document de conception (GDD)

Document de conception du jeu

RPG idle mobile · iOS et Android

Auteur : Théo · Version de travail · Octobre 2026

## 1. Présentation

| Élément                   | Détail                                                                                                                                                                                                                                                                                                                          |
|---------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Titre**                 | Mine Explorer                                                                                                                                                                                                                                                                                                                   |
| **Accroche**              | RPG idle mobile : un mineur creuse couche après couche, améliore son équipement, optimise ses statistiques et affronte d'autres joueurs et guildes lors de défis de forage.                                                                                                                                                     |
| **Genre**                 | RPG idle de progression, gestion d'équipement, compétition en joueur contre joueur (JcJ) et guildes.                                                                                                                                                                                                                            |
| **Nombre de joueurs**     | Solo pour la progression contre l'environnement (JcE), complété par du JcJ asynchrone et des défis de guilde.                                                                                                                                                                                                                   |
| **Public cible**          | Joueurs mobiles amateurs de RPG idle, de progression chiffrée, de butin et d'optimisation. Prise en main facile, difficulté croissante.                                                                                                                                                                                         |
| **Plateforme**            | Mobile en priorité (iOS et Android).                                                                                                                                                                                                                                                                                            |
| **Marché cible**          | Marché international du jeu mobile gratuit avec achats intégrés, en particulier les joueurs de RPG idle, de jeux de collection et de jeux compétitifs.                                                                                                                                                                          |
| **Arguments distinctifs** | 1. Une progression verticale lisible : chaque couche donne une sensation de descente et de découverte.<br>2. Des statistiques assez riches pour qu'un joueur moins puissant batte un adversaire plus fort grâce à une meilleure configuration.<br>3. Une boucle solo accessible qui alimente directement le JcJ et les guildes. |
| **Technologies**          | À définir en préproduction. Besoin : un moteur multiplateforme mobile, adapté à l'interface 2D, aux données de progression et aux services en ligne.                                                                                                                                                                            |

## 2. Concept

### Quelle est l'idée centrale du jeu, en une phrase ?

Creuser toujours plus profond, améliorer son mineur et son équipement, puis mettre sa configuration à l'épreuve, seul ou face aux autres.

### Quelle émotion principale veux-tu transmettre au joueur ?

Une progression permanente et le plaisir de la découverte : « encore une couche, encore un objet, encore une amélioration ». Le joueur doit sentir que ses choix d'optimisation le font descendre plus loin.

### Quel est le genre principal du jeu ?

RPG idle de progression et d'optimisation, centré sur le butin et l'équipement, avec une dimension compétitive (JcJ et guildes).

### Comment s'organise une session de jeu ?

Sessions courtes et répétées. Le mineur creuse seul ; le joueur revient récupérer ses gains, compare son équipement, ajuste sa configuration et relance la progression. Les décisions portent surtout sur l'optimisation.

### Quelle expérience unique veux-tu faire vivre au joueur ?

Rendre la profondeur tangible : passer de la terre aux roches, puis aux cavernes, aux cristaux et aux zones extrêmes, en voyant le mineur et son équipement gagner en prestance.

### À quel public s'adresse le jeu ?

Persona : joueur mobile habitué aux RPG idle, qui ouvre le jeu plusieurs fois par jour pour récupérer ses récompenses, améliorer son personnage et chercher le meilleur équipement. Il veut de la profondeur sans jouer activement pendant des heures.

### Sur quelles plateformes le jeu sera-t-il disponible ?

Smartphones et tablettes iOS et Android.

### Quel est le mode de jeu prévu ?

Solo pour le cœur du jeu, avec JcJ asynchrone, classements et guildes compétitives.

### Quelle est la durée moyenne d'une session ?

10 à 30 minutes par connexion active ; la progression continue entre les sessions.

### Quels sont les 2 ou 3 arguments commerciaux uniques ?

- Une progression verticale, de couche en couche.

- Une optimisation où la Puissance seule ne désigne pas le vainqueur.

- Un univers minier cohérent qui relie butin, équipement et guildes.

## 3. Mécaniques de jeu

### Comment fonctionne le jeu et que fait concrètement le joueur ?

Le joueur incarne un mineur qui creuse automatiquement de couche en couche. Chaque couche a sa résistance, ses matériaux et ses récompenses. Le joueur récolte des ressources, obtient de l'équipement, compare les statistiques et améliore son personnage pour atteindre les couches suivantes.

### Quelle est la boucle de jeu principale ?

1.  Creuser.

2.  Récolter minerais et récompenses.

3.  Obtenir de l'équipement (butin ou achat).

4.  Comparer les statistiques.

5.  Équiper ou améliorer.

6.  Franchir la couche et débloquer la suivante.

### Quelles sont les mécaniques centrales ?

Forage automatique, progression par couches, équipement classé par rareté et niveau, statistiques principales et secondaires, butin, amélioration d'équipement, compétences, événements, JcJ et contenu de guilde.

### Existe-t-il des systèmes secondaires ?

Inventaire, fusion et amélioration d'équipement, compétences passives, collections de minerais, classements, missions quotidiennes, événements temporaires, boutique, guilde et messagerie.

### Quelles actions le joueur peut-il effectuer ?

Équiper, retirer, améliorer, fusionner ou remplacer un objet ; choisir une configuration ; consulter les statistiques ; récupérer les récompenses ; lancer des améliorations ; participer aux défis JcJ et de guilde ; personnaliser l'apparence.

### Quel est le niveau de difficulté ?

Lisible et progressif : les premières couches sont très accessibles, puis la résistance augmente. Le joueur peut toujours améliorer sa configuration avant de retenter une couche.

### Les choix du joueur ont-ils des conséquences ?

**\[À valider\]** Sur la progression uniquement : une configuration adaptée permet de franchir les couches plus vite et de gagner en JcJ. Aucun choix n'a de conséquence narrative.

### Le jeu repose-t-il sur une notion particulière ?

Sur la progression chiffrée et l'optimisation. La Puissance est la valeur lisible au premier coup d'œil ; les statistiques secondaires (critique, vitesse, pénétration, précision, double frappe, récupération, rendement, etc.) créent les vrais choix de configuration.

### Comment les mécaniques renforcent-elles le thème ?

Le thème minier porte la progression : plus le mineur est performant, plus il attaque des matériaux résistants et découvre des environnements rares. L'équipement montre visuellement son ascension.

### Y a-t-il une introduction ou un tutoriel ?

Oui. Une courte introduction présente le mineur, le forage automatique, le premier équipement et les récompenses. Les mécaniques avancées se débloquent ensuite progressivement.

### Le jeu est-il accessible à un débutant ?

Oui. Les premières couches servent de tutoriel : chaque fonctionnalité apparaît au moment où elle devient utile.

## 4. Univers et histoire

### Où et quand se déroule l'histoire ?

Dans un monde de fantasy minière dont la civilisation s'est construite autour d'un immense réseau souterrain. L'histoire commence à la surface et se poursuit de plus en plus profond.

### Quelles règles régissent ce monde ?

Chaque profondeur a ses matériaux, ses dangers naturels et ses ressources. Plus une couche est profonde, plus sa résistance et la valeur de ses ressources augmentent.

### Quelle technologie, magie ou science domine ?

Une technologie minière avancée : pioches, foreuses, casques, sacs, protections, outils mécaniques et équipements spécialisés. La fantasy s'exprime dans la variété des minerais et des objets rares ; la magie n'est pas un système central.

### Quel est le contexte politique, social et environnemental ?

La surface prospère grâce aux ressources extraites des profondeurs, et les mineurs y exercent un métier essentiel. Plus on descend, plus les environnements sont rares, dangereux et précieux.

### Le monde a-t-il un passé marquant ?

Les profondeurs sont exploitées depuis des générations. D'anciennes galeries et installations témoignent de civilisations minières disparues ; elles apportent du mystère et de la cohérence au monde.

### Comment le joueur découvre-t-il l'univers ?

Par l'environnement : architecture des anciennes mines, outils abandonnés, noms des couches, descriptions des minerais, événements, personnages secondaires et courtes histoires liées aux lieux.

### Quelles factions existent ?

Guildes de mineurs, compagnies d'exploitation, communautés de surface et anciens clans miniers. Les guildes de joueurs forment la principale structure sociale du jeu.

### Quels sont les lieux emblématiques ?

La mine de départ, les grandes cités souterraines, les anciennes galeries, les cavernes cristallines et les profondeurs légendaires. Chaque grande zone a une identité visuelle marquée.

### L'univers évolue-t-il au fil du jeu ?

Oui. Le joueur découvre peu à peu les installations des civilisations disparues, qui servent de toile de fond sans imposer d'histoire linéaire.

### Quel lien entre l'univers et les mécaniques ?

Un lien direct : la profondeur est le niveau de progression, les matériaux fixent la résistance des couches et l'équipement mesure la capacité du joueur à descendre.

## 5. Personnages

### Qui est le personnage principal et quelle est sa motivation ?

Un jeune mineur ambitieux. Son but : devenir le meilleur mineur du monde et atteindre des profondeurs que personne n'a encore franchies.

### Quelle est son histoire personnelle ?

Issu d'une petite communauté minière proche de la surface, il débute avec un équipement modeste et apprend peu à peu les techniques de forage et d'optimisation.

### Évolue-t-il au cours de l'aventure ?

Oui : niveau, équipement, apparence et réputation. Le contraste entre le débutant aux outils simples et le mineur des profondeurs doit être net.

### Quels sont les personnages secondaires majeurs ?

Le maître mineur, le forgeron-technicien, le chef de guilde, le marchand de minerais, et quelques personnages liés aux anciennes galeries.

### Quelles relations entretiennent-ils ?

Ils partagent le même monde mais poursuivent des buts différents : ressources, records, commerce ou secrets des profondeurs.

### Y a-t-il des dilemmes moraux ou des choix relationnels ?

Non. Les choix portent sur l'optimisation, la prise de risque et le style de progression.

### Comment les personnages servent-ils le thème ?

Ils incarnent la progression et la maîtrise d'un métier. Ils donnent un visage au monde sans détourner l'attention du système de progression.

### Le joueur influence-t-il les personnages par ses choix ?

Il fait évoluer son propre mineur. Les personnages secondaires servent de guides, de marchands et de donneurs de missions.

### Les personnages ont-ils des mécaniques propres ?

Oui, chacun a une fonction précise : vendre, améliorer, expliquer, proposer des missions, gérer la guilde ou présenter les événements.

### Existe-t-il une fiche pour chaque personnage ?

Elle est prévue pour chaque personnage important : rôle, apparence, personnalité, objectifs, relations et éléments d'histoire.

## 6. Progression et conception des niveaux

### Comment le jeu est-il structuré ?

En zones et couches successives. Chaque zone contient plusieurs couches numérotées (par exemple 1-1 à 1-15). Une fois une nouvelle zone atteinte, la progression principale ne revient pas en arrière.

### Quel est l'objectif du joueur pour passer à l'étape suivante ?

Réduire la résistance de la couche jusqu'à la franchir. En cas d'échec, il retente la couche après avoir amélioré son équipement ou sa configuration.

### Comment la difficulté et la puissance du joueur sont-elles équilibrées ?

Chaque couche augmente légèrement la résistance et introduit de nouveaux matériaux ou récompenses. La puissance du joueur suit grâce au butin, aux améliorations et aux choix de statistiques.

### Quelle est la durée d'une partie complète ?

Il n'y a pas de fin au sens classique. Le jeu vise une progression longue, sur des centaines voire des milliers de couches.

### Quels sont les moments clés de la progression ?

1.  Premières couches de terre.

2.  Premières améliorations.

3.  Premières couches de roche.

4.  Cristaux.

5.  Grandes cavernes.

6.  Profondeurs rares.

7.  Contenu de haut niveau et zones légendaires.

### Existe-t-il plusieurs fins ?

Non. La progression principale est continue : la configuration change la manière de progresser, pas l'issue.

## 7. Interface et expérience utilisateur

### À quoi ressemble l'interface ?

Format portrait, dans la lignée des RPG idle : mineur et forage au centre, zone et couche en haut, ressources dans le bandeau supérieur, statistiques sur les côtés, équipement en bas, boutons Auto, Classement, Défi, Guilde et Boutique. Une seule couche est visible à la fois.

### Comment le joueur interagit-il avec le jeu ?

Par l'écran tactile : appui, sélection, glissement et navigation entre panneaux. Le forage reste en grande partie automatique.

### Quels effets visuels et sonores renforcent l'immersion ?

Impacts de pioche et de foreuse, éclats de roche, apparition des minerais, chiffres de forage, effets de coup critique, sons de butin et de montée de niveau, ambiance sonore qui change avec la profondeur.

### L'interface est-elle intuitive et accessible ?

Oui. L'essentiel est regroupé sur l'écran principal : Puissance, avancement de la couche, ressources, statistiques, équipement et récompenses. Le reste se trouve dans des panneaux dédiés.

### Existe-t-il des maquettes d'écrans ?

Oui. Les maquettes actuelles fixent la direction : bandeau supérieur, couche unique au centre, statistiques à droite, informations de couche à gauche, équipement en bas et navigation permanente.

## 8. Production et monétisation

### Quel est le modèle économique ?

Gratuit avec achats intégrés facultatifs. La progression principale doit rester accessible sans payer. Revenus envisagés : apparences, options de confort, offres limitées et contenus cosmétiques, sans rendre le JcJ entièrement dépendant des achats.

### Quel est le panier moyen estimé par joueur ?

À définir après prototype et tests de rétention. Objectif : des revenus portés par les joueurs investis, sans obligation d'achat.

### Quel est le budget estimé, par poste ?

À définir après chiffrage. Postes principaux : développement, direction artistique, interface, animation, son, serveur et services en ligne, tests qualité, marketing et frais de publication.

### Quelle est la feuille de route ?

1.  Préproduction.

2.  Prototype de la boucle de forage.

3.  Prototype équipement et statistiques.

4.  Prototype JcJ et guildes.

5.  Tranche verticale (démo représentative du jeu final).

6.  Alpha.

7.  Bêta fermée, puis bêta ouverte.

8.  Lancement, puis mises à jour régulières.

### L'équipe est-elle constituée ? Quelles compétences manquent ?

Elle est à constituer selon l'ampleur du projet. Compétences nécessaires : conception de jeu, programmation, interface, illustration 2D, animation, serveur et services en ligne, tests qualité et marketing.

### Quels outils prévois-tu d'utiliser ?

À définir. Besoins : gestion de projet, documentation centralisée, création graphique et maquettage d'interface, production audio, moteur mobile adapté.

### Quelle stratégie marketing ?

Des vidéos courtes montrant la descente, les changements d'équipement et les moments de butin. Le message met en avant le plaisir d'optimiser et la progression permanente.

### Combien de téléchargements vises-tu ?

À définir après prototype : une estimation fiable demande des tests d'acquisition et de rétention.

### Quels risques anticipes-tu ? Quel plan B ?

- Risques : boucle trop répétitive, JcJ réduit à une comparaison de Puissance, inflation des statistiques, contenu trop coûteux à produire, monétisation trop agressive.

- Plan B : enrichir les configurations et le contenu de guilde avant d'ajouter des couches.

### Quelle est la date de sortie visée ?

À définir après la préproduction et la constitution de l'équipe.

## 9. Références et inspirations

### Quels jeux se rapprochent le plus du projet ?

Legend of Mushroom et Forge Master, pour la structure idle, le butin, les statistiques et l'optimisation. Le but est de transposer leur sentiment de progression dans un univers minier, pas de copier leur univers.

### Que reprendre ou éviter de ces jeux ?

- À reprendre : Puissance bien visible, équipement fréquent, comparaison immédiate des objets, statistiques secondaires, configurations, progression continue, JcJ où l'optimisation compense une Puissance inférieure.

- À éviter : univers de combat classique et exploration libre.

### Quelles autres œuvres influencent le projet ?

Références visuelles générales : fantasy minière, jeux de collection et RPG idle, illustrations chibi, mines riches en cristaux. Les références précises viendront compléter la planche d'ambiance.

### Quelle direction artistique ?

Fantasy minière en style chibi, colorée et très lisible sur mobile. Une surface lumineuse au départ, puis des environnements de plus en plus spectaculaires : terre, argile, roche, cristaux, cavernes profondes, zones rares. Interface riche, typique des RPG idle.

### Existe-t-il une planche d'ambiance ?

Les visuels produits pendant la conception en forment une première version : interface portrait, couche unique, mineur au centre, Puissance mise en avant, statistiques, équipement et progression en profondeur.

## 10. Étude de marché et positionnement

### Quelle est la cible principale ?

Joueurs mobiles de 16 à 40 ans, habitués aux RPG idle et aux systèmes de progression. Le jeu reste accessible aux joueurs occasionnels tout en offrant assez de profondeur aux compétiteurs.

### Quelles sont ses attentes ?

Progression fréquente, récompenses régulières, sentiment de puissance, butin intéressant, interface lisible, configurations à optimiser et compétition sans jeu actif permanent.

### Quels jeux similaires existent ?

Les RPG idle, jeux de collection et jeux mobiles de progression et de butin, notamment Legend of Mushroom et d'autres RPG idle centrés sur l'équipement et les classements.

### En quoi le jeu se distingue-t-il ?

Le forage remplace le combat classique sans perdre la profondeur d'un RPG : Puissance, statistiques secondaires, équipement, configurations, JcJ et guildes sont tous construits autour de lui.

### Quel est le potentiel du marché ?

Intéressant si la boucle de progression et la rétention tiennent. Le jeu se place entre RPG idle, jeu de progression et fantasy minière, avec une proposition plus précise qu'un RPG idle de combat générique.

### Quelles sont les tendances du genre ?

Progression idle, collection, personnalisation, événements et compétition asynchrone fonctionnent particulièrement bien sur mobile. Se démarquer par le thème minier et la boucle de forage est donc essentiel.

### Marché de niche ou grand public ?

Grand public mobile, avec un cœur de cible amateur de RPG idle, de butin et d'optimisation.

### Quel est l'état du marché visé ?

Concurrentiel et mature. Le jeu doit se distinguer nettement par son thème, son identité visuelle et surtout son système de progression.

### As-tu analysé les données des plateformes et des communautés ?

Pas encore. À mener en préproduction : analyse des concurrents, avis de joueurs, performances des catégories et tendances sur les plateformes concernées.

### As-tu positionné le jeu sur une matrice concurrentielle ?

Matrice proposée : en abscisse, de l'accessibilité à la profondeur de configuration ; en ordonnée, de l'activité passive à l'activité compétitive. Mine Explorer vise une forte accessibilité, avec plus de profondeur et de compétition qu'un jeu idle simple.

## 11. Annexes techniques

### Quel moteur de jeu ?

À définir. Il devra permettre une production mobile efficace, une interface riche, des effets 2D/3D légers et une gestion fiable des données en ligne.

### Quels langages de programmation ?

Selon le moteur retenu. Domaines couverts : logique de jeu, interface, sauvegarde, données joueur, services en ligne et outils internes.

### Sur quelles plateformes le jeu sera-t-il déployé ?

iOS et Android en priorité. Une version PC ou web pourra être étudiée plus tard si elle présente un intérêt commercial.

### Utilises-tu un gestionnaire de versions ?

Oui, dès le début de la production.

### Quels formats et dimensions techniques ?

Format portrait, interface adaptée aux différentes tailles d'écran. Dimensions finales et formats des fichiers à fixer avec la direction artistique et le moteur.

### Quels sont les besoins techniques ?

À préciser en préproduction : sauvegarde, inventaire, économie, comptes, classements, JcJ asynchrone, guildes, messagerie, événements et données de paramétrage du jeu.

### Quels outils spécifiques faciliteront la production ?

Outils de production d'interface et 2D, gestion des données, mesure d'audience, remontée des plantages, tests et services pour le multijoueur asynchrone. Choix précis après sélection du moteur.

### Faut-il produire ou acheter des ressources externes ?

Illustrations, icônes, effets, animations, musiques et sons. Une partie peut être achetée ou sous-traitée si cela réduit les coûts sans nuire à l'identité visuelle.

### Existe-t-il un planning ?

À établir après le prototype. Il dépendra surtout de la taille de l'équipe et du niveau de finition visé pour le JcJ, les guildes et le volume de contenu.

### Existe-t-il un prototype jouable ?

Pas encore : le concept et l'interface sont en cours de définition. Prochaine étape : prototyper la boucle de forage, le franchissement d'une couche, le butin et l'équipement avant de produire du contenu à grande échelle.

## 12. Lexique

| Élément           | Détail                                                                                                    |
|-------------------|-----------------------------------------------------------------------------------------------------------|
| **RPG idle**      | Jeu de rôle où le personnage progresse seul, y compris hors connexion ; le joueur gère ses améliorations. |
| **JcE / JcJ**     | Joueur contre l'environnement / joueur contre joueur.                                                     |
| **Configuration** | Combinaison d'équipement, de statistiques et de compétences choisie par le joueur.                        |
| **Puissance**     | Valeur unique qui résume la force du mineur, affichée en permanence.                                      |
| **Zone / couche** | Une zone regroupe plusieurs couches numérotées (1-1 à 1-15) ; franchir une couche débloque la suivante.   |

**Note de cadrage.** Les points « à définir » dépendent d'un prototype, d'une équipe ou de données de production. Le cœur créatif est arrêté : le mineur, la progression solo par couches et un système d'équipement et de configuration compatible avec le JcJ et les guildes.

---

Voir aussi : [[Accueil]] · [[GDD_points_a_trancher]] · [[Decisions]]
