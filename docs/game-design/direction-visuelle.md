# Direction visuelle

Retour à [[Accueil]]. Écrite le 14/10/2026, quand Théo a donné carte blanche pour rendre le jeu plus coloré et plus agréable, sur le modèle des idle RPG mobiles qu'il aime (Legend of Mushroom, Forge Master).

## Ce qui plaît dans le genre

- **Le moment de la récompense** : dans Legend of Mushroom, le boss lâche une lampe, on la touche, l'équipement apparaît. L'excitation vient de la bonne pièce qui tombe, puis de la comparaison avec ce qu'on porte ([Deconstructor of Fun](https://www.deconstructoroffun.com/blog/2024/4/15/the-magic-of-legend-of-mushroom)). La forge doit donc être la scène la plus vivante du jeu.
- **La progression visible** : niveaux, Puissance et classements montrent qu'on avance, même quand le jeu tourne seul. La Puissance doit être un chiffre en vedette.
- **Les couleurs de rareté** : l'échelle gris, vert, bleu, violet, orange, rouge est une convention que tout joueur lit sans réfléchir ([Game Informer](https://www.gameinformer.com/2019/05/18/the-surprising-origins-of-loot-rarity-colors)). S'en écarter embrouille. Elle reste pour les artefacts, les compagnons et les sorts. Pour l'équipement, Théo a préféré le 14/10/2026 la couleur du matériau (un objet en or est doré), qui correspond aux libellés de qualité.
- **Des effets proportionnés** : les petits gains restent discrets, les grands moments (rareté haute, record, évolution) ont droit aux gros effets. Il faut aussi laisser le joueur réduire les animations ([Wayline](https://www.wayline.io/blog/best-workflow-juicing-indie-games)).
- **Des écrans qu'on reconnaît d'un coup d'œil** : couleurs vives, gros boutons au toucher, retour immédiat à chaque action ([Pixune](https://pixune.com/blog/best-examples-mobile-game-ui-design/)).

## Règles du jeu

1. **Le bois et la pierre restent le cadre** : panneaux bruns cerclés de sombre, comme une mine. La couleur vient par-dessus : bandeaux, cadres de qualité, chiffres.
2. **Une couleur par écran**, en touche discrète : le bandeau de titre reste en bois, à peine teinté, souligné d'un filet de la couleur (`data-theme`). Le 14/10/2026, Théo trouvait les bandeaux pleins trop vifs à côté du bois. Couleurs : Compétences en saphir, Artefacts en améthyste, Compagnons en émeraude, Atelier et Campement en braise, Profil et Aventures en turquoise, Évolution et Stats en or.
3. **Une couleur par stat**, partout où elle apparaît : Frappe en rouge, Vitesse en bleu ciel, Critique en jaune, Dégâts crit. en orange, or en doré, Dégâts/s en violet.
4. **Une couleur par qualité d'objet** (`.item-frame`), de gris à irisé, avec un reflet qui passe en boucle à partir du violet.
5. **Les chiffres qui comptent sont gros et brillent** : Puissance, niveau de pioche, étage du Puits. Texte blanc ou doré cerné de sombre, sans nouvelle police.
6. **Les animations ne touchent que transform et opacity**, pour rester fluides sur téléphone, et toutes les boucles s'arrêtent avec « réduire les animations ».

## Fait

- Forge : enclume au centre, cadres de qualité, micro-animations (PR #32).
- Bandeaux de couleur sur toutes les pages, fenêtre des stats avec la Puissance en vedette et des stats en couleurs, compteurs du haut abrégés (« 45 M ») (PR #33). Bandeaux adoucis ensuite : bois teinté et filet de couleur.
- Artefacts et compagnons encadrés aux couleurs de leur rareté (commun gris, rare bleu, épique violet, légendaire orange), boutons verts qui brillent quand l'action est possible, critiques dorés qui jaillissent dans la mine (PR #34).
- Récompenses : rayons de lumière qui tournent derrière le coffre du Puits (plus vifs sur un record), l'artefact trouvé, le compagnon éclos et la forme visée quand la promotion est prête. Les pièces et les éclats gagnés (missions, coffre du jour, paliers d'évolution, Défi, expéditions, rapport d'absence) s'envolent du bouton jusqu'au compteur du haut, qui sursaute à leur arrivée.

- Adoucissement (14/10/2026), Théo trouvait l'interface trop brute :
  - boutons à bord fin, relief léger et ombre floue ;
  - panneaux à liseré fin ;
  - bordures épaisses ramenées à un trait fin ;
  - barre du bas sans caisses, l'onglet ouvert marqué d'une pastille dorée ;
  - cadres d'objets à la couleur de leur matériau (or doré, mithril turquoise…), comme les libellés.

## Prochaines étapes

- **Forge** : rayons derrière un objet forgé de haute qualité.
- **Mine** : barre de vie du filon plus vivante.

## Visuels

Les rayons (`art-source/ui/rayons.png`, fond vert) et les petites pièces (`art-source/ui/pieces.png`) sont préparés par `python art-source/ui/decouper-ui.py`, qui écrit `rays.webp`, `coin-small.webp` et `shard-small.webp` dans `frontend/public/assets/ui/refonte/`.
