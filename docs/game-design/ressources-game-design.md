# Ressources de game design partagées par Théo (2026-10-12)

Trois liens partagés le 2026-10-12. Complète [[recherche-equilibrage]] sans la répéter.

Légende :
- **[LU]** : contenu de la page, lu le 2026-10-12 via un outil qui renvoie un résumé de la page (pas le texte brut intégral). Les chiffres cités viennent de ce résumé ; à revérifier sur la page avant de s'appuyer dessus pour un réglage précis.
- **[DÉDUIT]** : mon interprétation pour Mine Explorer.
- **[NON VÉRIFIÉ]** : point que je n'ai pas pu contrôler.

---

## 1. Deconstructor of Fun : « The Magic of Legend of Mushroom » (avril 2024)

Source : https://www.deconstructoroffun.com/blog/2024/4/15/the-magic-of-legend-of-mushroom (analyse de Ken Landen).

### Ce que dit l'article [LU]

- **Boucle** : on tue des vagues et des boss, les boss donnent des lampes (tirages gratuits), chaque objet tiré est équipé ou vendu (or + XP du héros). L'auteur résume le jeu à « une machine à sous RPG avec des entrées gratuites presque illimitées ». Une **vente automatique** permet de laisser tourner le jeu.
- **Objets** : 10 emplacements ; emplacement, stats secondaires et niveau aléatoires, le niveau tournant autour de celui du joueur (± quelques niveaux).
- **Lampe** : son niveau améliore les chances de rareté ; elle monte avec de l'or et du temps (déjà noté dans recherche-equilibrage.md).
- **11 verticales de progression** (équipement, montures, artefacts, reliques, compagnons, niveau du héros, lampe, guilde, Tech Park/Mine, jardin, âmes) **débloquées progressivement sur les 14 premiers jours**. Chaque déblocage des 7 premiers jours arrive avec un événement.
- **Rendez-vous quotidiens** : mini-jeux (The Lamp Thief, Molten Ruins…) verrouillés par des **clés rechargées chaque jour**. C'est un moteur de retour quotidien.
- **Compagnons et compétences** : gacha de fragments où il faut des dizaines de milliers de tirages pour obtenir quelque chose d'utile, ce qui réduit leur impact ressenti.
- **Social et classements** : guildes, ville de guilde, inspection de l'équipement des autres ; les premiers des classements gagnent des récompenses bien plus fortes, sans rattrapage.
- **Monétisation** : offres J1 de 0,99 à 9,99 $, passes de combat par système (~100 $/mois pour rester compétitif selon l'auteur), abonnements, pubs jugées sous-exploitées.
- **Aucun chiffre de rétention** dans l'article. Chiffre cité : Japon + Corée du Sud = plus des 2/3 des revenus de mars 2024 pour moins de 20 % des installations.

### Leçons de l'auteur [LU]

1. Les joueurs de ce genre ne viennent pas pour la complexité.
2. Un gacha doit afficher une **garantie visible** (pitié).
3. Il faut des **mécanismes de rattrapage** et des remises à zéro saisonnières.
4. Le social doit créer des objectifs longs et de la coopération, pas seulement de la compétition.

### Ce qui s'applique à Mine Explorer [DÉDUIT]

- **Confirme tes choix** : simplicité (leçon 1), objets dont le niveau suit celui du joueur (ta fenêtre glissante de paliers selon le niveau de pioche fait la même chose), tirages alimentés par le jeu lui-même (tes éclats tombent des filons, là où LoM les fait tomber des boss ; ton choix « pas de boss » ne pose donc pas de problème de source).
- **Déblocage étalé** : LoM ne montre pas tout au départ, il dévoile une verticale tous les un à deux jours pendant deux semaines. Avec ta cible « pioche 30 en ~1 mois », dévoiler progressivement forge, évolutions, missions du jour… donnerait une nouveauté régulière au lieu de tout afficher dès la première minute. Je ne sais pas dans quel ordre ils apparaissent aujourd'hui dans ton jeu.
- **Rendez-vous quotidien à clés** : tu as déjà 4 missions du jour et un coffre. Un mini-défi quotidien verrouillé par 1 ou 2 clés par jour (même un simple « filon bonus » chronométré) serait l'équivalent direct, et rationnerait une source d'éclats comme le recommandait recherche-equilibrage.md.
- **Vente automatique des objets moins bons** : c'est une attente du genre dès que les tirages sont nombreux. [NON VÉRIFIÉ] Je ne sais pas si ta Forge l'a déjà ; le code n'était pas accessible depuis ce fil.
- **Garantie visible sur les tirages** : un compteur « palier supérieur garanti dans N tirages » rend la progression lisible même sans achats.
- **Hors de ta portée pour l'instant** : guildes, classements, monétisation. Ils supposent le serveur Spring Boot et plusieurs joueurs. La leçon sur le rattrapage ne compte que si tu ajoutes un jour un classement.

---

## 2. Game Developer : « The Math of Idle Games, Part III » (Anthony Pecorella, 1er février 2017)

Source : https://www.gamedeveloper.com/design/the-math-of-idle-games-part-iii

recherche-equilibrage.md cite déjà la série pour les coûts exponentiels (parties I et II). La partie III porte sur autre chose : **le prestige**.

### Ce que dit l'article [LU]

- **Prestige** : réinitialiser la partie contre une monnaie permanente qui multiplie la production. Deux buts : donner une sensation de « montée d'échelle » et ramener les nombres à une taille gérable.
- **D'où vient la monnaie de prestige** : gain maximal (Realm Grinder), gain total à vie (Cookie Clicker, AdVenture Capitalist), gain de la partie en cours (Egg, Inc.), nombre d'améliorations achetées (Clicker Heroes). Les systèmes basés sur la partie en cours ont des courbes plus plates : aller plus loin rapporte de moins en moins.
- **Formules** (c_L = gains à vie, c_M = gain maximal, c_R = gain de la partie) :
  - Realm Grinder : p = (√(1 + 8·c_M/10¹²) − 1) / 2
  - AdVenture Capitalist : p = 150 · √(c_L / 10¹⁵)
  - Cookie Clicker : p = ∛(c_L / 10¹²)
  - Egg, Inc. : Δp = (c_R / 10⁶)^0,14
- **Ce que coûte un doublement** de la monnaie de prestige : ~4× les gains précédents (Realm Grinder), 3 à 4× (AdVenture Capitalist), ~8× (Cookie Clicker), ~128× (Egg, Inc.).
- **Egg, Inc.** plafonne les gains hors ligne à 2 h pour favoriser le jeu actif.
- **Rythme** : alterner phases lentes et rapides, avec des **paliers** qui donnent de gros bonds (exemple : multiplicateur ×16 à 500 générateurs, pics d'achats à 300, 400, 500).
- **Conclusions** : les tableurs aident mais demandent beaucoup d'itérations ; l'attrait des « gros nombres » s'use, il faut savoir où est le plaisir (découverte, collection, optimisation).

### Ce qui s'applique à Mine Explorer [DÉDUIT]

- **Pas de prestige aujourd'hui, et ce n'est pas un défaut pour la cible d'un mois.** Forge Master et LoM n'en ont pas non plus ; ils tiennent sur le minuteur et le rationnement. Le prestige devient utile quand le contenu fixe (10 paliers, zones) est épuisé.
- **Si tu prolonges un jour au-delà de la pioche 30**, la piste naturelle est une « descente » qui remet zones et pioche à zéro contre un bonus permanent. La formule à racine (AdVenture Capitalist, racine carrée des gains à vie) est la plus douce : une deuxième descente rapporte encore, mais de moins en moins. C'est une décision d'architecture et de données (quoi est conservé), donc à trancher avant de l'écrire.
- **Paliers à gros bond** : tes évolutions du mineur (+25 % de Frappe aux zones 5, 7, 9, 11) jouent déjà ce rôle de jalons. Elles sont bien espacées ; la leçon de Pecorella est d'alterner volontairement des phases lentes et des phases rapides autour de ces jalons plutôt qu'une courbe régulière.
- **Plafond hors ligne** : Egg, Inc. (2 h) et Forge Master (4 h) plafonnent tous les deux. Ton plafond d'éclats hors ligne (24 sur 4 h) va dans le même sens ; [NON VÉRIFIÉ] je ne sais pas si l'or hors ligne est plafonné aussi.

---

## 3. SlideShare : « Game design document filled in » (iain bruce)

Source : https://fr.slideshare.net/slideshow/game-design-document-filled-in/47237640

### Ce que contient le document [LU]

- **Le texte des 5 diapositives est lisible ; les images ne le sont pas.** Les emplacements de concept art et de captures d'écran ne sont pas transcrits.
- C'est un **exemple scolaire de GDD rempli** pour un jeu de plateforme parodiant Mario (développeur fictif « Nintendon't », héros « Mary-O », ennemis « Cooper Troops »).
- Sections : concept et histoire, univers, gameplay et mécaniques, avatar, ennemis. Chacune tient en quelques lignes.

### Ce qui s'applique à Mine Explorer [DÉDUIT]

- **Pas de contenu de game design utilisable** pour un idle RPG ; son seul intérêt est la structure d'un GDD court.
- Ton GDD_Mine_Explorer.docx existe déjà. Si tu veux t'en servir comme grille, les sections « univers » et « ennemis/obstacles » sont les seules qu'il apporterait éventuellement (pour toi : ambiance de chaque palier et nature des filons). [NON VÉRIFIÉ] Je n'ai pas relu ton GDD pour comparer section par section.

---

## En résumé pour Mine Explorer [DÉDUIT]

1. **Rien ne contredit tes choix actuels** : pas de boss, fenêtre de paliers selon la pioche, éclats tirés du minage, cible d'un mois.
2. **À considérer** : débloquer les systèmes progressivement sur les premiers jours, un mini-défi quotidien à clés, une garantie visible sur les tirages de Forge, la vente automatique.
3. **Pour plus tard** : un prestige (« descente ») si tu veux prolonger le jeu au-delà de la pioche 30.
4. **Hors périmètre tant qu'il n'y a pas de serveur ni de multijoueur** : guildes, classements, monétisation.

---

# Partie 2 : chiffres et formules des jeux de référence (recherche du 2026-10-12)

Demande de Théo : trouver des ressources qui expliquent les stats et les calculs de LoM, Freaky Duckling, Forge Master, etc. Complète recherche-equilibrage.md (minuteur de forge FM, table de lampe niveaux 1/5/9/18, formules de coût de Pecorella), sans le répéter.

**Fiabilité des sources** : aucun de ces jeux ne publie ses formules. Tout ce qui suit vient de **fans** (relevés en jeu ou calculateurs), jamais d'un éditeur ni d'un datamine revendiqué. À traiter comme des ordres de grandeur, pas comme des vérités.

## 4. Legend of Mushroom

### Table complète de la lampe [LU, source fan]

Source : [Theria Games, « Legend of Mushroom: Magic Lamp »](https://theriagames.com/guide/lom-magic-lamp/) (Charlie Greener, avril 2024, mise à jour février 2025). Relevés communautaires, pas de source officielle citée, table incomplète au-delà du niveau 16 pour l'or. Les niveaux 1, 5, 9 et 18 concordent avec la source déjà citée dans recherche-equilibrage.md, ce qui la rend un peu plus crédible.

Probabilités par niveau (extrait, 10 raretés au total) :

| Lampe | Normal | Unique | Bien | Rare | Mythique | Épique | Légendaire | Immortel | Suprême | Aurique |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 80 % | 15 % | 5 % | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 4 | 60 % | 25 % | 12,3 % | 2,5 % | 0,2 % | 0 | 0 | 0 | 0 | 0 |
| 7 | 30 % | 40 % | 24,45 % | 5 % | 0,5 % | 0,05 % | 0 | 0 | 0 | 0 |
| 10 | 0 | 35 % | 53,93 % | 10 % | 0,9 % | 0,15 % | 0,02 % | 0 | 0 | 0 |
| 13 | 0 | 20 % | 61,63 % | 16 % | 2 % | 0,3 % | 0,06 % | 0,01 % | 0 | 0 |
| 16 | 0 | 0 | 70,31 % | 25 % | 4 % | 0,5 % | 0,15 % | 0,04 % | 0 | 0 |
| 20 | 0 | 0 | 39,505 % | 45 % | 12,5 % | 2,5 % | 0,4 % | 0,08 % | 0,015 % | 0 |
| 25 | 0 | 0 | 0 | 68,875 % | 25 % | 5 % | 0,9 % | 0,16 % | 0,05 % | 0,015 % |

Or par niveau (incomplet) : la lampe s'achète par **sections** (1 section au niveau 2, 4 sections dès le niveau 10), de 3 k au niveau 2 à 880,8 k par section au niveau 16.

### Formule de dégâts [LU, source fan non sourcée]

Source : [LoM Fan Guide](https://strayito.github.io/LoM_guide/), « recherches communautaires et tests en jeu », sans détail.

1. ATK = FinalATK × (100 + Parking%) / 100 × (100 + Buff%) / 100 + Exclusive
2. A = (ATK − DEF) × FinalMult × DMG% / 100
3. Critique : B = A × CritMult / CritRES
4. C = (A ou B) × (100 − RES%) / 100 × (100 − DMGRES%) / 100
5. PvE = C × bonus de classe (épée 1,1, hache 1,05)

Les termes Parking%, Buff%, FinalMult et Exclusive ne sont pas définis sur la page.

### Ce que j'en tire pour Mine Explorer [DÉDUIT]

- **Le coût de la lampe monte de ×1,33 par niveau** entre les niveaux 10 et 16 (calcul fait sur la table ci-dessus). Ton segment de pioche monte de ×1,32 par niveau : tu es déjà à la même pente. La différence, d'après recherche-equilibrage.md, c'est que LoM ajoute un minuteur et que ses tirages sont rationnés.
- **Structure de la table de rareté** : à chaque niveau, une rareté nouvelle entre à 0,01 à 0,05 %, la dominante perd quelques points, et une rareté met **environ 8 à 10 niveaux** pour passer de son entrée à la dominante. Il y a toujours 4 à 6 raretés actives en même temps. C'est un bon gabarit pour ta fenêtre glissante de 10 paliers : à comparer avec ta table actuelle dans balance.ts, que je n'ai pas pu lire d'ici.
- **Formule de dégâts soustractive** (ATK − DEF) : pour toi, il n'y a pas de défense côté filon, donc une formule multiplicative simple (Frappe × multiplicateurs) suffit. Le soustractif n'a d'intérêt que s'il y a de l'armure à percer.

## 5. Forge Master

Sources : [ForgeMaster Helper, guide](https://1vcian.me/ForgeMasterCalculator/guide.html) et son [dépôt GitHub](https://github.com/1vcian/ForgeMasterCalculator) (Lucian Medrihan, fan ; origine des chiffres non indiquée, le dépôt réutilise des sprites du jeu). Le wiki Fandom (pages [Stats and Power](https://forge-master.fandom.com/wiki/Stats_and_Power) et [Sub stats and Builds](https://forge-master.fandom.com/wiki/Sub_stats_and_Builds)) existe mais **n'a pas pu être chargé** : le réseau de cette session le bloque. À ouvrir de ton côté si tu veux la formule de Puissance.

### Chiffres [LU, source fan]

- **Arbre technologique** : chaque nœud a 5 niveaux par palier, 25 au total. Coût = base × (1 − % arbre) ; temps = base ÷ (1 + % arbre). Exemples : vitesse de forge +4 %/point, coût de forge −2 %/point, durée hors ligne max +16 %/point, dégâts ou PV par emplacement +2 %/point, niveau max d'équipement +2/point.
- **Critique** : multiplicateur de base 120 % des dégâts.
- **Stats secondaires, maximum par objet** : vitesse d'attaque 40 %, blocage 5 %, chance critique 12 %, dégâts critiques 100 %, dégâts 15 %, double frappe 40 %, PV 15 %, régénération 6 %, vol de vie 20 %, dégâts de mêlée 50 %, à distance 15 %, récupération de compétence 7 %, dégâts de compétence 30 %. Il y a 12 porteurs (8 objets, 3 familiers, 1 monture) et les chances sont plafonnées à 100 %.
- **Raretés de familiers** : chaque rareté vaut environ ×5 la précédente (dégâts commun 50 à 150, rare 250 à 750, épique 1 250 à 3 750…). Montures : +10 %, +40 %, +80 %, +150 %, +250 %, +400 % de dégâts et PV.
- [JE NE SAIS PAS] Toujours pas de table publique des probabilités d'âge par niveau de forge. Elle se trouve peut-être dans le code du calculateur (app.js) ou sur le wiki, mais je ne l'ai pas vu.

### Ce que j'en tire [DÉDUIT]

- **×5 par rareté** pour les familiers, ce qui donne une échelle de référence pour l'écart de stats entre deux paliers consécutifs. À comparer avec l'écart entre tes paliers Bois→Divin et avec ton ×3,6 de difficulté par zone : si un palier vaut beaucoup moins que ×3,6, changer de palier ne suffira pas à suivre une zone.
- **Plafonds de stats secondaires** : FM plafonne chaque stat par objet, et la somme sur 12 porteurs reste lisible. Si tu ajoutes des stats secondaires, fixe un plafond par objet dès le départ ; c'est bien plus simple que d'en ajouter un après coup.

## 6. Freaky Duckling

[JE NE SAIS PAS] **Aucune donnée chiffrée fiable trouvée.** Pas de wiki, pas de calculateur. Les guides trouvés ([LDPlayer](https://www.ldplayer.net/blog/a-beginners-guide-and-tips-for-freaky-duckling.html), [BlueStacks](https://www.bluestacks.com/blog/game-guides/freaky-duckling.html)) décrivent les mécaniques sans chiffres : incubateur amélioré en or avec accélérations (équivalent de la lampe et de la forge), évolution par 3 quêtes, arène avec 3 combats gratuits par jour. Pour ce jeu, le seul moyen d'avoir des chiffres est de les relever toi-même en jouant.

## 7. Méthode générale d'équilibrage

- **Anthony Pecorella, [« Quest for Progress », GDC Europe 2016](https://www.slideshare.net/slideshow/quest-for-progress-gdc-europe-2016/65405507)** [LU, conférence d'un producteur de Kongregate]. Mêmes formules de base que sa série d'articles, plus : un prestige rentable quand il rapporte **+50 % à +200 %** de monnaie de prestige ; d'après une enquête Quantic Foundry, les joueurs d'idle sont surtout motivés par la **complétion** et la **puissance** ; compétences actives avec des temps de recharge de 5 min à quelques heures.
- **Gabriel Padinha, [« Balancing tips: how we managed math on Idle Idol »](https://www.gamedeveloper.com/design/balancing-tips-how-we-managed-math-on-idle-idol)** (Game Developer, juillet 2020) [LU, retour d'expérience d'un développeur]. Il part d'un facteur ×1,1 par niveau sur le coût et la récompense. Il raisonne en ordres de grandeur (10, 1 000, 1 M) plutôt qu'en valeurs exactes. Il centralise tout dans un tableur et un calculateur qui trace la progression complète. Et il vérifie d'abord que le problème vient bien des chiffres : dans Idle Idol, la lenteur ressentie venait d'un écran mal expliqué.

### Ce que j'en tire [DÉDUIT]

- Un « équilibre parfait » ne se trouve pas dans les sources : tous les auteurs disent qu'on y arrive en itérant. Le moyen le plus sûr est un **simulateur** qui rejoue ta progression jour par jour à partir de balance.ts (or gagné, niveau de pioche, palier forgé, zone atteinte) et le compare à ta cible pioche 30 en ~1 mois. Ce serait du nouveau code ; à décider avec toi, rien n'est lancé.
- Les chiffres de LoM et FM ci-dessus servent de **points de comparaison** pour ce simulateur, pas de valeurs à copier : ces jeux sont équilibrés pour vendre des accélérations, toi non.

---

Voir aussi : [[Accueil]] · [[recherche-equilibrage]] · [[equilibrage]]
