# Contribuer à Mine Explorer

## Démarrer

Installation et commandes : [README.md](README.md#démarrer-en-local) et [docs/technique/installation.md](docs/technique/installation.md).

## Branches et pull requests

- `main` est toujours déployable : chaque push sur `main` dont la CI est verte part en ligne.
- Une branche par sujet, nommée par type : `feat/…` (nouveauté), `fix/…` (correction), `docs/…`, `chore/…`, `sec/…`.
- Une pull request par sujet. La description suit le modèle **Before / After / How** : ce que voit le joueur avant, ce qu'il voit après, puis comment c'est fait.
- **Fusion automatique** : une PR verte de Théo est fusionnée par la CI. Pour une nouveauté visible qu'il faut relire ou montrer avant, ouvrir la PR en **brouillon** ou lui mettre le label `pas-de-fusion-auto`.

## Messages de commit

En français, au format [Conventional Commits](https://www.conventionalcommits.org/fr/) avec un domaine du jeu entre parenthèses :

```
feat(discussion): texte libre avec emojis, filtre et modération
fix(anti-triche): ne plus refuser la sauvegarde d'un vrai joueur avancé
```

Le corps explique le **pourquoi**. Le quoi se lit dans le diff.

## Conventions de code

| | Règles |
|---|---|
| Général | Typage le plus strict possible, pas de `any`. Fonctions courtes à une responsabilité, pas de nombres magiques (constantes nommées), pas de code mort. Commentaires en français, sur le pourquoi |
| Jeu | Règles de jeu pures dans `*-rules.ts` (sans Angular, testées seules), équilibrage dans `balance/`, état dans des services à signaux, affichage dans les composants. Hasard et temps injectés (`RANDOM`, `CLOCK`). Sauvegardes du `localStorage` relues et validées |
| Serveur | Une couche par paquet métier (`account`, `save`, `leaderboard`, `chat`…). Requêtes JPQL paramétrées, schéma uniquement par Flyway, erreurs en `ProblemDetail` sans détail interne, joueur toujours tiré de la session |
| Sécurité | Aucun secret dans le code ni les logs. Toute entrée externe validée côté serveur. Une protection désactivée est signalée et justifiée dans la PR |

## Checklist avant de demander une relecture

- [ ] `npm run lint`, les tests et `npm run build` passent dans `frontend/`
- [ ] `./mvnw verify` passe dans `backend/` (si le serveur change)
- [ ] Les règles nouvelles ont leurs tests (cas limites, accès refusés)
- [ ] La documentation concernée est à jour dans la même PR (`docs/technique/` ou `docs/game-design/`)
- [ ] Aucun secret, aucun fichier `.env`, aucune donnée personnelle dans le diff

## Assets

Les images sont générées (style cartoon validé, fond vert) puis préparées par les scripts de `art-source/`, qui détourent, recadrent et convertissent en WebP dans `frontend/public/assets/`. Garder la source et le script, jamais seulement l'image finale.
