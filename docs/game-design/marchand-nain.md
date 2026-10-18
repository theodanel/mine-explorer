# Marchand nain

Idée validée par Théo le 14/10/2026 : un marchand qui ne passe que quelques jours par mois, annoncé par des indices de plus en plus nets.

## Calendrier

- **10 jours par mois, au hasard** (demande de Théo, 17/10/2026 ; c'était 5 jours d'affilée). Les 10 jours sont tirés parmi ceux du mois, sans être d'affilée, et se tirent du calendrier : ils sont les mêmes pour tous les joueurs, on peut se prévenir entre amis. Le dernier jour d'une série (il ne revient pas le lendemain), il « remballe ce soir ».
- Comme il revient souvent, les indices ne vont pas toujours jusqu'à J-5 : ils commencent après son départ précédent. Une bulle fermée revient le jour où le même indice réapparaît.
- **Les indices montent** sur l'écran de la mine, dans une petite bulle sous le bandeau de zone. Elle ne reste que 6 secondes puis s'estompe (demande de Théo, 15/10/2026) : la carte des Aventures garde l'information.
  - J-5 et J-4 : « Un vieux mineur parle d'un marchand qui sillonne les galeries… » ;
  - J-3 : des traces de pas de nain dans la poussière (avec leur image une fois livrée) ;
  - J-2 : des clochettes de mule, avec un tintement ;
  - J-1 : une lanterne qui vacille ; dans Aventures, une silhouette noire « ??? » et « Arrive demain ».
- **Jour J** : « Un marchand est de passage », avec son portrait et un liseré doré ; la toucher ouvre son étal.
- **Dernier jour d'une série** : « Le marchand remballe ce soir » ; dans Aventures, « Repart ce soir ! » (sinon « Encore là demain »).
- **Hors visite**, sa carte dans Aventures indique dans combien de jours il revient.
- **Limite connue** : sans serveur, avancer l'horloge du téléphone le fait venir plus tôt, comme pour le reste du jeu.

## Marchandage

- **Ouverture** : dès le Contremaître.
- **Offres** : 3 par jour, tirées du jour (les mêmes pour tous), parmi éclats (60 ou 150), pierres d'éveil (10 ou 25), minerai de la zone (30 ou 80) et œufs (rare ou épique, ou mieux). Le prix se compte en filons d'or de la zone : de 5 à 45 filons.
- **Humeur** : de 0 à 100. Elle part de 60 chaque jour et monte de 10 à chaque achat.
- **Marchander** : réussit de 30 % (furieux) à 80 % (ravi) du temps. Réussi, −20 % sur le prix ; raté, +10 %. L'humeur baisse dans les deux cas.
- **Bluffer** : réussit de 15 % à 55 % du temps. Réussi, −40 % sur le prix ; raté, l'offre est retirée pour la journée.
- **Limite** : deux tentatives par offre.
- **Le marchand réagit** : il sautille content ou s'agace, et sa bulle change de ton.

## Technique

- **Fichiers** :
  - chiffres dans `balance/merchant.ts` ;
  - calendrier, offres et marchandage (fonctions pures) dans `merchant/merchant-rules.ts` ;
  - service `merchant/merchant.ts` (clé `mine-explorer.merchant`, remise à neuf chaque jour) ;
  - page `merchant-page/` et bulle d'indices `merchant-hint/`.
- **Visuels** : le nain et sa mule, et son étal en fond (images Gemini, préparées par `art-source/aventures/preparer-aventures.py`). Les traces de pas attendent encore leur image ([[aventures-prompts]]).
