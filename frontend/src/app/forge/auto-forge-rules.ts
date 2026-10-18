// Règles pures des filtres de la forge automatique.
import { tierIndex } from '../balance/balance';
import type { WorkshopLevels } from '../balance/workshop';
import { hasAffix, powerDelta } from '../equipment/equipment-rules';
import { EquippedItems, Item, SLOT_IDS, SlotId, STAT_IDS, StatId, TIER_IDS, TierId } from '../equipment/equipment.model';

/**
 * Filtres de la forge automatique. Un critère vide ne filtre rien :
 * aucun emplacement coché = tous les emplacements, aucune stat cochée = toutes les stats.
 */
export interface ForgeFilters {
  readonly slots: readonly SlotId[];
  /** Palier minimum, ou null pour tous les paliers. */
  readonly minTier: TierId | null;
  /** L'objet doit porter au moins une de ces stats en affixe (la Frappe de base de chaque pièce ne compte pas). */
  readonly stats: readonly StatId[];
  /** Ne garder que les objets qui font monter la Puissance par rapport à celui porté. */
  readonly upgradesOnly: boolean;
  /**
   * Qualité à partir de laquelle un objet est toujours proposé, même s'il ne passe pas les autres filtres, ou null.
   * Théo, avec « meilleurs seulement », ne voyait jamais ses objets en or (14/10/2026) : ils étaient vendus d'office.
   */
  readonly keepFromTier: TierId | null;
}

export const NO_FILTERS: ForgeFilters = { slots: [], minTier: null, stats: [], upgradesOnly: false, keepFromTier: null };

export function hasFilters(filters: ForgeFilters): boolean {
  return filters.slots.length > 0 || filters.minTier !== null || filters.stats.length > 0 || filters.upgradesOnly;
  // keepFromTier seul ne filtre rien : il ne fait qu'épargner des objets aux autres filtres
}

/** Vrai si l'objet passe tous les filtres actifs : il sera proposé au joueur au lieu d'être vendu. */
export function passesFilters(item: Item, filters: ForgeFilters, equipped: EquippedItems, levels: WorkshopLevels = {}): boolean {
  if (filters.keepFromTier !== null && tierIndex(item.tier) >= tierIndex(filters.keepFromTier)) {
    return true;
  }
  if (filters.slots.length > 0 && !filters.slots.includes(item.slot)) {
    return false;
  }
  if (filters.minTier !== null && tierIndex(item.tier) < tierIndex(filters.minTier)) {
    return false;
  }
  if (filters.stats.length > 0 && !filters.stats.some((stat) => hasAffix(item, stat))) {
    return false;
  }
  return !filters.upgradesOnly || powerDelta(equipped, item, levels) > 0;
}

export function isValidFilters(value: unknown): value is ForgeFilters {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const { slots, minTier, stats, upgradesOnly, keepFromTier } = value as Record<string, unknown>;
  return (
    // Absent des réglages d'avant le 14/10/2026 : lu comme null
    (keepFromTier === undefined || keepFromTier === null || (TIER_IDS as readonly unknown[]).includes(keepFromTier)) &&
    Array.isArray(slots) &&
    slots.every((slot) => (SLOT_IDS as readonly unknown[]).includes(slot)) &&
    (minTier === null || (TIER_IDS as readonly unknown[]).includes(minTier)) &&
    Array.isArray(stats) &&
    stats.every((stat) => (STAT_IDS as readonly unknown[]).includes(stat)) &&
    typeof upgradesOnly === 'boolean'
  );
}
