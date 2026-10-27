// Équilibrage de l'Éveil des pièces Divin, le « Divin corrompu » (demande de Théo, 21/10/2026) : une fois tout
// l'équipement en Divin, la Forge et la Forge express redeviennent utiles, puisque les doublons Divin paient l'Éveil.
// Voir docs/game-design/divin-corrompu.md. Fichier pur, simulé par tools/simulate.mts.
import type { SlotId } from '../equipment/equipment.model';
import type { EvolutionId } from './balance';
import type { EssenceId } from './heart-forge';

/** L'Éveil s'ouvre avec la Légende du Cœur du monde, quand l'équipement est déjà presque tout en Divin. */
export const AWAKENING_UNLOCK_FORM: EvolutionId = 'heart';

export const MAX_AWAKENING = 5;

/**
 * Coût d'un palier : des doublons Divin de cette pièce et une ressource du Cœur. Depuis le 27/10/2026, un palier est une
 * phase et se fait dans sa vie : la phase N+1 demande une pièce Divin de la famille N (forgée dans la vie N+1).
 */
export interface AwakeningCost {
  readonly duplicates: number;
  readonly essence: EssenceId;
  readonly essences: number;
}

/**
 * Doublons Divin de la pièce pour passer chaque palier (index 0 : vers l'Éveil 1). En fin de partie, la Forge sort
 * environ 170 Divin par emplacement et par jour (simulateur, régulier) : à 50/150/400/900/1 800, les doublons
 * n'étaient qu'une formalité (Théo, 25/10/2026) ; multipliés par 6, ils freinent les derniers paliers et la Forge reste
 * utile des semaines. La phase 1 passe à 3 000 (27/10/2026) : la vie 1 va jusqu'à la zone 19-20 vers le jour 40 ; les
 * phases suivantes gardent leur coût, la Forge sortant bien plus de Divin dans les vies suivantes.
 */
const DUPLICATE_COSTS = [3000, 900, 2400, 5400, 10800] as const;
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
  };
}

/** Bonus sur toutes les stats de la pièce, par palier (index 0 : Éveil 1) : +40 % à l'Éveil 5. Calé au simulateur. */
const STAT_BONUSES = [0.05, 0.12, 0.2, 0.3, 0.4] as const;

/** Bonus d'un palier, sans multiplicateur de renaissance depuis le 27/10/2026 : c'est la famille des pièces qui grandit. */
export function awakeningStatBonus(level: number): number {
  return level <= 0 ? 0 : STAT_BONUSES[Math.min(level, MAX_AWAKENING) - 1];
}

/** Les paliers 2 et 4 ouvrent chacun une châsse de rune de plus sur l'emplacement. */
export const AWAKENING_SOCKET_LEVELS = [2, 4] as const;

export function awakeningSockets(level: number): number {
  return AWAKENING_SOCKET_LEVELS.filter((needed) => level >= needed).length;
}

/** Panoplie Divin complète : chaque palier d'Éveil de la pièce la moins éveillée ajoute 2 % de Frappe au bonus. */
export const AWAKENING_SET_STRIKE_PER_LEVEL = 0.02;
