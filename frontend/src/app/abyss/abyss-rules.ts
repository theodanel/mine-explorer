// Règles pures du Puits sans fond : récompenses, essais du jour et sauvegarde. Le jeu lui-même est dans abyss-game.ts.
import { ABYSS_DAILY_RUNS, RECORD_SHARDS, RECORD_STEP, RECORD_STONES } from '../balance/abyss';

/** Garde-fou : un record au-delà de cet étage est une sauvegarde trafiquée. */
export const MAX_FLOOR = 500;

export interface RunReward {
  readonly shards: number;
  readonly stones: number;
  /** Paliers de record franchis pour la première fois par cette descente. */
  readonly newRecordSteps: number;
}

/** Récompense d'une descente : les éclats gagnés étage par étage, plus les paliers de record battus. */
export function runReward(floors: number, runShards: number, previousRecord: number): RunReward {
  const newRecordSteps = Math.max(Math.floor(floors / RECORD_STEP) - Math.floor(previousRecord / RECORD_STEP), 0);
  return {
    shards: runShards + newRecordSteps * RECORD_SHARDS,
    stones: newRecordSteps * RECORD_STONES,
    newRecordSteps,
  };
}

/**
 * Descente de l'ancienne version (chrono sans jeu), gardée seulement pour relire les sauvegardes d'alors :
 * le mini-jeu ne survit pas à un rechargement, la descente est simplement perdue.
 */
export interface ActiveRun {
  readonly startedAt: number;
  /** Dégâts par seconde du mineur au départ : la descente se joue avec le build du moment. */
  readonly dps: number;
}

export interface AbyssState {
  readonly record: number;
  /** Jour (AAAA-MM-JJ) des essais comptés, et combien ont été joués ce jour-là. */
  readonly day: string;
  readonly runsUsed: number;
  readonly active: ActiveRun | null;
}

export const EMPTY_ABYSS: AbyssState = { record: 0, day: '', runsUsed: 0, active: null };

/** Essais restants aujourd'hui : un nouveau jour remet le compteur à zéro. */
export function runsLeft(state: AbyssState, today: string): number {
  return state.day === today ? Math.max(ABYSS_DAILY_RUNS - state.runsUsed, 0) : ABYSS_DAILY_RUNS;
}

export function isValidAbyssState(value: unknown): value is AbyssState {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  const { record, day, runsUsed, active } = value as Record<string, unknown>;
  return (
    isValidActiveRun(active) &&
    Number.isSafeInteger(record) &&
    (record as number) >= 0 &&
    (record as number) <= MAX_FLOOR &&
    typeof day === 'string' &&
    (day === '' || /^\d{4}-\d{2}-\d{2}$/.test(day)) &&
    Number.isSafeInteger(runsUsed) &&
    (runsUsed as number) >= 0 &&
    (runsUsed as number) <= ABYSS_DAILY_RUNS
  );
}

function isValidActiveRun(value: unknown): value is ActiveRun | null {
  if (value === null) {
    return true;
  }
  if (typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const { startedAt, dps } = value as Record<string, unknown>;
  return (
    typeof startedAt === 'number' &&
    Number.isFinite(startedAt) &&
    startedAt >= 0 &&
    typeof dps === 'number' &&
    Number.isFinite(dps) &&
    dps >= 0
  );
}
