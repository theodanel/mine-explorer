// Règles pures du Wagonnet fou : courses du jour, récompense d'une course et sauvegarde. La course est dans minecart-game.ts.
import { MINECART_DAILY_RUNS, ORE_PER_PICKUP, RECORD_STEP_METERS } from '../balance/minecart';

/** Garde-fou : un record au-delà est une sauvegarde trafiquée. */
export const MAX_RECORD_METERS = 100_000;

export interface MinecartState {
  /** Plus longue course, en mètres. */
  readonly record: number;
  /** Jour (AAAA-MM-JJ) des courses comptées, et combien ont été jouées ce jour-là. */
  readonly day: string;
  readonly runsUsed: number;
}

export const EMPTY_MINECART: MinecartState = { record: 0, day: '', runsUsed: 0 };

export interface RideReward {
  readonly ores: number;
  readonly gold: number;
  /** Paliers de 500 m franchis pour la première fois par cette course. */
  readonly newRecordSteps: number;
}

/** Ce que rapporte une course : le minerai et les pépites ramassés, plus le bonus des paliers de record battus. */
export function rideReward(
  meters: number,
  pickups: { readonly ores: number; readonly nuggets: number },
  previousRecord: number,
  nuggetGold: number,
  recordBonus: (steps: number) => number,
): RideReward {
  const newRecordSteps = Math.max(Math.floor(meters / RECORD_STEP_METERS) - Math.floor(previousRecord / RECORD_STEP_METERS), 0);
  return {
    ores: pickups.ores * ORE_PER_PICKUP,
    gold: pickups.nuggets * nuggetGold + (newRecordSteps > 0 ? recordBonus(newRecordSteps) : 0),
    newRecordSteps,
  };
}

/** Courses restantes aujourd'hui : un nouveau jour remet le compteur à zéro. */
export function runsLeft(state: MinecartState, today: string): number {
  return state.day === today ? Math.max(MINECART_DAILY_RUNS - state.runsUsed, 0) : MINECART_DAILY_RUNS;
}

export function isValidMinecartState(value: unknown): value is MinecartState {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  const { record, day, runsUsed } = value as Record<string, unknown>;
  return (
    Number.isSafeInteger(record) &&
    (record as number) >= 0 &&
    (record as number) <= MAX_RECORD_METERS &&
    typeof day === 'string' &&
    (day === '' || /^\d{4}-\d{2}-\d{2}$/.test(day)) &&
    Number.isSafeInteger(runsUsed) &&
    (runsUsed as number) >= 0 &&
    (runsUsed as number) <= MINECART_DAILY_RUNS
  );
}
