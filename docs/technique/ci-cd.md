# CI/CD

Retour à [[documentation-technique]].

## Pipeline (`.github/workflows/ci.yml`)

Déclenché sur chaque pull request et chaque push sur `main`.

| Job | Étapes | Bloquant |
|---|---|---|
| **Frontend** | `npm ci`, lint, tests et couverture, build de production, `npm audit --audit-level=high` | Oui |
| **Backend** | `./mvnw verify` (build et tests) sur Java 21 | Oui |
| **Déploiement** | Publie le build sur Cloudflare Pages | Seulement sur `main`, après les deux jobs verts |

Le build du frontend est conservé comme artefact et c'est **exactement ce build** qui est déployé : ce qui part en ligne est ce qui a été testé.

Protections du pipeline :
- permissions par défaut en lecture seule (`contents: read`) ;
- `persist-credentials: false` au checkout : le jeton GitHub n'est pas laissé dans le dépôt cloné ;
- secrets Cloudflare rangés dans l'**environnement GitHub `production`**, lisibles par le seul job de déploiement ;
- une exécution plus récente sur la même branche annule la précédente.

## Analyse de sécurité (`.github/workflows/codeql.yml`)

CodeQL analyse le TypeScript et le Java (requêtes `security-extended`) sur chaque PR, sur `main` et chaque lundi. Les alertes apparaissent dans l'onglet *Security* du dépôt.

[PROBABLE] Sur un dépôt **privé**, l'analyse de code de GitHub demande GitHub Advanced Security (payant). Sans elle, ce workflow échoue à l'envoi des résultats : il faut alors rendre le dépôt public ou désactiver ce workflow. À vérifier dans *Settings → Code security* du dépôt.

## Mises à jour des dépendances (`.github/dependabot.yml`)

Dependabot ouvre chaque semaine des PR groupées pour npm (`frontend/`), Maven (`backend/`) et les actions GitHub. Elles passent par la même CI avant d'être fusionnées.

## Faire évoluer la CI

- Une nouvelle commande de vérification s'ajoute au job concerné, et dans [[installation]].
- Les versions des actions sont suivies par Dependabot. [INCERTAIN] Pour aller plus loin, on peut épingler chaque action sur son empreinte de commit (SHA) plutôt que sur une étiquette de version.
