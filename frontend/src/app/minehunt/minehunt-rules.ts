// Règles pures de la Chasse au filon : parties du jour et sauvegarde. La partie est dans minehunt-game.ts.
import { MINEHUNT_DAILY_RUNS } from '../balance/minehunt';

export interface MinehuntState {
  /** Jour (AAAA-MM-JJ) des parties comptées, et combien ont été jouées ce jour-là. */
  readonly day: string;
  readonly runsUsed: number;
}

export const EMPTY_MINEHUNT: MinehuntState = { day: '', runsUsed: 0 };

export function runsLeft(state: MinehuntState, today: string): number {
  return state.day === today ? Math.max(MINEHUNT_DAILY_RUNS - state.runsUsed, 0) : MINEHUNT_DAILY_RUNS;
}

export function isValidMinehuntState(value: unknown): value is MinehuntState {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  const { day, runsUsed } = value as Record<string, unknown>;
  return (
    typeof day === 'string' &&
    (day === '' || /^\d{4}-\d{2}-\d{2}$/.test(day)) &&
    Number.isSafeInteger(runsUsed) &&
    (runsUsed as number) >= 0 &&
    (runsUsed as number) <= MINEHUNT_DAILY_RUNS
  );
}
