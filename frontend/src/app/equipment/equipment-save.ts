import { EquippedItems, Item, SLOT_IDS, STAT_IDS, SlotId, StatId, TIER_IDS, TierId } from './equipment.model';

export interface EquipmentSave {
  readonly equipped: EquippedItems;
  /** Objet sorti de la Forge, en attente d'être équipé ou vendu. */
  readonly pending: Item | null;
}

export const EMPTY_SAVE: EquipmentSave = { equipped: {}, pending: null };

/**
 * Relit une sauvegarde JSON. localStorage est modifiable à la main :
 * tout ce qui ne correspond pas exactement au format attendu est rejeté.
 */
export function parseEquipmentSave(raw: string): EquipmentSave | null {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    // JSON illisible : l'appelant le signale et repart d'une sauvegarde vide
    return null;
  }
  if (!isRecord(data) || !isRecord(data['equipped'])) {
    return null;
  }
  const equipped: Partial<Record<SlotId, Item>> = {};
  for (const [slot, value] of Object.entries(data['equipped'])) {
    if (!isSlotId(slot) || !isItem(value) || value.slot !== slot) {
      return null;
    }
    equipped[slot] = value;
  }
  const pending = data['pending'];
  if (pending !== null && !isItem(pending)) {
    return null;
  }
  return { equipped, pending };
}

function isItem(value: unknown): value is Item {
  return (
    isRecord(value) &&
    typeof value['id'] === 'string' &&
    isSlotId(value['slot']) &&
    isTier(value['tier']) &&
    Number.isSafeInteger(value['level']) &&
    (value['level'] as number) >= 1 &&
    (value['rebirth'] === undefined || (Number.isSafeInteger(value['rebirth']) && (value['rebirth'] as number) >= 0)) &&
    (value['family'] === undefined || (Number.isSafeInteger(value['family']) && (value['family'] as number) >= 0)) &&
    isStats(value['stats'])
  );
}

function isStats(value: unknown): boolean {
  return (
    isRecord(value) &&
    Object.entries(value).every(
      ([stat, amount]) => isStatId(stat) && typeof amount === 'number' && Number.isFinite(amount) && amount >= 0,
    )
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSlotId(value: unknown): value is SlotId {
  return (SLOT_IDS as readonly unknown[]).includes(value);
}

function isTier(value: unknown): value is TierId {
  return (TIER_IDS as readonly unknown[]).includes(value);
}

function isStatId(value: unknown): value is StatId {
  return (STAT_IDS as readonly unknown[]).includes(value);
}
