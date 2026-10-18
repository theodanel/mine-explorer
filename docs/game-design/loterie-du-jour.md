# Loterie du jour

Demande de Théo (14/10/2026) : une loterie quotidienne qui donne une ressource au hasard, du plus rare au moins rare, et qui change chaque jour. L'icône est sur la mine, à droite du bandeau « Zone · Filon », en miroir des raccourcis du jeu en ligne (classement, discussion) à gauche.

## Règles

- **Un tirage gratuit par jour** (heure du joueur), remis à minuit même si le jeu reste ouvert. L'icône porte une pastille et sautille tant que le tirage attend.
- **Six cases aux chances fixes et affichées** : deux communes (35 % et 25 %), deux rares (18 % et 12 %), une épique (8 %), une légendaire (2 %).
- **Le contenu des cases change chaque jour.** Le jour sert de graine : les lots sont les mêmes toute la journée, même après un rechargement. Deux cases de même rareté n'ont jamais le même lot.
- **Le lot est crédité au moment du tirage**, avant l'animation : fermer la fenêtre en route ne fait rien perdre.

## Lots possibles

| Rareté | Lots |
|---|---|
| Commune | or de 3 filons, 8 éclats, 2 pierres d'éveil |
| Rare | or de 8 filons, 20 éclats, 5 pierres d'éveil, un œuf |
| Épique | or de 20 filons, 50 éclats, 12 pierres d'éveil, un œuf rare ou mieux |
| Légendaire | or de 50 filons, 120 éclats, un œuf épique ou mieux |

- L'or se compte en filons du filon actuel du joueur (ce que rapporte un filon épuisé) : le lot reste utile du début à la fin.
- Œufs et pierres d'éveil n'apparaissent qu'une fois l'onglet Compagnons ouvert (zone 2) ; avant, les cases tirent de l'or ou des éclats.
- Repères : les missions du jour donnent une vingtaine d'éclats, le Défi environ 2 œufs en 3 jours. Calcul : un œuf sort environ 1 jour sur 10 (rare 7,5 %, épique 2 %, légendaire 0,7 %), soit 3 par mois, à côté des 20 du Défi.

## Présentation

Fenêtre « Loterie du jour » : les six cases encadrées aux couleurs de leur rareté, avec leur chance. Au tirage, une lumière fait deux tours puis ralentit jusqu'au lot gagné, qui rayonne ; l'or et les éclats s'envolent jusqu'aux compteurs.

Icône : roue de la fortune (`art-source/ui/loterie.png`, préparée par `art-source/ui/decouper-ui.py`).

## Technique

Chiffres dans `frontend/src/app/balance/lottery.ts`, règles pures dans `lottery/lottery-rules.ts` (lots du jour, tirage, générateur à graine), état dans `lottery/lottery.ts` (sauvegarde `mine-explorer.lottery` : jour du dernier tirage).
