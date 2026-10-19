// Règles pures du passe de progression : les paliers atteints se lisent dans la progression de la mine.
import { STAGES_PER_ZONE } from '../balance/balance';
import { PASS_TIER_COUNT, PASS_TIERS, PassTier, ROCKS_PER_PASS_TIER } from '../balance/progress-pass';

export interface PassState {
  /** Paliers déjà récupérés, toujours dans l'ordre : les 3 premiers, puis le 4e… */
  readonly claimed: number;
}

export const EMPTY_PASS: PassState = { claimed: 0 };

/** Filons épuisés depuis le début : en 2-1, les 15 de la zone 1. */
export function rocksBroken(zone: number, stage: number): number {
  return (zone - 1) * STAGES_PER_ZONE + stage - 1;
}

/** Paliers atteints, d'après la progression de la mine. */
export function reachedTiers(zone: number, stage: number): number {
  return Math.min(Math.floor(rocksBroken(zone, stage) / ROCKS_PER_PASS_TIER), PASS_TIER_COUNT);
}

/** Paliers atteints mais pas encore récupérés. */
export function claimableTiers(state: PassState, zone: number, stage: number): readonly PassTier[] {
  return PASS_TIERS.slice(state.claimed, reachedTiers(zone, stage));
}

/** Prochain palier à atteindre, ou null quand le passe est fini. */
export function nextTier(zone: number, stage: number): PassTier | null {
  return PASS_TIERS[reachedTiers(zone, stage)] ?? null;
}

export function isValidPassState(value: unknown): value is PassState {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const { claimed } = value as Record<string, unknown>;
  return Number.isSafeInteger(claimed) && (claimed as number) >= 0 && (claimed as number) <= PASS_TIER_COUNT;
}
