# Politique de sécurité

## Signaler une faille

Merci de **ne pas ouvrir d'issue publique** pour une faille de sécurité. Écris à **contact@bouncylab.ovh** en indiquant :

- ce que tu as trouvé et où (page du jeu, route de l'API, fichier) ;
- comment le reproduire ;
- l'impact que tu envisages (accès à la partie ou au compte d'un autre joueur, triche au classement, fuite de données…).

Tu reçois une réponse sous quelques jours. La faille est corrigée en priorité, puis tu es crédité si tu le souhaites.

## Périmètre

| Dans le périmètre | Hors périmètre |
|---|---|
| Le jeu, `https://mine.bouncylab.ovh` | Les attaques par déni de service ou par volume |
| L'API, `https://api.bouncylab.ovh` | L'ingénierie sociale, l'accès physique |
| Le code de ce dépôt | Les services tiers (Google, Cloudflare, GitHub) |
| | La triche dans sa propre partie locale : le jeu tourne dans le navigateur, seul le classement est protégé |

Merci de tester uniquement avec ton propre compte, et de ne jamais lire ni modifier les données d'un autre joueur.

## Versions maintenues

Seule la version en ligne, construite depuis la branche `main`, reçoit les correctifs.

## Ce qui protège le projet

Modèle de menace et protections : [docs/technique/securite.md](docs/technique/securite.md). Audits : [docs/technique/audit-securite-backend.md](docs/technique/audit-securite-backend.md) (serveur) et [docs/technique/audit-depot.md](docs/technique/audit-depot.md) (secrets et infrastructure).
