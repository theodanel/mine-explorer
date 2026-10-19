# Déploiement

Retour à [[documentation-technique]].

## Principe

Seul le frontend est mis en ligne : c'est un site statique (HTML, JavaScript, images) servi par **Cloudflare Pages**. Le job `deploy` de la CI le publie à chaque push sur `main` dont les tests passent. Le backend n'est pas déployé tant qu'il n'a pas de rôle (voir [[choix-techniques]]).

Les en-têtes HTTP de sécurité sont dans `frontend/public/_headers`, copié à la racine du build et appliqué par Cloudflare Pages (voir [[securite]]).

## Environnement de test

Demande de Théo (19/10/2026), pour ne plus envoyer chaque PR directement en production :

| Branche | Site | Serveur | Fusion |
|---|---|---|---|
| `staging` | `https://staging.mine.bouncylab.ovh` (projet Cloudflare Pages `mine-explorer-staging`, bandeau « Version de test ») | `https://api-staging.bouncylab.ovh`, second serveur sur le Pi avec sa propre base | Automatique : chaque PR verte vers `staging` (Théo, Dependabot) |
| `main` | `https://mine.bouncylab.ovh` | `https://api.bouncylab.ovh` | Une PR `staging` → `main`, sur le « ok » de Théo |

Le build du site de test est le build de production combiné à la configuration Angular `staging` (`environment.staging.ts` : API de test, bandeau). La CI crée le projet Cloudflare du site de test à sa première publication ; son domaine se branche comme celui du vrai jeu (section « Domaine personnalisé », avec `staging.mine` vers `mine-explorer-staging.pages.dev`). Serveur de test : `deploiement/raspberry-pi/LISEZMOI.md`, section « Serveur de test ».

## Mise en place (une seule fois)

1. **Créer le projet Cloudflare Pages** : *Workers & Pages*, *Create application*, puis le lien « Continue to Pages » en bas de l'écran (Cloudflare met désormais les Workers en avant et appelle Pages « legacy » ; « Upload your static files » crée un Worker, que la CI ne sait pas mettre à jour et qui n'accepte pas de CNAME chez OVH), puis « Drag and drop your files ». Nom du projet : `mine-explorer`. Le tableau de bord exige un premier envoi : y déposer le dossier `frontend/dist/frontend/browser` d'un `npm run build` local, puis *Deploy site*. Les déploiements suivants viennent de la CI. Vérifier ensuite dans *Settings* que la branche de production est `main`.
2. **Créer un jeton d'API** : *My Profile*, *API Tokens*, *Create Token*, modèle *Edit Cloudflare Workers* ou jeton personnalisé avec la seule permission *Account → Cloudflare Pages → Edit*, limité au compte concerné. Le copier une fois.
3. **Relever l'identifiant du compte** : visible sur la page d'accueil du compte (*Account ID*).
4. **Dans GitHub** (*Settings → Environments*) : créer l'environnement `production`, y ajouter
   - les secrets `CLOUDFLARE_API_TOKEN` et `CLOUDFLARE_ACCOUNT_ID` ;
   - la variable `CLOUDFLARE_PROJECT_NAME` = `mine-explorer`.
   Optionnel : limiter l'environnement à la branche `main` (*Deployment branches*).
5. **Fusionner sur `main`** : la CI teste puis publie. L'adresse apparaît dans l'onglet *Actions* (job « Déploiement ») et dans Cloudflare : `https://mine-explorer.pages.dev`.

[PROBABLE] Les intitulés exacts des menus Cloudflare peuvent changer ; les permissions à donner restent celles-ci.

## Domaine personnalisé

Le jeu peut être servi sur un sous-domaine de `bouncylab.ovh` (par exemple `mine.bouncylab.ovh`) sans déplacer le domaine d'OVH :

1. Cloudflare, projet Pages `mine-explorer`, *Custom domains*, *Set up a domain* : saisir `mine.bouncylab.ovh`. Cette étape vient **avant** le CNAME, sinon le domaine répond en erreur 522.
2. Chez OVH, zone DNS de `bouncylab.ovh` : ajouter un enregistrement `CNAME` `mine` vers `mine-explorer.pages.dev`.
3. Cloudflare vérifie le domaine et émet le certificat HTTPS tout seul.

Le domaine nu (`bouncylab.ovh` sans sous-domaine) demande en revanche de confier les serveurs DNS du domaine à Cloudflare. Les en-têtes de `_headers` s'appliquent sur les deux adresses ; HSTS ne concerne que le sous-domaine du jeu et ses propres sous-domaines, pas le reste de `bouncylab.ovh`. L'adresse `mine-explorer.pages.dev` reste joignable : si l'accès est restreint, la règle Cloudflare Access doit couvrir les deux.

## Restreindre l'accès (recommandé pour une version de test)

Par défaut, l'adresse `*.pages.dev` est publique. Pour la réserver à quelques personnes, **Cloudflare Access** (offre Zero Trust, gratuite jusqu'à 50 utilisateurs [PROBABLE]) demande une connexion avant d'ouvrir le site : *Zero Trust → Access → Applications → Add an application → Self-hosted*, domaine du projet Pages, règle « Emails » avec les adresses autorisées (code reçu par e-mail). **Pas encore activé** : à décider par Théo.

## Revenir en arrière

Chaque déploiement reste disponible dans Cloudflare (*Deployments*) : *Rollback to this deployment* remet une version précédente en ligne en quelques secondes. Côté code, on annule le commit fautif sur `main` (`git revert`) et la CI republie.

## Secrets

Aucun secret dans le dépôt. Les deux secrets Cloudflare vivent uniquement dans l'environnement GitHub `production`. Si un jeton fuit : le révoquer dans Cloudflare, en créer un nouveau, mettre à jour le secret.
