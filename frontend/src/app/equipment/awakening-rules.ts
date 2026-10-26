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

/** Équipement avec les stats des pièces éveillées multipliées ; le bonus grandit avec les renaissances. */
export function applyAwakening(equipped: EquippedItems, levels: AwakeningLevels, rebirths = 0): EquippedItems {
  const result: Partial<Record<SlotId, Item>> = {};
  for (const slot of SLOT_IDS) {
    const item = equipped[slot];
    if (item === undefined) {
      continue;
    }
    const bonus = awakeningStatBonus(activeAwakening(equipped, levels, slot), rebirths);
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

/** Palier le plus bas des cinq pièces : c'est lui que suit le bonus de panoplie Divin. */
export function lowestAwakening(equipped: EquippedItems, levels: AwakeningLevels): number {
  return Math.min(...SLOT_IDS.map((slot) => activeAwakening(equipped, levels, slot)));
}

export function recordDuplicate(state: AwakeningState, item: Item): AwakeningState {
  if (!isDivine(item)) {
    return state;
  }
  return { ...state, duplicates: { ...state.duplicates, [item.slot]: (state.duplicates[item.slot] ?? 0) + 1 } };
}

/** Des doublons de plus sur chaque emplacement (outils de test). */
export function addDuplicates(state: AwakeningState, amount: number): AwakeningState {
  return { ...state, duplicates: Object.fromEntries(SLOT_IDS.map((slot) => [slot, (state.duplicates[slot] ?? 0) + amount])) };
}

/** Ce qui manque pour éveiller la pièce portée, ou null si c'est possible. */
export type AwakeningBlocker = 'not-divine' | 'max' | 'rebirths' | 'duplicates' | 'essences';

export function awakeningBlocker(
  state: AwakeningState,
  item: Item | undefined,
  essencesOwned: number,
  rebirths = 0,
): AwakeningBlocker | null {
  if (!isDivine(item)) {
    return 'not-divine';
  }
  const cost = awakeningCost(item.slot, state.levels[item.slot] ?? 0);
  if (cost === null) {
    return 'max';
  }
  if (rebirths < cost.rebirths) {
    return 'rebirths';
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
  return {
    levels: { ...state.levels, [slot]: level + 1 },
    duplicates: { ...state.duplicates, [slot]: (state.duplicates[slot] ?? 0) - cost.duplicates },
  };
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
