// Règles pures du Puits sans fond : avancée d'une descente, récompenses, essais du jour et sauvegarde.
import { ABYSS_DAILY_RUNS, floorHp, RECORD_SHARDS, RECORD_STEP, RECORD_STONES, SHARDS_PER_FLOOR } from '../balance/abyss';

/** Garde-fou : aucune descente ne dépasse cet étage (le calcul s'arrête là même avec une Puissance absurde). */
export const MAX_FLOOR = 500;

export interface Descent {
  /** Étages entièrement franchis. */
  readonly floors: number;
  /** Part du filon en cours déjà cassée, de 0 à 1. */
  readonly progress: number;
}

/** Où en est une descente après `damage` dégâts cumulés. */
export function descend(damage: number): Descent {
  let remaining = Math.max(damage, 0);
  let floors = 0;
  while (floors < MAX_FLOOR) {
    const hp = floorHp(floors + 1);
    if (remaining < hp) {
      return { floors, progress: remaining / hp };
    }
    remaining -= hp;
    floors++;
  }
  return { floors, progress: 0 };
}

export interface RunReward {
  readonly shards: number;
  readonly stones: number;
  /** Paliers de record franchis pour la première fois par cette descente. */
  readonly newRecordSteps: number;
}

/** Récompense d'une descente qui atteint `floors`, avec le record d'avant. */
export function runReward(floors: number, previousRecord: number): RunReward {
  const newRecordSteps = Math.max(Math.floor(floors / RECORD_STEP) - Math.floor(previousRecord / RECORD_STEP), 0);
  return {
    shards: floors * SHARDS_PER_FLOOR + newRecordSteps * RECORD_SHARDS,
    stones: newRecordSteps * RECORD_STONES,
    newRecordSteps,
  };
}

/** Descente en cours : gardée dans la sauvegarde, pour qu'un rechargement de la page ne fasse rien perdre. */
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
