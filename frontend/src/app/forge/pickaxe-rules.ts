// Règles pures de la pioche : segments payés en or, puis minuteur d'amélioration.
import { MAX_PICKAXE_LEVEL, SEGMENTS_PER_LEVEL, upgradeDurationMs, upgradeShortcutMs } from '../balance/balance';

export interface PickaxeState {
  readonly level: number;
  /** Segments payés vers le niveau suivant, de 0 à SEGMENTS_PER_LEVEL. */
  readonly segments: number;
  /** Fin de l'amélioration en cours (horodatage ms), ou null. Les 10 segments restent pleins pendant ce temps. */
  readonly upgradeEndsAt: number | null;
}

export const START_PICKAXE: PickaxeState = { level: 1, segments: 0, upgradeEndsAt: null };

export function isUpgrading(state: PickaxeState): boolean {
  return state.upgradeEndsAt !== null;
}

/** Vrai si un segment peut être payé : ni niveau maximum, ni amélioration en cours. */
export function canBuySegment(state: PickaxeState): boolean {
  return state.level < MAX_PICKAXE_LEVEL && !isUpgrading(state) && state.segments < SEGMENTS_PER_LEVEL;
}

/** Ajoute un segment payé. Le dixième lance le minuteur d'amélioration. */
export function addSegment(state: PickaxeState, now: number): PickaxeState {
  if (!canBuySegment(state)) {
    return state;
  }
  const segments = state.segments + 1;
  const upgradeEndsAt = segments === SEGMENTS_PER_LEVEL ? now + upgradeDurationMs(state.level) : null;
  return { ...state, segments, upgradeEndsAt };
}

/** Termine l'amélioration si son minuteur est écoulé, y compris pendant que le jeu était fermé. */
export function completeUpgrade(state: PickaxeState, now: number): PickaxeState {
  if (state.upgradeEndsAt === null || now < state.upgradeEndsAt) {
    return state;
  }
  return { level: state.level + 1, segments: 0, upgradeEndsAt: null };
}

/**
 * Un filon épuisé (ou un gardien battu) pendant l'amélioration : son minuteur avance. Rend le nouvel état et le temps
 * vraiment gagné (jamais plus que ce qu'il reste).
 */
export function shortenUpgrade(state: PickaxeState, now: number, guardian: boolean): { state: PickaxeState; savedMs: number } {
  if (state.upgradeEndsAt === null || now >= state.upgradeEndsAt) {
    return { state, savedMs: 0 };
  }
  const upgradeEndsAt = Math.max(state.upgradeEndsAt - upgradeShortcutMs(state.level, guardian), now);
  return { state: { ...state, upgradeEndsAt }, savedMs: state.upgradeEndsAt - upgradeEndsAt };
}

export function upgradeTimeLeftMs(state: PickaxeState, now: number): number | null {
  return state.upgradeEndsAt === null ? null : Math.max(state.upgradeEndsAt - now, 0);
}

export function isValidPickaxeState(value: unknown): value is PickaxeState {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const { level, segments, upgradeEndsAt } = value as Record<string, unknown>;
  if (!Number.isSafeInteger(level) || (level as number) < 1 || (level as number) > MAX_PICKAXE_LEVEL) {
    return false;
  }
  if (!Number.isSafeInteger(segments) || (segments as number) < 0 || (segments as number) > SEGMENTS_PER_LEVEL) {
    return false;
  }
  // Un minuteur n'existe que lorsque les 10 segments sont payés, et inversement
  const full = segments === SEGMENTS_PER_LEVEL;
  return full ? Number.isSafeInteger(upgradeEndsAt) : upgradeEndsAt === null;
}

/** Les anciennes sauvegardes n'avaient pas de minuteur : on les complète plutôt que de les jeter. */
export function migratePickaxeState(value: unknown): unknown {
  if (typeof value === 'object' && value !== null && !('upgradeEndsAt' in value)) {
    return { ...value, upgradeEndsAt: null };
  }
  return value;
}
