# Marchand nain

Idée validée par Théo le 14/10/2026 : un marchand qui ne passe que 5 jours par mois, annoncé par des indices de plus en plus nets.

## Calendrier

- **5 jours d'affilée par mois.** Le premier jour se tire du calendrier (entre le 3 et le 22), il est donc le même pour tous les joueurs : on peut se prévenir entre amis.
- **Les indices montent** sur l'écran de la mine, dans une bulle sous le bandeau de zone qu'on peut fermer :
  - J-5 et J-4 : « Un vieux mineur parle d'un marchand qui sillonne les galeries… » ;
  - J-3 : des traces de pas de nain dans la poussière (avec leur image une fois livrée) ;
  - J-2 : des clochettes de mule, avec un tintement ;
  - J-1 : une lanterne qui vacille ; dans Aventures, une silhouette noire « ??? » et « Arrive demain ».
- **Jour J** : « Le marchand nain est arrivé avec sa mule ! », une bulle dorée qui ouvre son étal.
- **Dernier jour** : « Le marchand remballe ses affaires… dernière chance ! ».
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
- **Visuels provisoires** : le sac de pièces tient lieu de marchand et le Campement d'étal, en attendant les images Gemini ([[aventures-prompts]]).
