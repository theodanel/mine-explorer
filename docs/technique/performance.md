# Performance du front

Passe d'optimisation demandée par Théo le 17/10/2026 : un jeu léger et fluide sur téléphone.

## Chargement

Mesuré au lancement d'une nouvelle partie (images et sons préchargés par l'écran de chargement, build de production) :

| | Avant | Après |
|---|---|---|
| Images au lancement | 8,0 Mo | 2,1 Mo |
| Spritesheet de l'Apprenti | 4,6 Mo (PNG) | 0,9 Mo (WebP) |
| Toutes les images en PNG du dépôt (87) | 7,8 Mo | 1,6 Mo en WebP |

- **Plus aucun PNG dans `public/assets`** : tout est en WebP qualité 90 (transparence comprise). Les scripts de `art-source/` écrivent du WebP, y compris `miner/chroma_key_pipeline.py` pour le spritesheet de l'Apprenti.
- **L'Apprenti n'est plus chargé pour rien** : il ne sert de cadence invisible qu'aux formes en image fixe. Un joueur évolué ne télécharge que l'animation de sa forme (`cadenceStrike` et `bodyAssetUrls` dans `loading/game-assets.ts`).

## Cache

- Les fichiers du build Angular (`*.js`, `*.css`, polices dans `media/`) portent une empreinte de leur contenu : cache d'un an, `immutable`.
- Les images et sons de `assets/` gardent leur nom quand on les remplace : cache d'un jour puis revérification (`stale-while-revalidate` une semaine). Avant, ils étaient `immutable` 30 jours : un visuel refait pouvait rester invisible un mois.
- Mêmes règles dans `public/_headers` (Cloudflare Pages) et `frontend/nginx.conf` (Docker, Coolify).

## Fluidité : le son hors du fil principal

Les bruitages et les musiques du jeu sont calculés en code (aucun fichier audio). Ce calcul figeait le jeu : environ 0,13 s pour les 12 bruitages au premier toucher et 0,13 s par musique de zone sur ordinateur, plusieurs fois plus sur téléphone.

- Les deux passent maintenant par un Web Worker (`audio/audio.worker.ts`, piloté par `audio/audio-renderer.ts`) : le jeu continue de tourner pendant le calcul, et le tampon revient sans copie.
- Mesuré dans Chrome au premier toucher (tâche longue la plus lourde du fil principal) : 668 ms → 60 à 75 ms. Le changement de zone ne fige plus du tout.
- Sans Worker (vieux navigateur, tests), le calcul se fait sur le fil principal comme avant. La CSP autorise déjà `worker-src 'self'`.
