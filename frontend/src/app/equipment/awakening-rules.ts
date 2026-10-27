// Règles pures de l'Éveil (le « Divin corrompu ») : l'Éveil appartient à l'emplacement, comme les runes serties. On
// éveille une pièce Divin, mais l'Éveil compte ensuite sur toute pièce portée à cet emplacement (26/10/2026) : après une
// renaissance, la première pièce forgée en profite déjà, et une pièce Divin reforgée est aussitôt corrompue.
import { awakeningCost, awakeningStatBonus, MAX_AWAKENING } from '../balance/awakening';
import { EquippedItems, Item, MiningStats, SLOT_IDS, SlotId, STAT_IDS } from './equipment.model';

/** Palier d'Éveil de chaque emplacement (0 à 5). */
export type AwakeningLevels = Readonly<Partial<Record<SlotId, number>>>;

export interface AwakeningState {
  readonly levels: AwakeningLevels;
  /** Doublons Divin mis de côté pour chaque emplacement : chaque pièce Divin vendue en ajoute un. */
  readonly duplicates: Readonly<Partial<Record<SlotId, number>>>;
}

export const EMPTY_AWAKENING: AwakeningState = { levels: {}, duplicates: {} };

export function isDivine(item: Item | undefined | null): item is Item {
  return item?.tier === 'divine';
}

/** Palier qui compte vraiment : celui de l'emplacement, dès qu'une pièce y est portée. */
export function activeAwakening(equipped: EquippedItems, levels: AwakeningLevels, slot: SlotId): number {
  return equipped[slot] === undefined ? 0 : (levels[slot] ?? 0);
}

/** Équipement avec les stats des pièces éveillées multipliées. */
export function applyAwakening(equipped: EquippedItems, levels: AwakeningLevels): EquippedItems {
  const result: Partial<Record<SlotId, Item>> = {};
  for (const slot of SLOT_IDS) {
    const item = equipped[slot];
    if (item === undefined) {
      continue;
    }
    const bonus = awakeningStatBonus(activeAwakening(equipped, levels, slot));
    result[slot] = bonus === 0 ? item : { ...item, stats: scaledStats(item.stats, 1 + bonus) };
  }
  return result;
}

function scaledStats(stats: Item['stats'], factor: number): Partial<MiningStats> {
  const scaled: Partial<MiningStats> = {};
  for (const stat of STAT_IDS) {
    const value = stats[stat];
    if (value !== undefined) {
      scaled[stat] = value * factor;
    }
  }
  return scaled;
}

/** Phase du Divin corrompu : le palier le plus bas des cinq emplacements, pièces portées ou non. */
export function corruptionPhase(levels: AwakeningLevels): number {
  return Math.min(...SLOT_IDS.map((slot) => levels[slot] ?? 0));
}

/** Palier le plus bas des cinq pièces : c'est lui que suit le bonus de panoplie Divin. */
export function lowestAwakening(equipped: EquippedItems, levels: AwakeningLevels): number {
  return Math.min(...SLOT_IDS.map((slot) => activeAwakening(equipped, levels, slot)));
}

/**
 * Une pièce Divin vendue devient un doublon de son emplacement, si elle est de la famille de la phase à venir sur cet
 * emplacement : seuls les Divin de la famille en cours paient la phase suivante.
 */
export function recordDuplicate(state: AwakeningState, item: Item): AwakeningState {
  if (!isDivine(item) || (item.family ?? 0) !== (state.levels[item.slot] ?? 0)) {
    return state;
  }
  return { ...state, duplicates: { ...state.duplicates, [item.slot]: (state.duplicates[item.slot] ?? 0) + 1 } };
}

/** Des doublons de plus sur chaque emplacement (outils de test). */
export function addDuplicates(state: AwakeningState, amount: number): AwakeningState {
  return { ...state, duplicates: Object.fromEntries(SLOT_IDS.map((slot) => [slot, (state.duplicates[slot] ?? 0) + amount])) };
}

/** Ce qui manque pour éveiller la pièce portée, ou null si c'est possible. */
export type AwakeningBlocker = 'not-divine' | 'max' | 'family' | 'duplicates' | 'essences';

export function awakeningBlocker(state: AwakeningState, item: Item | undefined, essencesOwned: number): AwakeningBlocker | null {
  if (!isDivine(item)) {
    return 'not-divine';
  }
  const level = state.levels[item.slot] ?? 0;
  const cost = awakeningCost(item.slot, level);
  if (cost === null) {
    return 'max';
  }
  // La phase suivante se fait avec le Divin de la famille de cette vie
  if ((item.family ?? 0) !== level) {
    return 'family';
  }
  if ((state.duplicates[item.slot] ?? 0) < cost.duplicates) {
    return 'duplicates';
  }
  return essencesOwned < cost.essences ? 'essences' : null;
}

/** Monte l'emplacement d'un palier et paie ses doublons ; les ressources du Cœur se paient à la Forge du Cœur. */
export function awaken(state: AwakeningState, slot: SlotId): AwakeningState {
  const level = state.levels[slot] ?? 0;
  const cost = awakeningCost(slot, level);
  if (cost === null) {
    return state;
  }
  // Les doublons en trop sont d'une famille passée : ils ne paieront pas la phase suivante
  return { levels: { ...state.levels, [slot]: level + 1 }, duplicates: { ...state.duplicates, [slot]: 0 } };
}

/** Lecture d'une sauvegarde : null si elle est abîmée. */
export function parseAwakening(raw: string): AwakeningState | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) {
      return null;
    }
    const { levels, duplicates } = value as Record<string, unknown>;
    if (!isSlotNumbers(levels, MAX_AWAKENING) || !isSlotNumbers(duplicates, Number.MAX_SAFE_INTEGER)) {
      return null;
    }
    return { levels, duplicates };
  } catch {
    return null;
  }
}

function isSlotNumbers(value: unknown, max: number): value is Partial<Record<SlotId, number>> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  return Object.entries(value).every(
    ([slot, amount]) => (SLOT_IDS as readonly string[]).includes(slot) && Number.isInteger(amount) && amount >= 0 && amount <= max,
  );
}
