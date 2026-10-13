# Refonte : compagnons, évolution, équipements et éclats

Demande de Théo du 13/10/2026, à partir de captures de Legend of Mushroom (écran principal, fenêtre « Attribute details », fenêtre « Adventure Rank ») et de notre page Compagnons. Les chiffres sont réglés au simulateur et notés dans [[equilibrage]]. Retour à [[Accueil]], décisions dans [[Decisions]].

## Ce que Théo reproche

1. **Compagnons** : on ne voit pas d'où viennent les pierres pour les améliorer, ni combien on en a. Améliorer devrait faire monter l'étoile. Les œufs devraient venir d'un événement, sur une page à part (par exemple « casser le plus de cailloux »).
2. **Éclats** : encore trop durs à obtenir.
3. **Écran de jeu chargé** : comme Legend of Mushroom, les équipements doivent passer en bas, et les stats derrière un petit bouton en bas à droite.
4. **Évolution** : elle doit dépendre de missions réalisées, pas de ce que le joueur détient (or et minerais).

## 1. Équipements en bas, stats derrière un bouton

- Un **panneau d'équipement** sous la mine, à la place du panneau de stats : les 5 emplacements (casque, pioche, sac, gants, bottes), un séparateur, puis l'artefact et le compagnon. Chaque case montre l'icône, la couleur du palier et le niveau, comme aujourd'hui.
- La mine gagne la place des deux colonnes : le mineur, les événements et le compagnon respirent.
- Un **bouton rond « Stats »** en bas à droite de la barre de forge ouvre la fenêtre **Détails des stats** : section « Stats de base » (Frappe, Vitesse, Critique, Dégâts crit., Bonus d'or, Dégâts/s) puis « Bonus » (Atelier, compagnon, artefact, arbre, galerie, sorts actifs), une ligne par stat.
- Visuel à prévoir : l'icône du bouton (parchemin roulé), prompt plus bas. En attendant, un bouton en bois avec « Stats ».

## 2. Évolution par objectifs (façon Adventure Rank)

- La fenêtre d'évolution montre la forme actuelle → la suivante, puis **3 à 4 objectifs**, chacun avec son texte, sa barre et une récompense en éclats qu'on touche dès qu'il est rempli. Le bouton **Promotion** s'allume quand tous sont remplis.
- **Plus aucun coût** : ni or, ni minerai. Le joueur évolue parce qu'il a joué, pas parce qu'il a économisé.
- Les objectifs se lisent sur des compteurs de toute la partie (zone atteinte, niveau de pioche, objets forgés, événements de mine touchés) : un objectif déjà rempli le reste.
- Les formes et leur bonus de Frappe (×1,5 chacune) ne changent pas. Les objectifs sont réglés pour que chaque forme arrive à peu près au même jour qu'avant (simulation).
- Conséquence : les minerais ne servent plus qu'à l'Atelier, qui n'a plus besoin de garder une réserve pour les évolutions.

## 3. Compagnons : défi de la mine et pierres d'éveil

**Obtenir des œufs : le Défi de la mine.** Nouvelle page, ouverte depuis la page Compagnons (et un bouton dans la mine quand un palier est prêt).
- Un défi dure **3 jours** puis recommence, mêmes règles, compteur remis à zéro. Le temps restant est affiché.
- On marque des points en jouant : **5 par filon épuisé, 1 par objet forgé, 3 par événement de mine touché**.
- Des **paliers** de points donnent des récompenses à récupérer : œufs, pierres d'éveil, éclats. Le dernier palier donne un œuf rare au minimum.
- Les œufs ne viennent plus des fins de zone ni des coffres. Le premier œuf reste offert à l'ouverture de l'onglet (zone 3). Éclosion, chances affichées et garantie de légendaire ne changent pas.

**Monter les étoiles : les pierres d'éveil.**
- Nouvelle ressource, avec son compteur **en haut de la page Compagnons** et dans la fiche du compagnon.
- Sources : paliers du défi, doublons (un doublon se change en pierres : 5 commun, 10 rare, 20 épique, 40 légendaire), expéditions (elles rapportent des éclats et des pierres, plus de minerai).
- **Améliorer = monter d'une étoile**, de 1 à 5. Il n'y a plus de niveaux ni de minerai à donner. Chaque étoile coûte plus que la précédente et renforce nettement le bonus.
- Les sauvegardes existantes gardent leurs étoiles ; les niveaux déjà payés sont remboursés en pierres.

## 4. Éclats plus faciles

Les éclats sont la monnaie la plus jouée (2 par forge) : il faut en gagner régulièrement à tout moment de la partie. Leviers, réglés au simulateur :
- plus de chance d'en déterrer à chaque coup ;
- plus d'éclats par filon en profondeur ;
- plus d'éclats pendant l'absence ;
- les objectifs d'évolution et les paliers du défi en donnent aussi.

Contrepartie : plus de forges, donc plus de ventes et de meilleurs objets, donc plus d'or. Le coût de la pioche est réajusté pour que la pioche 30 reste vers le jour 50 pour le joueur régulier.

## Visuels à demander à Gemini

Prompts dans [[prompts-gemini]], section « Refonte compagnons et évolution » :
- l'icône de la **pierre d'éveil** ;
- l'icône et la bannière du **Défi de la mine** ;
- l'icône du **bouton Stats** (parchemin roulé).
