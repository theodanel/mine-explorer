# CI/CD

Retour à [[documentation-technique]].

## Pipeline (`.github/workflows/ci.yml`)

Déclenché sur chaque pull request et chaque push sur `main`.

| Job | Étapes | Bloquant |
|---|---|---|
| **Frontend** | `npm ci`, lint, tests et couverture, build de production, `npm audit --audit-level=high` | Oui |
| **Backend** | `./mvnw verify` (build et tests) sur Java 21, puis construction de l'image Docker (rien n'est publié) | Oui |
| **Fusion automatique** | Fusionne la PR, puis relance la CI sur `main` pour déployer | Seulement sur une PR éligible, après les deux jobs verts |
| **Déploiement** | Publie le build sur Cloudflare Pages | Seulement sur `main` (push ou relance), après les deux jobs verts |

Le build du frontend est conservé comme artefact et c'est **exactement ce build** qui est déployé : ce qui part en ligne est ce qui a été testé.

## Fusion automatique

Décidée par Théo le 13/10/2026. Une PR fusionne seule dès que le lint, les tests, le build et l'audit sont verts, si elle :
- vient de ce dépôt et de Théo (y compris les PR que Claude ouvre pour lui), ou de Dependabot pour une version **mineure ou corrective** ;
- n'est pas en brouillon ;
- ne porte pas le label `pas-de-fusion-auto`.

Les versions majeures proposées par Dependabot (Angular, PixiJS, une action) restent en fusion manuelle : elles peuvent casser le jeu même avec des tests verts.

**Risque assumé** : une PR éligible part en ligne sans relecture humaine. Pour relire une PR avant sa mise en ligne, l'ouvrir en brouillon ou lui mettre le label `pas-de-fusion-auto` **avant** la fin de sa CI.

Fonctionnement : le job `automerge` fusionne avec le jeton de la CI. Une fusion faite avec ce jeton ne déclenche pas l'événement `push`, donc le job relance lui-même le workflow sur `main` (`workflow_dispatch`, que ce jeton peut déclencher). Cette exécution refait tous les contrôles avant de déployer : un `main` cassé par deux PR fusionnées coup sur coup n'est pas publié.

GitHub réserve la protection de branche aux dépôts publics ou aux offres payantes [PROBABLE]. Tout le contrôle se fait donc dans la CI, et aucun réglage du dépôt n'est nécessaire.

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
