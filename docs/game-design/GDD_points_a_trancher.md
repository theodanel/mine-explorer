# GDD Mine Explorer : points à trancher

Relevés pendant la réécriture. Aucun n'a été corrigé dans le document, sauf mention contraire.

## Incohérences de game design (par gravité)

1. **Condition d'échec non définie.** Le forage est automatique et « en cas d'échec, le joueur retente la couche ». Mais rien ne dit ce qui fait échouer : limite de temps, endurance, pression des dangers naturels ? Sans ça, une couche ne fait que ralentir le joueur, elle ne le bloque jamais.
2. **Puissance contre configuration en JcJ.** La Puissance est « la valeur lisible », mais un joueur moins puissant doit pouvoir gagner grâce à sa configuration. Si la Puissance ne prédit pas le résultat, elle trompe le joueur. Il faut décider ce qu'elle mesure (statistiques de base seulement ?) et quelle part du résultat elle explique.
3. **Le JcJ n'est pas décrit.** « Défis de forage » asynchrones : course sur une même couche ? score sur un temps donné ? C'est pourtant un argument distinctif.
4. **Retour en arrière impossible contre collections de minerais.** Chaque couche a ses matériaux, et on ne revient pas dans une zone passée. Les minerais des premières zones deviennent introuvables : collections impossibles à compléter, et une ressource ancienne ne peut plus servir aux améliorations.
5. **Statistiques au vocabulaire de combat.** Précision, pénétration, double frappe, vitesse : leur effet sur le forage n'est pas défini. Précision contre une roche, par exemple, n'a pas de sens évident.
6. **Durée de session.** 10 à 30 minutes par connexion, alors que le document parle de « sessions courtes ». Pour un RPG idle, la norme est plutôt plusieurs connexions de quelques minutes par jour. À clarifier : temps actif par connexion ou cumulé sur la journée ?
7. **Des milliers de couches.** C'est impossible à produire à la main. Il faut prévoir une génération procédurale ou des paramètres. Le plan B (« enrichir avant d'ajouter des couches ») va dans ce sens, mais aucune section n'en parle.
8. **Monétisation JcJ.** La phrase d'origine disait « éviter de rendre le JcJ *purement* payant pour gagner », ce qui laisse la porte ouverte à un avantage payant partiel. À trancher clairement (offres de confort seulement, ou avantages de puissance limités).

## Incohérences de forme

- **Deux titres.** « Mine explorer » dans le pitch, « Mine Profonde » dans la matrice concurrentielle. J'ai unifié sur **Mine Explorer**. Le titre est aussi en anglais, alors que tout le document est en français : à confirmer.
- **Technologies « à définir ».** La note de faisabilité du projet envisage Spring Boot et Angular, avec une PWA puis Capacitor. Le GDD parle encore d'un « moteur mobile » et vise iOS et Android natifs en priorité. Les deux documents doivent s'aligner.
- **Public de 16 à 40 ans avec achats intégrés.** Les mineurs et les offres aléatoires éventuelles (coffres) relèvent de règles propres à chaque pays. À vérifier avant de fixer le modèle économique.

## Ce que j'ai changé dans la structure

- **Réponses décalées.** À partir de « Le jeu repose-t-il sur une notion particulière ? », la plupart des réponses étaient sous la mauvaise question, voire dans la mauvaise section. Exemple : le lore apparaissait dans Gameplay, et l'interface dans Progression. Je les ai toutes remises en face de leur question.
- **Une réponse ajoutée.** La question « Les choix du joueur ont-ils des conséquences ? » n'avait pas de réponse. J'en ai proposé une, marquée **[À valider]**.
- **Consignes du modèle retirées.** J'ai enlevé les aides « ➜ … », les exemples entre parenthèses et les encadrés « Recommandation ». Ces encadrés restent à faire :
  - un schéma de la boucle de jeu ;
  - des fiches pour les personnages, les lieux et les objets ;
  - une carte des zones ;
  - le coût des abonnements aux outils dans le budget.
- **Vocabulaire en français.** Butin (loot), configuration (build), JcJ/JcE (PvP/PvE), Puissance (Power), boucle principale (core loop), tranche verticale (vertical slice), planche d'ambiance (moodboard). Je n'ai gardé que « RPG idle » et « chibi », faute d'équivalent établi. Ces termes sont expliqués dans un lexique en fin de document.

---

Voir aussi : [[Accueil]] · [[GDD_Mine_Explorer]] · [[Decisions]] (ce qui a été tranché depuis)
