// Règles pures de l'Atelier : effet des niveaux sur les stats, prix du niveau suivant, sauvegarde.
import {
  WORKSHOP_MAX_LEVEL,
  WORKSHOP_STEP,
  workshopGoldCost,
  type WorkshopLevels,
  workshopMaterial,
  workshopOreCost,
} from '../balance/workshop';
import { BASE_STATS, STAT_CAPS } from '../balance/balance';
import { type EquippedItems, type MiningStats, SLOT_IDS, type SlotId, STAT_IDS, TIER_IDS, type TierId } from '../equipment/equipment.model';
import type { OreCost } from '../ores/ores';

export interface WorkshopCost {
  readonly gold: number;
  readonly ores: OreCost;
}

export function pieceLevel(levels: WorkshopLevels, slot: SlotId, tier: TierId): number {
  return levels[slot]?.[tier] ?? 0;
}

/** Les mêmes niveaux, avec une pièce montée d'un niveau. */
export function withLevel(levels: WorkshopLevels, slot: SlotId, tier: TierId, level: number): WorkshopLevels {
  return { ...levels, [slot]: { ...levels[slot], [tier]: level } };
}

/** Multiplicateur que l'Atelier applique à la stat d'Atelier de l'emplacement (celle de SLOTS). */
export function slotMultiplier(level: number): number {
  return 1 + WORKSHOP_STEP * level;
}

/**
 * Stats renforcées : chaque pièce portée renforce TOUTES ses stats (Frappe de base et affixes), selon le niveau
 * atteint dans SA qualité (demande de Théo, 16/10/2026 ; avant, seule la stat d'Atelier de l'emplacement montait).
 * Changer de qualité change donc de niveau ; un emplacement vide n'a pas de bonus. La Frappe ajoutée suit le même
 * multiplicateur que celle des pièces (évolution du mineur), et les plafonds de stats restent appliqués.
 */
export function reinforce(stats: MiningStats, levels: WorkshopLevels, equipped: EquippedItems): MiningStats {
  const next = { ...stats };
  let rawStrike = BASE_STATS.strikePower;
  for (const slot of SLOT_IDS) {
    rawStrike += equipped[slot]?.stats.strikePower ?? 0;
  }
  // Part de la Frappe brute que garde la Frappe totale : le bonus d'évolution, appliqué avant l'Atelier
  const strikeScale = rawStrike > 0 ? stats.strikePower / rawStrike : 1;
  for (const slot of SLOT_IDS) {
    const item = equipped[slot];
    if (item === undefined) {
      continue;
    }
    const extra = slotMultiplier(pieceLevel(levels, slot, item.tier)) - 1;
    for (const stat of STAT_IDS) {
      const value = item.stats[stat] ?? 0;
      next[stat] += value * extra * (stat === 'strikePower' ? strikeScale : 1);
    }
  }
  for (const stat of STAT_IDS) {
    const cap = STAT_CAPS[stat];
    if (cap !== undefined) {
      next[stat] = Math.min(next[stat], cap);
    }
  }
  return next;
}

/** Prix du prochain niveau d'une pièce de cette qualité, ou null si elle est au maximum. */
export function upgradeCost(tier: TierId, level: number): WorkshopCost | null {
  if (level >= WORKSHOP_MAX_LEVEL) {
    return null;
  }
  const material = workshopMaterial(tier);
  return { gold: workshopGoldCost(tier, level), ores: material === null ? {} : { [material]: workshopOreCost(level) } };
}

export function isValidLevels(value: unknown): value is WorkshopLevels {
  if (!isPlainObject(value)) {
    return false;
  }
  return Object.entries(value).every(
    ([slot, tiers]) =>
      (SLOT_IDS as readonly string[]).includes(slot) &&
      isPlainObject(tiers) &&
      Object.entries(tiers).every(
        ([tier, level]) =>
          (TIER_IDS as readonly string[]).includes(tier) &&
          Number.isSafeInteger(level) &&
          (level as number) >= 0 &&
          (level as number) <= WORKSHOP_MAX_LEVEL,
      ),
  );
}

/**
 * Ancienne sauvegarde (avant le 14/10/2026) : un niveau par emplacement, valable pour toutes les qualités.
 * Le niveau passe à la qualité de la pièce portée, plafonné à 50 ; un emplacement vide le perd.
 */
export function migrateSlotLevels(value: unknown, equipped: EquippedItems): WorkshopLevels | null {
  if (!isPlainObject(value)) {
    return null;
  }
  const entries = Object.entries(value);
  const isLegacy = entries.every(
    ([slot, level]) => (SLOT_IDS as readonly string[]).includes(slot) && Number.isSafeInteger(level) && (level as number) >= 0,
  );
  if (!isLegacy) {
    return null;
  }
  let levels: WorkshopLevels = {};
  for (const [slot, level] of entries as [SlotId, number][]) {
    const item = equipped[slot];
    if (item !== undefined && level > 0) {
      levels = withLevel(levels, slot, item.tier, Math.min(level, WORKSHOP_MAX_LEVEL));
    }
  }
  return levels;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
