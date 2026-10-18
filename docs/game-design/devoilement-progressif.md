# Prise en main

Retours de joueurs sur Discord (18/10/2026), relayés par Théo : les premières minutes sont confuses, le joueur ne comprend ni ses objectifs ni sa progression, et l'écran montre tout dès la première seconde avec un tutoriel en texte qui floute le jeu.

Choix de Théo, le même jour, après une première version qui cachait tout :

- le panneau du bas (équipement, pioche, forge, missions, stats, Auto, Filtres) est visible dès le début, mais grisé et bloqué : chaque élément se débloque quand le tuto le présente ;
- la barre de navigation montre tous les menus, grisés et bloqués tant qu'ils ne sont pas ouverts ;
- Compétences et Compagnons s'ouvrent à la zone 2, Artefacts à la zone 3.

## Le tuto en bulles

Pas de flou, pas de passage obligé : l'élément se débloque (il quitte le gris et surgit), et une bulle d'une ligne l'entoure au moment où il sert, quelques secondes, et un toucher n'importe où la ferme en jouant normalement. Une bulle dont le joueur a déjà fait l'action (forger avant de la voir) est sautée. Une partie déjà avancée a tout débloqué et ne voit aucune bulle.

| Élément | Quand | Bulle |
|---|---|---|
| Forge | Le joueur peut forger (premiers éclats) | Touche l'enclume pour forger ton premier équipement |
| Équipement porté | 1er objet forgé | Chaque pièce rend ton mineur plus fort |
| Missions | 1er objet forgé (la 1re mission est déjà remplie : récompense à prendre) | Suis-les, elles rapportent des éclats |
| Pioche | 2 objets forgés et assez d'or pour un segment | Améliore ta pioche pour forger de meilleurs objets |
| Statistiques | 3 objets forgés | Toutes les forces de ton mineur |
| Auto et Filtres | 10 objets forgés | Auto forge à ta place, les filtres vendent le reste |

## Les onglets du menu du bas

Tous les onglets sont visibles dès le début, grisés et bloqués avec leur condition d'ouverture (« Zone 2 »…). À l'ouverture, l'onglet reprend ses couleurs, surgit, et une bulle « Nouveau : … » le présente.

| Onglet | Ouverture |
|---|---|
| Compétences | Zone 2 (les 3 points de la zone 1) |
| Compagnons | Zone 2, avec un premier œuf offert |
| Artefacts | Zone 3 : la zone 2 terminée livre le premier artefact, aucun n'est trouvé avant |
| Atelier | Évolution, comme avant |
| Aventures | Zone du Campement, comme avant |

Les seuils sont dans `frontend/src/app/onboarding/reveal-rules.ts` et les zones d'ouverture dans `balance/skill-tree.ts`, `balance/companions.ts` et `balance/artifacts.ts`.

## Progrès visible

Second retour Discord : le jeu se résume à des chiffres qui montent, sans retour satisfaisant. Chaque progrès se voit maintenant dans la mine :

- **Gain de Puissance** : dès que le mineur devient plus fort (objet équipé, compétence, artefact, Atelier…), une onde dorée part de lui, des étincelles jaillissent, il brille d'or un instant, et « Puissance +107 » s'affiche au-dessus de lui avec les stats qui ont le plus monté (« Frappe 5 → 7 », deux au plus), avec le son d'amélioration. Un gain obtenu depuis une page du menu s'affiche au retour sur la mine ; plusieurs gains d'affilée n'en font qu'un.
- **Filon qui cède** : un flash blanc, une gerbe de gros éclats et une petite secousse de la galerie, en plus du son de casse.

Calcul du gain : `frontend/src/app/mine-scene/power-gain.ts` ; effets : `hit-effects.ts`.

## Pistes suivantes

La pioche qui grossit et brille avec son niveau demande une animation du mineur par niveau de pioche (images à générer) : à trancher avec Théo.
