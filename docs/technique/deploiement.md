# Déploiement

Retour à [[documentation-technique]].

## Principe

Seul le frontend est mis en ligne : c'est un site statique (HTML, JavaScript, images) servi par **Cloudflare Pages**. Le job `deploy` de la CI le publie à chaque push sur `main` dont les tests passent. Le backend n'est pas déployé tant qu'il n'a pas de rôle (voir [[choix-techniques]]).

Les en-têtes HTTP de sécurité sont dans `frontend/public/_headers`, copié à la racine du build et appliqué par Cloudflare Pages (voir [[securite]]).

## Mise en place (une seule fois)

1. **Créer le projet Cloudflare Pages** : tableau de bord Cloudflare, *Workers & Pages*, *Create*, onglet *Pages*, *Upload assets* (« Direct Upload »). Nom du projet : `mine-explorer`. Il n'est pas relié à GitHub : c'est la CI qui publie.
2. **Créer un jeton d'API** : *My Profile*, *API Tokens*, *Create Token*, modèle *Edit Cloudflare Workers* ou jeton personnalisé avec la seule permission *Account → Cloudflare Pages → Edit*, limité au compte concerné. Le copier une fois.
3. **Relever l'identifiant du compte** : visible sur la page d'accueil du compte (*Account ID*).
4. **Dans GitHub** (*Settings → Environments*) : créer l'environnement `production`, y ajouter
   - les secrets `CLOUDFLARE_API_TOKEN` et `CLOUDFLARE_ACCOUNT_ID` ;
   - la variable `CLOUDFLARE_PROJECT_NAME` = `mine-explorer`.
   Optionnel : limiter l'environnement à la branche `main` (*Deployment branches*).
5. **Fusionner sur `main`** : la CI teste puis publie. L'adresse apparaît dans l'onglet *Actions* (job « Déploiement ») et dans Cloudflare : `https://mine-explorer.pages.dev`.

[PROBABLE] Les intitulés exacts des menus Cloudflare peuvent changer ; les permissions à donner restent celles-ci.

## Restreindre l'accès (recommandé pour une version de test)

Par défaut, l'adresse `*.pages.dev` est publique. Pour la réserver à quelques personnes, **Cloudflare Access** (offre Zero Trust, gratuite jusqu'à 50 utilisateurs [PROBABLE]) demande une connexion avant d'ouvrir le site : *Zero Trust → Access → Applications → Add an application → Self-hosted*, domaine du projet Pages, règle « Emails » avec les adresses autorisées (code reçu par e-mail). **Pas encore activé** : à décider par Théo.

## Revenir en arrière

Chaque déploiement reste disponible dans Cloudflare (*Deployments*) : *Rollback to this deployment* remet une version précédente en ligne en quelques secondes. Côté code, on annule le commit fautif sur `main` (`git revert`) et la CI republie.

## Secrets

Aucun secret dans le dépôt. Les deux secrets Cloudflare vivent uniquement dans l'environnement GitHub `production`. Si un jeton fuit : le révoquer dans Cloudflare, en créer un nouveau, mettre à jour le secret.
