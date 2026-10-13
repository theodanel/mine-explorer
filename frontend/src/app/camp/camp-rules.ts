// Règles pures du Campement : effets des bâtiments, prix, production du puits et validation de la sauvegarde.
import { OFFLINE_CAP_MS } from '../balance/balance';
import {
  BUILDING_IDS,
  BUILDING_MAX_LEVEL,
  BuildingId,
  buildingGoldCost,
  buildingOreCost,
  CampLevels,
  campMaterial,
  TAVERN_EFFICIENCY_STEP,
  WAREHOUSE_CAP_STEP_MS,
  WELL_SHARDS_PER_HOUR,
  WELL_STORAGE_HOURS,
} from '../balance/camp';
import type { TierId } from '../equipment/equipment.model';

const HOUR_MS = 60 * 60 * 1000;

export interface CampState {
  readonly levels: CampLevels;
  /** Dernière récolte du puits (ms epoch), ou null tant qu'il n'est pas construit. */
  readonly wellCollectedAt: number | null;
}

export const EMPTY_CAMP: CampState = { levels: {}, wellCollectedAt: null };

export interface BuildingCost {
  readonly gold: number;
  readonly ores: Readonly<Partial<Record<TierId, number>>>;
}

export function buildingLevel(levels: CampLevels, building: BuildingId): number {
  return levels[building] ?? 0;
}

export function isMaxLevel(levels: CampLevels, building: BuildingId): boolean {
  return buildingLevel(levels, building) >= BUILDING_MAX_LEVEL[building];
}

export function buildingCost(level: number, zone: number): BuildingCost {
  return { gold: buildingGoldCost(level), ores: { [campMaterial(zone)]: buildingOreCost(level) } };
}

/** Rendement hors ligne ajouté par la Taverne. */
export function tavernBonus(levels: CampLevels): number {
  return buildingLevel(levels, 'tavern') * TAVERN_EFFICIENCY_STEP;
}

/** Absence prise en compte au plus, Entrepôt compris. */
export function offlineCapMs(levels: CampLevels): number {
  return OFFLINE_CAP_MS + buildingLevel(levels, 'warehouse') * WAREHOUSE_CAP_STEP_MS;
}

export function wellShardsPerHour(levels: CampLevels): number {
  return buildingLevel(levels, 'well') * WELL_SHARDS_PER_HOUR;
}

/** Éclats prêts à récolter au puits : la production depuis la dernière récolte, plafonnée à 12 h. */
export function wellStock(state: CampState, now: number): number {
  const rate = wellShardsPerHour(state.levels);
  if (rate === 0 || state.wellCollectedAt === null) {
    return 0;
  }
  const hours = Math.min(Math.max(now - state.wellCollectedAt, 0) / HOUR_MS, WELL_STORAGE_HOURS);
  return Math.floor(hours * rate);
}

/**
 * Après une récolte, le puits repart de maintenant ; les fractions d'éclat déjà produites sont gardées
 * pour ne rien perdre en récoltant souvent.
 */
export function collectedAt(state: CampState, now: number, collected: number): number {
  const rate = wellShardsPerHour(state.levels);
  if (rate === 0 || state.wellCollectedAt === null) {
    return now;
  }
  const start = Math.max(state.wellCollectedAt, now - WELL_STORAGE_HOURS * HOUR_MS);
  return start + (collected / rate) * HOUR_MS;
}

export function isValidCampState(value: unknown): value is CampState {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  const { levels, wellCollectedAt } = value as Record<string, unknown>;
  return (
    typeof levels === 'object' &&
    levels !== null &&
    !Array.isArray(levels) &&
    Object.entries(levels).every(
      ([building, level]) =>
        (BUILDING_IDS as readonly string[]).includes(building) &&
        Number.isSafeInteger(level) &&
        (level as number) >= 0 &&
        (level as number) <= BUILDING_MAX_LEVEL[building as BuildingId],
    ) &&
    (wellCollectedAt === null || (typeof wellCollectedAt === 'number' && Number.isFinite(wellCollectedAt) && wellCollectedAt >= 0))
  );
}
