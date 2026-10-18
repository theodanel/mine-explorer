# Dévoilement progressif

Retours de joueurs sur Discord (18/10/2026), relayés par Théo : les premières minutes sont confuses. Tout l'écran est visible dès la première seconde (7 cases d'équipement, pioche, missions, forge, Auto, Filtres, stats, roue du jour, menu du bas) avec un tutoriel en texte par-dessus. Les jeux idle qui marchent cachent leurs systèmes et les introduisent un par un, par le jeu plutôt que par du texte.

## Principe

- Une partie neuve ne montre que le mineur, son filon, l'or et la zone. Le mineur creuse tout seul : l'or qui vole jusqu'au compteur suffit à comprendre.
- Chaque élément apparaît au moment où il sert, surgit avec une petite animation, et une bulle d'une ligne l'entoure quelques secondes. Rien n'est flouté ni bloqué : un toucher ferme la bulle et joue normalement.
- Une bulle dont le joueur a déjà fait l'action (forger avant de la voir) est sautée.
- Les joueurs déjà avancés voient toute l'interface, comme avant.

## Ordre d'apparition

| Élément | Quand | Bulle |
|---|---|---|
| Forge, compteur d'éclats, panneau du bas | Le joueur peut forger (premiers éclats) | Touche l'enclume pour forger ton premier équipement |
| Équipement porté | 1er objet forgé | Chaque pièce rend ton mineur plus fort |
| Missions | 1er objet forgé (la 1re mission est déjà remplie : récompense à prendre) | Suis-les, elles rapportent des éclats |
| Pioche | 2 objets forgés et assez d'or pour un segment | Améliore ta pioche pour forger de meilleurs objets |
| Statistiques | 3 objets forgés | Toutes les forces de ton mineur |
| Auto et Filtres | 10 objets forgés | Auto forge à ta place, les filtres vendent le reste |
| Onglets du menu du bas | Zone 2 | D'autres onglets suivront |
| Roue du jour | Zone 3 | Un tirage gratuit chaque jour |

Les seuils sont dans `frontend/src/app/onboarding/reveal-rules.ts`.

## Suite prévue

Rendre chaque progrès visible dans le jeu : afficher l'effet d'une amélioration sur le mineur (« Dégâts 12 → 15 »), une pioche qui grossit et brille avec son niveau, plus de retours visuels et sonores à la casse d'un filon.
