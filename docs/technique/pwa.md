# Application installable (PWA)

Demande de Théo (17/10/2026) : avoir une icône du jeu sur l'écran d'accueil du téléphone.

- `frontend/public/manifest.webmanifest` : nom, icônes, ouverture en plein écran (`fullscreen`, avec repli `standalone`), portrait, couleurs du fond du jeu.
- `frontend/src/index.html` : lien vers le manifeste, `apple-touch-icon` et balises iOS (barre d'état noire, titre).
- Icônes : `frontend/public/icons/`, recadrées sur le mineur de l'écran de lancement par `art-source/ui/preparer-icones.py`. En PNG, seul format accepté par l'écran d'accueil de l'iPhone. La version « maskable » garde la tête du mineur dans les 80 % centraux qu'Android ne rogne jamais.

## Installer le jeu

- **iPhone (Safari)** : bouton Partager, puis « Sur l'écran d'accueil ».
- **Android (Chrome)** : menu ⋮, puis « Installer l'application » ou « Ajouter à l'écran d'accueil ».

## Pas de service worker (choix du 17/10/2026)

Le jeu s'installe sans service worker : la nouvelle version arrive à chaque ouverture, sans risque de servir une ancienne version après un déploiement. Un service worker (`@angular/service-worker`, nouvelle dépendance) n'apporterait que le jeu hors ligne et un démarrage un peu plus rapide ; il demanderait de gérer les mises à jour (prévenir le joueur, recharger).

La CSP autorise déjà `manifest-src 'self'`.
