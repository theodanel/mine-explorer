# Renaissance : la boucle de fin de partie

Retour à [[Accueil]]. Décidé le 25/10/2026 par Théo : « J'aimerai qu'on réfléchisse au endgame, au lieu de faire du contenu encore, comment faire une boucle ? », puis « Ok pour renaissance ». Ce document est la proposition à valider **avant** le code. Les chiffres seront calés au simulateur.

## L'idée

Aujourd'hui, le jeu a une fin : zone 20, Éveil 5, et chaque ajout la recule un peu. La Renaissance en fait une boucle, celle des jeux idle qui durent. Le joueur repart de la zone 1, plus fort, et va plus vite et plus loin à chaque vie.

1. **Condition** : avoir atteint la zone 20.
2. **On renaît** : la partie « de mine » repart de zéro.
3. **On gagne des Braises du Cœur**, selon la profondeur atteinte.
4. **On les dépense dans l'Arbre des Braises**, des bonus permanents.
5. On redescend, plus vite. On renaît plus loin et on gagne plus de Braises.

## Ce qui repart de zéro, ce qui reste

| Repart de zéro (la « vie ») | Reste (le « compte ») |
|---|---|
| Zone et filon | Évolution du mineur, étoiles du Cœur comprises |
| Niveau de pioche | Artefacts et leurs niveaux |
| Équipement porté (on reforge depuis le Bois) | Compagnons |
| Or, minerais | Runes, ressources du Cœur, anneau |
| Atelier, Campement | Éveil des emplacements (il revient avec le Divin) |
| Points de l'arbre de compétences (regagnés en redescendant) | Succès, titres, records, Puits sans fond |

Pourquoi ce partage : on garde tout ce qui demande des semaines (évolution, runes, Éveil) et on rejoue la partie qui fait le plaisir des premiers jours (forger, monter la pioche, changer de zone). L'évolution gardée (×5 de Frappe en Légende, plus les étoiles) fait d'emblée descendre bien plus vite.

## Braises du Cœur

**Braises = (zone atteinte − 15)²**, au moment de renaître :

| Zone atteinte | Braises |
|---|---|
| 20 (minimum) | 25 |
| 21 | 36 |
| 22 | 49 |
| 24 | 81 |

Le carré pousse à aller un peu plus loin avant de renaître, sans obliger à piétiner : c'est le choix du joueur, renaître tôt ou pousser.

## Arbre des Braises (permanent)

Six branches, chacune achetée palier par palier avec un coût qui monte. À caler au simulateur.

| Branche | Effet par palier | Pourquoi |
|---|---|---|
| Frappe ancestrale | +10 % de Frappe | La puissance de base qui grandit à chaque vie |
| Pioche mémoire | La pioche repart au niveau 2, 4, 6… | Les premières heures passent plus vite |
| Raccourci | On renaît 10 zones avant son record, puis 9, 8… jusqu'à 4 (choix de Théo, 26/10/2026 ; avant : zones fixes 3 à 15) | Sauter ce qui est devenu trivial |
| Forge vive | +5 % d'éclats gagnés | La Forge va plus vite |
| Mémoire du Cœur | +1 ressource du Cœur par filon d'Écho | Les runes et l'Éveil avancent aussi entre les vies |
| Bourse héritée | Une part de l'or repart avec toi | Moins de piétinement au départ |

## Classement et serveur

- Le classement « profondeur » doit compter la **meilleure profondeur jamais atteinte**, sinon un joueur qui renaît tomberait au fond du classement. Côté serveur, la valeur classée devient le maximum de toutes les vies (nouvelle clé de sauvegarde, par exemple `mine-explorer.renaissance` avec le nombre de renaissances, le record et les Braises).
- Un nouveau classement possible : **nombre de renaissances** ou **record en une vie**.
- **Anti-triche** : la courbe de référence suit aujourd'hui une seule descente. Après une renaissance, une progression rapide est normale : il faudra mesurer depuis la dernière renaissance, pas depuis la création du compte.

## Rythme visé (à vérifier au simulateur)

| Vie | Zone 20 atteinte en |
|---|---|
| 1re | environ 56 jours (comme aujourd'hui) |
| 2e | environ 2 semaines |
| 5e | environ 1 semaine |

## Ce que Théo doit trancher

1. **Le partage gardé / perdu** ci-dessus. En particulier : l'Atelier et le Campement repartent-ils de zéro ? Je recommande que oui, pour qu'ils restent des choix à refaire.
2. **La formule des Braises** : (zone − 15)², ou plus simple (5 par zone au-delà de 15).
3. **Les six branches de l'arbre** : à garder, retirer ou remplacer.
4. **Le classement** : meilleure profondeur toutes vies confondues (recommandé), ou classement remis à zéro.

Une fois ces choix faits : calibrage au simulateur (plusieurs vies), puis le code, puis staging.
