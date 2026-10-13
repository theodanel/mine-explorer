// Règles pures de l'Atelier : effet des niveaux sur les stats et prix du niveau suivant.
import { workshopGoldCost, type WorkshopLevels, workshopMaterial, workshopOreCost, WORKSHOP_STEP } from '../balance/workshop';
import { type MiningStats, SLOT_IDS, type SlotId, SLOTS } from '../equipment/equipment.model';
import type { OreCost } from '../ores/ores';

export interface WorkshopCost {
  readonly gold: number;
  readonly ores: OreCost;
}

export function slotLevel(levels: WorkshopLevels, slot: SlotId): number {
  return levels[slot] ?? 0;
}

/** Multiplicateur que l'Atelier applique à la stat principale de l'emplacement. */
export function slotMultiplier(level: number): number {
  return 1 + WORKSHOP_STEP * level;
}

/** Stats renforcées : chaque emplacement multiplie sa stat principale, quel que soit l'objet porté. */
export function reinforce(stats: MiningStats, levels: WorkshopLevels): MiningStats {
  const next = { ...stats };
  for (const slot of SLOT_IDS) {
    const stat = SLOTS[slot].mainStat;
    next[stat] *= slotMultiplier(slotLevel(levels, slot));
  }
  return next;
}

/** Prix du prochain niveau d'un emplacement, selon la zone en cours (elle fixe le minerai demandé). */
export function upgradeCost(level: number, zone: number): WorkshopCost {
  return { gold: workshopGoldCost(level), ores: { [workshopMaterial(zone)]: workshopOreCost(level) } };
}

export function isValidLevels(value: unknown): value is WorkshopLevels {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  return Object.entries(value).every(
    ([slot, level]) => (SLOT_IDS as readonly string[]).includes(slot) && Number.isSafeInteger(level) && (level as number) >= 0,
  );
}
