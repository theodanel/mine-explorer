import { removeStorage, writeStorage } from '../shared/local-storage';
import type { RebirthEffects } from './rebirth-rules';

/**
 * Clés de la « vie » qui repartent de zéro en renaissant : elles retrouvent leur valeur de départ au rechargement.
 * Tout le reste (évolution, artefacts, compagnons, runes, Éveil, succès, Puits…) est gardé. Depuis le 26/10/2026
 * (choix de Théo), l'Atelier, les compétences et les minerais sont gardés aussi : leurs progrès durent d'une vie à
 * l'autre, et retourner chercher du minerai dans les anciennes zones garde un intérêt.
 */
const LIFE_KEYS_REMOVED = [
  'mine-explorer.camp',
  'mine-explorer.farm',
  'mine-explorer.guardian-blocked',
  'mine-explorer.gallery',
] as const;

/**
 * Écrit la nouvelle vie dans la sauvegarde : zone et pioche de départ de l'arbre des Braises, équipement vide, part
 * d'or gardée. La page se recharge ensuite, pour que chaque service reparte proprement de sa sauvegarde.
 */
export function writeNewLife(effects: RebirthEffects, gold: number): void {
  writeStorage('mine-explorer.progress', JSON.stringify({ zone: effects.startZone, stage: 1, damage: 0 }));
  writeStorage('mine-explorer.pickaxe', JSON.stringify({ level: effects.startPickaxe, segments: 0, upgradeEndsAt: null }));
  writeStorage('mine-explorer.equipment', JSON.stringify({ equipped: {}, pending: null }));
  writeStorage('mine-explorer.coins', String(Math.floor(gold * effects.goldKept)));
  for (const key of LIFE_KEYS_REMOVED) {
    removeStorage(key);
  }
}
