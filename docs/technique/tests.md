# Tests

Retour à [[documentation-technique]].

## Stratégie

| Niveau | Quoi | Où |
|---|---|---|
| Règles pures | Formules, cas limites, validation des sauvegardes | `*-rules.spec.ts`, `balance/*.spec.ts` |
| Services | État, sauvegarde, migrations, effets entre domaines (hasard et heure figés) | `*.spec.ts` à côté du service |
| Pages et fenêtres | Rendu sur une sauvegarde donnée, boutons qui changent l'état | `shared/pages.spec.ts`, specs de composants |
| Robustesse | Toutes les clés de sauvegarde chargées avec des valeurs abîmées ou trafiquées | `shared/save-robustness.spec.ts` |
| Backend | Démarrage du contexte, réponses d'erreur sans information interne | `backend/src/test/` |
| Économie | Rythme de progression sur 90 jours avec les vraies règles | `tools/simulate.mts` |

## Outils

- **Vitest 4** dans un DOM simulé (jsdom), lancé par le builder de tests d'Angular (`ng test`).
- **Couverture** : `@vitest/coverage-v8`, rapport dans `frontend/coverage/`.
- **Backend** : JUnit 5, Spring Boot Test, MockMvc.

## Couverture (13/10/2026)

340 tests frontend, 3 tests backend.

| Mesure | Frontend |
|---|---|
| Instructions | 67,5 % |
| Lignes | 71,7 % |

Les règles du jeu et les services d'état dépassent 90 %. Le reste est surtout la scène PixiJS (`mine-scene/`, effets de coups), qui dessine dans un canvas WebGL absent du DOM simulé : elle est vérifiée à la main dans le navigateur.

## Simulateur d'économie

Chaque changement d'équilibrage est vérifié au simulateur, qui joue la partie avec les fonctions de `*-rules.ts`. Cible de référence : pioche 30 vers le jour 49 pour un joueur qui joue 1 h par jour, en moyenne sur 5 tirages (`SEED=…`). Détails et options dans `docs/game-design/equilibrage.md`.

## Écrire un test

- Une règle pure se teste sans Angular.
- Un service se teste avec `TestBed`, une sauvegarde posée dans `localStorage` avant `TestBed.inject`, et `CLOCK`/`RANDOM` fournis en valeurs fixes.
- Un composant se teste par son DOM (`fixture.nativeElement`) : on clique, on relit l'état du service.
