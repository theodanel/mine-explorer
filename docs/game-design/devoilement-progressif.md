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

## Suite prévue

Rendre chaque progrès visible dans le jeu : afficher l'effet d'une amélioration sur le mineur (« Dégâts 12 → 15 »), une pioche qui grossit et brille avec son niveau, plus de retours visuels et sonores à la casse d'un filon.
