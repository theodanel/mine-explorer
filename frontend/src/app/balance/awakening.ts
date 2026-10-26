// Équilibrage de l'Éveil des pièces Divin, le « Divin corrompu » (demande de Théo, 21/10/2026) : une fois tout
// l'équipement en Divin, la Forge et la Forge express redeviennent utiles, puisque les doublons Divin paient l'Éveil.
// Voir docs/game-design/divin-corrompu.md. Fichier pur, simulé par tools/simulate.mts.
import type { SlotId } from '../equipment/equipment.model';
import type { EvolutionId } from './balance';
import type { EssenceId } from './heart-forge';
import { rebirthHardness } from './rebirth';

/** L'Éveil s'ouvre avec la Légende du Cœur du monde, quand l'équipement est déjà presque tout en Divin. */
export const AWAKENING_UNLOCK_FORM: EvolutionId = 'heart';

export const MAX_AWAKENING = 5;

/** Coût d'un palier : des doublons Divin de cette pièce, une ressource du Cœur et des renaissances déjà faites. */
export interface AwakeningCost {
  readonly duplicates: number;
  readonly essence: EssenceId;
  readonly essences: number;
  readonly rebirths: number;
}

/**
 * Renaissances déjà faites pour atteindre chaque palier (idée de Théo, 26/10/2026) : l'Éveil 1 se fait dans la
 * première vie, puis chaque renaissance débloque le palier suivant. Le Divin corrompu avance de vie en vie.
 */
const REBIRTHS_NEEDED = [0, 1, 2, 3, 4] as const;

/**
 * Doublons Divin de la pièce pour passer chaque palier (index 0 : vers l'Éveil 1). En fin de partie, la Forge sort
 * environ 170 Divin par emplacement et par jour (simulateur, régulier) : à 50/150/400/900/1 800, les doublons
 * n'étaient qu'une formalité (Théo, 25/10/2026) ; multipliés par 6, ils freinent les derniers paliers et la Forge reste
 * utile des semaines (Éveil 5 des 5 pièces vers le jour 137 au lieu de 129).
 */
const DUPLICATE_COSTS = [300, 900, 2400, 5400, 10800] as const;
/** Ressources du Cœur pour chaque palier : le gros du temps de fin de partie, avec les runes. */
const ESSENCE_COSTS = [25, 60, 120, 220, 375] as const;

/** La ressource que réclame chaque pièce : celle de l'élément de son esprit (Braise pour la pioche…). */
export const AWAKENING_ESSENCE: Readonly<Record<SlotId, EssenceId>> = {
  pickaxe: 'ember',
  gloves: 'frost',
  helmet: 'mist',
  boots: 'sap',
  bag: 'dawn',
};

/** Coût du palier suivant `level` (0 à 4), ou null au maximum. */
export function awakeningCost(slot: SlotId, level: number): AwakeningCost | null {
  if (level < 0 || level >= MAX_AWAKENING) {
    return null;
  }
  return {
    duplicates: DUPLICATE_COSTS[level],
    essence: AWAKENING_ESSENCE[slot],
    essences: ESSENCE_COSTS[level],
    rebirths: REBIRTHS_NEEDED[level],
  };
}

/** Bonus sur toutes les stats de la pièce, par palier (index 0 : Éveil 1) : +40 % à l'Éveil 5. Calé au simulateur. */
const STAT_BONUSES = [0.05, 0.12, 0.2, 0.3, 0.4] as const;

/**
 * Bonus d'un palier, qui grandit avec les renaissances comme la dureté des filons (Théo, 26/10/2026 : « plus tu
 * renais, plus les zones sont dures ») : ×1,3 par renaissance, le Divin corrompu suit la difficulté.
 */
export function awakeningStatBonus(level: number, rebirths = 0): number {
  return level <= 0 ? 0 : STAT_BONUSES[Math.min(level, MAX_AWAKENING) - 1] * rebirthHardness(rebirths);
}

/** Les paliers 2 et 4 ouvrent chacun une châsse de rune de plus sur l'emplacement. */
export const AWAKENING_SOCKET_LEVELS = [2, 4] as const;

export function awakeningSockets(level: number): number {
  return AWAKENING_SOCKET_LEVELS.filter((needed) => level >= needed).length;
}

/** Panoplie Divin complète : chaque palier d'Éveil de la pièce la moins éveillée ajoute 2 % de Frappe au bonus. */
export const AWAKENING_SET_STRIKE_PER_LEVEL = 0.02;
