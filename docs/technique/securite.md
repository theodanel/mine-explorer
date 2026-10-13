# Sécurité

Retour à [[documentation-technique]]. Revue complète du 13/10/2026.

## Modèle de menace

Mine Explorer est aujourd'hui un **jeu solo sans serveur** : aucun compte, aucune donnée personnelle, aucun paiement, aucune donnée envoyée sur le réseau. Les risques réels sont donc :

| Risque | Protection |
|---|---|
| Script injecté dans la page (XSS) | Aucun HTML construit à partir de données (pas d'`innerHTML`, pas de contournement du nettoyage d'Angular) ; CSP stricte qui interdit tout script inline ou externe |
| Site affiché dans un cadre piégé (clickjacking) | `frame-ancestors 'none'` et `X-Frame-Options: DENY` |
| Sauvegarde abîmée ou trafiquée qui casse le jeu | Validation et bornes de chaque clé au chargement, retour à un état neuf sinon, test dédié |
| Dépendance vulnérable | `npm audit` bloquant en CI, Dependabot, CodeQL |
| Fuite d'un secret | Aucun secret dans le dépôt ; secrets de déploiement dans un environnement GitHub restreint |
| Pipeline détourné | Permissions minimales des workflows, jeton GitHub non conservé au checkout |
| Fuite d'informations du serveur (plus tard) | Erreurs sans trace ni message interne, console H2 fermée |

## En-têtes HTTP (`frontend/public/_headers`)

| En-tête | Valeur et raison |
|---|---|
| `Content-Security-Policy` | `default-src 'self'`, **`script-src 'self'`** (aucun script inline, aucun `eval`), `style-src 'self' 'unsafe-inline'` (voir limites), `img-src`/`media-src` `'self' data: blob:`, `connect-src 'self' data: blob:` (PixiJS lit ses textures ainsi), `worker-src 'self' blob:`, `object-src 'none'`, `base-uri 'self'`, `form-action 'none'`, `frame-ancestors 'none'`, `upgrade-insecure-requests` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` : HTTPS obligatoire pendant un an |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` (pour les navigateurs anciens) |
| `Referrer-Policy` | `no-referrer` |
| `Permissions-Policy` | caméra, micro, géolocalisation, capteurs, paiement, USB refusés |
| `Cross-Origin-Opener-Policy` / `Cross-Origin-Resource-Policy` | `same-origin` |

Vérifié le 13/10/2026 : le build de production servi avec ces en-têtes (`tools/serve-dist.mjs`) se charge et se joue sans aucune violation de CSP dans la console.

Pour y arriver : PixiJS est importé dans sa variante sans `eval` (`pixi.js/unsafe-eval`, dont le nom désigne la compatibilité avec les CSP *sans* `unsafe-eval`), et l'injection en ligne du CSS critique est désactivée (elle ajoutait un attribut `onload` inline).

## Sauvegarde locale

- Toutes les lectures passent par `readStorage`, qui ne lève jamais d'erreur (stockage bloqué en navigation privée ou par une WebView).
- Chaque clé est validée (types, entiers sûrs, bornes, identifiants connus) ; une valeur invalide est ignorée et la partie repart de zéro pour ce domaine.
- Les montants (or, éclats) sont plafonnés au plus grand entier exact au lieu d'être perdus.
- Une sauvegarde d'une version précédente est migrée (compteurs ajoutés, niveaux de compagnon remboursés) au lieu d'être rejetée.

## Backend

Pas de route exposée et non déployé. Réglages par défaut sûrs déjà en place : réponses d'erreur sans trace ni message, page d'erreur générique désactivée, console H2 fermée, pas de requête SQL pendant le rendu (`open-in-view=false`). Testés dans `ErrorResponseTests`.

## Limites assumées

- **Triche locale** : la partie vit dans le navigateur du joueur. Il peut modifier sa sauvegarde ou le code JavaScript et se donner de l'or. Ce n'est pas un risque de sécurité tant que le jeu est solo, sans classement ni achat ; ça le deviendra le jour où un classement, des échanges ou des achats arrivent. La seule vraie parade est un **serveur autoritaire** qui calcule et valide les gains : c'est le rôle prévu du backend.
- **`style-src 'unsafe-inline'`** : Angular injecte les styles de ses composants dans des balises `<style>`. Sur un site statique, on ne peut pas générer de *nonce* par requête. Le risque résiduel (injection de CSS) est faible, car aucun contenu n'est construit à partir de données externes.
- **Adresse publique** : sans Cloudflare Access, toute personne qui a l'adresse peut jouer (voir [[deploiement]]).

## Contrôles réguliers

| Contrôle | Où |
|---|---|
| Dépendances npm | `npm audit --audit-level=high` à chaque CI, Dependabot chaque semaine |
| Dépendances Maven et actions GitHub | Dependabot chaque semaine |
| Code | CodeQL à chaque PR et chaque lundi (résultats en artefact, voir [[ci-cd]]) |
| En-têtes | Après tout changement de `_headers` ou d'une bibliothèque de rendu : `npm run build` puis `node tools/serve-dist.mjs`, console du navigateur sans violation |
