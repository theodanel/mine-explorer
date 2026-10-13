# Comment les idle RPG gèrent leur progression

Recherche du 2026-10-11, à partir de la capture de Théo (pioche niveau 16 sur 30 après quelques heures).

Légende : **[DOCUMENTÉ]** = chiffre ou phrase lus dans la source citée. **[DÉDUIT]** = mon calcul ou mon interprétation. **[INCERTAIN]** = hypothèse à vérifier dans ton code.

## En une phrase

Il n'y a pas de formule secrète. Il y a trois techniques documentées, et Forge Master comme Legends of Mushroom s'appuient surtout sur la troisième : **ce n'est pas l'or qui limite le niveau de la forge ou de la lampe, c'est un minuteur en temps réel.**

## 1. Coûts exponentiels, production plus lente (la base de tout idle)

- [DOCUMENTÉ] Anthony Pecorella (Kongregate) : les coûts croissent de façon exponentielle et la production de façon linéaire ou polynomiale. Formule : `coût_suivant = coût_base × taux^possédés`, avec 1,07 pour le stand de limonade d'AdVenture Capitalist. Une exponentielle finit toujours par dépasser un polynôme, et c'est le délai avant ce croisement qu'on équilibre. [The Math of Idle Games, Part I](https://www.gamedeveloper.com/design/the-math-of-idle-games-part-i) · [Part II](https://www.gamedeveloper.com/game-platforms/the-math-of-idle-games-part-ii) · [Part III](https://www.gamedeveloper.com/design/the-math-of-idle-games-part-iii)
- [DOCUMENTÉ] Eric Guan : production ×1,1 par niveau, coût ×1,15 par niveau. L'écart entre les deux taux est ce qui ralentit le joueur. Un coût de départ trop bas rend le début « incroyablement rapide ». [Idle Game Design Principles](https://ericguan.substack.com/p/idle-game-design-principles)
- [DOCUMENTÉ] Même source : l'engagement décroît. Première session de 15 à 60 min, puis un passage par heure, puis quelques fois par jour, puis environ une fois par semaine. Le rythme idéal suit cette décroissance.

**Règle à retenir** [DÉDUIT] : ce qui compte n'est pas le taux du coût seul, mais **taux du coût ÷ taux du revenu** par niveau. Si chaque niveau de pioche augmente ton revenu presque autant que son coût (×1,32), le temps d'attente reste quasi constant et le joueur file.

## 2. Ce que font vraiment Forge Master et Legends of Mushroom

### Forge Master : minuteur sur chaque niveau de forge

[DOCUMENTÉ] Valeurs de base relevées par la communauté (avant réductions de l'arbre technologique), [ForgeMaster Helper](https://1vcian.me/ForgeMasterCalculator/guide.html) :

| Niveau | Coût en pièces | Temps |
|---|---|---|
| 1 → 2 | 400 | 5 min |
| 4 → 5 | 3,5 k | 1 h |
| 6 → 7 | 25 k | 7 h 33 |
| 9 → 10 | 50 k × 3 | 1 j |
| 15 → 16 | 224 k × 5 | 5 j 9 h |
| 20 → 21 | 502 k × 10 | 10 j |
| 29 → 30 | 4,15 M × 10 | 18 j 8 h |
| 34 → 35 | 10,3 M × 10 | 23 j |

- [DOCUMENTÉ] L'arbre technologique accélère le minuteur (+4 % de vitesse par point) et baisse le coût (−2 % par point). Les gains hors ligne sont plafonnés à **4 h** de base. Chaque ennemi tué donne 1 pièce.
- [DOCUMENTÉ] Les marteaux (la monnaie de tirage) viennent surtout d'un donjon limité à **2 clés par jour** et des guerres de clan.
- [DÉDUIT] Cumul des temps de base : niveau 10 en ~3 jours, **niveau 16 en ~22 jours**, niveau 20 en ~53 jours, niveau 30 en ~195 jours. Toi, tu as atteint le 16 en quelques heures.
- [JE NE SAIS PAS] Je n'ai pas trouvé de table publiée des probabilités d'âge (Primitif, Médiéval…) par niveau de forge. Le wiki [forge-master.fandom.com](https://forge-master.fandom.com/wiki/Guide) n'a pas pu être chargé.

### Legends of Mushroom : même principe avec la lampe

[DOCUMENTÉ] Relevé d'un joueur, [Secrets of the Lamp](https://themicrogamer.vercel.app/posts/legend_mushroom/20240316_secret_of_lamp/) :

| Lampe | Temps | Normal | Unique | Bien | Rare | Mythique | Épique | Légendaire |
|---|---|---|---|---|---|---|---|---|
| 1 | — | 80 % | 15 % | 5 % | 0 | 0 | 0 | 0 |
| 5 | 2 h | 50 % | 30 % | 16,7 % | 3 % | 0,3 % | 0 | 0 |
| 9 | 6 h | 10 % | 40 % | 41,1 % | 8 % | 0,8 % | 0,1 % | 0,01 % |
| 18 | ? | 0 | 0 | 55,7 % | 35 % | 7,5 % | 1,5 % | 0,25 % |

- [DOCUMENTÉ] Analyse de Deconstructor of Fun : la lampe monte avec de l'or **et du temps**, les deux s'achètent ; à haut niveau un joueur peut dépenser plus de 1 000 $ par niveau. Quand le joueur n'a plus de lampes (la monnaie de tirage), il attend 24 h. Les systèmes se débloquent progressivement sur les 14 premiers jours. [The Magic of Legend of Mushroom](https://www.deconstructoroffun.com/blog/2024/4/15/the-magic-of-legend-of-mushroom)
- [DÉDUIT] Ta table de forge ressemble déjà à celle-ci (un palier dominant à 50-70 %, un nouveau palier qui entre à 0,5 %). **Les probabilités ne sont pas ton problème, c'est la vitesse à laquelle tu montes de niveau.**

### Le « secret » en clair [DÉDUIT]

Ces jeux ont trois robinets indépendants :

1. **Le temps réel** limite le niveau de forge ou de lampe. L'or est abondant, il sert surtout à lancer l'amélioration.
2. **Une monnaie de tirage rationnée** (marteaux, lampes) qui vient de sources quotidiennes, pas seulement du jeu passif.
3. **Un plafond hors ligne** (4 h dans Forge Master) qui oblige à revenir.

Le minuteur est surtout là pour vendre des accélérations. Dans un jeu sans achats, il reste utile pour le rythme, mais un minuteur de plusieurs jours sans moyen de le réduire peut frustrer. C'est à toi de choisir la durée de vie visée.

## 3. Ce que ça donne pour Mine Explorer

Chiffres de départ (transmis par le fil de coordination, pas relus dans `balance.ts`) : zone 1 = 1 200 PV, ×2 par zone ; 1 PV = 1 pièce ; segment de pioche 8 pièces × 1,32^(niveau − 1), 10 segments par niveau ; éclats à 8 % par coup.

[DÉDUIT] Le segment à 515 pièces sur ta capture correspond bien à 8 × 1,32^15. Coût cumulé des niveaux :

| Niveau | Or cumulé |
|---|---|
| 10 | 2 792 |
| 16 | 15 840 |
| 20 | 48 598 |
| 30 | 784 234 |

Observations :

- [DÉDUIT] **Ton revenu, c'est ton DPS** (1 PV = 1 pièce). Le ×2 de PV par zone ralentit l'avancée dans les zones, mais ne change pas l'or gagné par seconde. Seule ta Puissance le fait. [INCERTAIN] Si un niveau de pioche augmente ta Puissance d'environ ×1,3 (via de meilleurs paliers), le coût et le revenu montent au même rythme et le temps par niveau ne grandit presque pas. C'est la cause la plus probable de ce que tu as vu. À vérifier en relevant le DPS à quelques niveaux de pioche.
- [DÉDUIT] **Diviser l'or par PV ne change que l'échelle.** Diviser par 10 multiplie tous les temps par 10 : le niveau 16 passe de quelques heures à environ une journée, mais la courbe garde sa forme et les derniers niveaux restent aussi rapides en proportion.
- [DÉDUIT] **Tes 217 éclats en réserve** montrent que les tirages ne te limitent pas. 8 % par coup lie les éclats à ta vitesse de frappe, donc ils accélèrent avec ta Puissance. Forge Master les rationne par des sources limitées.

### Ce que je recommande

1. **Le minuteur d'amélioration en premier.** C'est le levier qui sépare la progression du revenu, et c'est celui des deux jeux de référence. Courbe calquée sur la décroissance de l'engagement : niveaux 1 à 5 en quelques minutes chacun (première session), 6 à 10 en heures, 11 à 20 en une demi-journée à deux jours, 21 à 30 en plusieurs jours. Dans le code, un `upgradeEndsAt` (horodatage) suffit et marche hors ligne ; plus tard, c'est au serveur Spring Boot de le valider, sinon le joueur peut avancer l'horloge du téléphone.
2. **Ensuite, faire grandir le coût plus vite que le revenu.** Mesure le gain de Puissance moyen par niveau de pioche, puis vise un taux de coût clairement au-dessus (par exemple 1,45 si la Puissance gagne ×1,3). Ce que proposait le fil « Relecture avant commit » va dans ce sens ; je mettrais seulement le minuteur avant la baisse d'or par PV.
3. **Rationner les éclats** par la source plutôt que par un taux : une partie à la fin d'une zone, une partie par un plafond quotidien, au lieu de 8 % de chaque coup.
4. **Plafonner les gains hors ligne** (4 h comme Forge Master, augmentable plus tard).

Décision qui t'appartient : **combien de temps doit durer une partie jusqu'au niveau 30 ?** Forge Master vise des mois (avec achats). Pour un jeu sans achats, quelques semaines me paraît un bon point de départ, à ajuster en jouant.

## Sources

- [The Math of Idle Games, Part I](https://www.gamedeveloper.com/design/the-math-of-idle-games-part-i), [Part II](https://www.gamedeveloper.com/game-platforms/the-math-of-idle-games-part-ii), [Part III](https://www.gamedeveloper.com/design/the-math-of-idle-games-part-iii) (Anthony Pecorella, Kongregate)
- [Quest for Progress, GDC Europe 2016](https://www.slideshare.net/slideshow/quest-for-progress-gdc-europe-2016/65405507) (Kongregate, non relu en détail)
- [Balancing tips: how we managed math on Idle Idol](https://gamedeveloper.com/design/balancing-tips-how-we-managed-math-on-idle-idol) (non relu en détail)
- [Idle Game Design Principles](https://ericguan.substack.com/p/idle-game-design-principles) (Eric Guan)
- [ForgeMaster Helper, guide](https://1vcian.me/ForgeMasterCalculator/guide.html) (données relevées par la communauté, non officielles)
- [Secrets of the Lamp](https://themicrogamer.vercel.app/posts/legend_mushroom/20240316_secret_of_lamp/) (relevé d'un joueur, incomplet au-delà du niveau 10)
- [The Magic of Legend of Mushroom](https://www.deconstructoroffun.com/blog/2024/4/15/the-magic-of-legend-of-mushroom) (Deconstructor of Fun)

---

Voir aussi : [[Accueil]] · [[equilibrage]] (les chiffres en vigueur) · [[ressources-game-design]]
