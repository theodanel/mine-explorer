# Forge express

Aventure du Maître des profondeurs, validée par Théo le 14/10/2026 : un mini-jeu de rythme à l'enclume.

## Règles

- **3 parties par jour**, dès le Maître des profondeurs. Une partie compte pour la mission du jour « Joue une aventure ».
- **10 frappes** : la chaleur du lingot monte et descend en continu, et on frappe quand l'aiguille passe dans la zone dorée. L'aller-retour dure 1,6 s au départ, puis 6 % de moins à chaque frappe.
- **Notes** (écart au centre de la jauge) :
  - parfait (±5 %) : 3 points ;
  - bien (±12 %) : 2 points ;
  - juste (±22 %) : 1 point ;
  - raté : 0, et le combo retombe.
- **Combo** : chaque frappe parfaite qui suit une autre parfaite ajoute 1 point.
- **Objet bonus**, qui attend sur la mine comme un objet forgé (équiper ou vendre) :
  - score de 20 ou plus : la meilleure qualité que la forge peut sortir au niveau de pioche du joueur ;
  - 32 ou plus : une qualité au-dessus ;
  - en dessous : un tirage de forge normal.
- **Une seule place** : si un objet attend déjà, il faut d'abord le ranger.

## Technique

- **Fichiers** :
  - chiffres dans `balance/forge-express.ts` ;
  - moteur pur dans `forge-express/forge-express-game.ts` (chaleur, notes, combo) ;
  - service `forge-express.ts` (clé `mine-explorer.forge-express`) ;
  - page `forge-express-page/`.
- **`Inventory.receive`** pose l'objet gagné en attente.
- **`rollItem`** accepte une qualité imposée.
- **Animations** : le marteau s'abat, des étincelles jaillissent, la note s'envole, et la lueur du lingot suit la chaleur.
- **Visuels provisoires** : la pioche tient lieu de marteau, et le lingot est en CSS, en attendant les images Gemini ([[aventures-prompts]]).
