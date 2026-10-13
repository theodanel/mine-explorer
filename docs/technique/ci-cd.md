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

CodeQL analyse le TypeScript et le Java (requêtes `security-extended`) sur chaque PR, sur `main` et chaque lundi.

Le *code scanning* de GitHub n'est pas activé sur ce dépôt privé (il demande GitHub Code Security, payant). Les résultats ne peuvent donc pas être envoyés à l'onglet *Security* : ils sont gardés 30 jours en artefact SARIF (`codeql-javascript-typescript`, `codeql-java-kotlin`) sur la page du run, lisibles avec l'extension SARIF Viewer de VS Code. Une alerte ne bloque pas la CI. Si le dépôt devient public ou que Code Security est activé, retirer `upload: never` et l'étape d'artefact pour retrouver les alertes dans GitHub.

Première analyse (13/10/2026) : 0 alerte en TypeScript, 0 en Java.

## Mises à jour des dépendances (`.github/dependabot.yml`)

Dependabot ouvre chaque semaine des PR groupées pour npm (`frontend/`), Maven (`backend/`) et les actions GitHub. Elles passent par la même CI avant d'être fusionnées.

## Faire évoluer la CI

- Une nouvelle commande de vérification s'ajoute au job concerné, et dans [[installation]].
- Les versions des actions sont suivies par Dependabot. [INCERTAIN] Pour aller plus loin, on peut épingler chaque action sur son empreinte de commit (SHA) plutôt que sur une étiquette de version.
