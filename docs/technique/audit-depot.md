# Audit du dépôt : secrets et exposition de l'infrastructure

Fait le 19/10/2026 à la demande de Théo, sur le dépôt `mine-explorer` : fichiers suivis et **tout l'historique git** (304 commits, toutes les branches), plus des sondages de l'API en ligne. Les fichiers `.env` de Théo (sur son PC et sur le Pi) n'ont pas été lus, à sa demande : ils ne sont pas dans git.

## Résultat

**Aucun secret n'a jamais été commité.** Rien à révoquer.

| Recherche | Où | Résultat |
|---|---|---|
| Secret OAuth Google, clés d'API (Google, GitHub, Slack, OpenAI…), clés privées, jetons Cloudflare | Historique complet | Rien. Seul `client-secret=test-secret` dans `application-test.properties`, factice et réservé aux tests |
| Fichiers `.env`, `.pem`, `.key`, `.p12`, identifiants | Noms de fichiers de tout l'historique | Jamais commités ; `.env` est dans `.gitignore`, à la racine et dans `deploiement/raspberry-pi/` |
| Mots de passe en clair | Historique complet | Rien : uniquement des variables (`${POSTGRES_PASSWORD}`) et des modèles vides (`.env.example`) |
| ID client Google | Historique complet | Absent (seulement un exemple `…apps.googleusercontent.com`). Un ID client n'est de toute façon pas secret |
| Secrets de la CI | `.github/workflows/` | Jeton et compte Cloudflare lus depuis les secrets GitHub, dans l'environnement `production`, par le seul job de déploiement. Aucun `pull_request_target` |

## Exposition de la box et du Pi

| Recherche | Résultat |
|---|---|
| IP publique de la box, IP du Pi sur le réseau local | Absentes (seules des IP d'exemple réservées à la documentation ou aux tests : `203.0.113.x`, `10.0.x.x`, `192.168.1.20`) |
| Ports d'administration (Nginx Proxy Manager 81, Vaultwarden, SSH) | Jamais cités. Vérifié de l'extérieur le 19/10/2026 : 81, 8000, 8080, 22 et 5432 ne répondent pas sur `api.bouncylab.ovh` ; seul le 443 (HTTPS) répond |
| Nom d'utilisateur, chemins locaux | `C:\Users\theod\…` apparaissait dans deux docs (le prénom du compte Windows) : remplacé par un chemin neutre |
| Ce qui reste public, volontairement | Les domaines `mine.bouncylab.ovh` et `api.bouncylab.ovh` (publics par nature), le sous-réseau Docker interne `172.30.0.0/24` (non joignable de l'extérieur, nécessaire à la configuration du proxy de confiance) |

## API en ligne, sondée de l'extérieur

| Point | Résultat |
|---|---|
| `/actuator/env`, `/actuator`, `/h2-console` | 401, rien n'est lisible |
| `/actuator/health` | Renvoyait aussi les noms de groupes (`liveness`, `readiness`) : **corrigé**, il ne renvoie plus que `{"status":"UP"}` (`management.endpoint.health.probes.enabled=false`, testé dans `SecurityTests`) |
| `/error` appelé directement | Réponse générique sans trace ni détail interne |
| En-têtes | HSTS, `nosniff`, `X-Frame-Options: DENY` présents |

## Ce qui reste à décider (pas des failles)

| Point | Gravité | Recommandation |
|---|---|---|
| Adresse e-mail personnelle dans l'historique (pages légales du 18/10, remplacée depuis par `contact@bouncylab.ovh`) et adresse de l'école comme auteur de 197 commits | Faible, le dépôt est **privé** | Rien à faire tant qu'il reste privé. Avant de le rendre public : réécrire l'historique (`git filter-repo`) ou l'accepter, et régler `git config user.email` sur l'adresse `…@users.noreply.github.com` |
| Alertes Dependabot et analyse des secrets de GitHub désactivées | Faible | GitHub → Settings → Code security : activer **Dependabot alerts** (gratuit). L'analyse des secrets demande un dépôt public ou un forfait payant |
