# Musiques des zones

Demande de Théo, 16/10/2026 : une musique par zone, qui colle à l'ambiance de son décor. Chaque boucle est calculée par le code (`audio/zone-music.ts`), sans fichier audio ni dépendance, comme les bruitages.

## Comment ça joue

- La musique suit la zone affichée : en changeant de zone, ou en revenant miner dans une zone passée, la nouvelle boucle prend le relais en fondu de 2 secondes.
- Chaque boucle se calcule la première fois qu'on entre dans la zone (une fraction de seconde), puis reste en mémoire pour la partie.
- Au-delà de la zone 20, on garde la musique du Cœur du monde.
- Le volume de la musique se règle toujours dans Profil, à part des bruitages.

## Les 20 ambiances

Chaque zone combine une tonalité (tonique et gamme), une suite de 8 accords au tempo de la zone, une nappe, un instrument de mélodie (avec écho), une percussion douce et parfois un bourdon grave. Les notes de la mélodie sont tirées au hasard, mais toujours les mêmes d'une partie à l'autre.

| Zone | Ambiance | Tonalité | Boucle | Nappe | Mélodie | Percussion | Bourdon |
|---|---|---|---|---|---|---|---|
| 1. Galerie des racines | terre chaude, calme, petites notes boisées | ré dorien | 32 s | chaude | notes pincées | — | non |
| 2. Carrière de pierre | régulière, coups de pioche lointains | la mineur | 32 s | douce | notes pincées | coups de pioche | non |
| 3. Veines de cuivre | enjouée, chaude, qui sautille | mi mixolydien | 24 s | chaude | notes pincées | coups de pioche | non |
| 4. Mine de fer | sombre et martelée, une enclume au loin | do mineur | 32 s | douce | notes pincées | enclume | oui |
| 5. Forge naine | fière, au pas, tambours et enclume | sol mineur | 24 s | cuivrée | notes pincées | tambour | non |
| 6. Caverne d'or | scintillante, des clochettes partout | fa lydien | 32 s | douce | cloches | — | non |
| 7. Ruines elfiques | aérienne, une flûte et des arpèges de harpe | mi mineur | 32 s | chœur | flûte | — | non |
| 8. Grotte de cristal | verre et longs échos | si lydien | 40 s | douce | verre | gouttes d'eau | non |
| 9. Caverne de magma | grondante et lente, la terre qui bat | do phrygien | 32 s | cuivrée | notes pincées | battement de cœur | oui |
| 10. Sanctuaire divin | lumineux, un chœur et des cloches | ré majeur | 40 s | chœur | cloches | — | non |
| 11. Forêt souterraine | paisible, des gouttes et des notes de bois | sol majeur | 32 s | chaude | notes pincées | gouttes d'eau | non |
| 12. Lac gelé | froide et clairsemée, du verre sur la glace | fa# mineur | 40 s | douce | verre | — | oui |
| 13. Cité naine engloutie | profonde, bulles et gouttes | la# dorien | 40 s | chœur | cloches | gouttes d'eau | oui |
| 14. Grotte d'obsidienne | sombre et tranchante | la phrygien | 24 s | douce | notes pincées | coups de pioche | oui |
| 15. Jardin de cristaux | féerique, des arpèges qui scintillent | mi lydien | 32 s | douce | verre | — | non |
| 16. Nid de dragon | menaçante, gros tambours et cuivres | ré mineur harmonique | 24 s | cuivrée | notes pincées | tambour | oui |
| 17. Ruines anciennes | mystérieuse, une cloche qui résonne | do dorien | 40 s | chœur | cloches | — | oui |
| 18. Abysses | presque silencieuse, un bourdon et des appels lointains | fa phrygien | 40 s | douce | flûte | battement de cœur | oui |
| 19. Royaume des fées | vive et légère, des arpèges qui virevoltent | la lydien | 24 s | douce | cloches | coups de pioche | non |
| 20. Cœur du monde | épique, un cœur qui bat sous un grand chœur | mi mineur | 32 s | chœur | flûte | battement de cœur | oui |

## Écouter hors du jeu

`node --import ./tools/register-ts.mjs tools/export-sounds.mts <dossier>` écrit une `musique-zone-NN.wav` par zone, à côté des bruitages.
