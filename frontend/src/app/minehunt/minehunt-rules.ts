// Règles pures de la Chasse au filon : parties du jour, butin d'une partie et sauvegarde. La partie est dans minehunt-game.ts.
import { BROKEN_KEEP_SHARE, CHEST_ORES, MINEHUNT_DAILY_RUNS, ORE_PER_CELL } from '../balance/minehunt';
import type { HuntStatus } from './minehunt-game';

export interface MinehuntState {
  /** Jour (AAAA-MM-JJ) des parties comptées, et combien ont été jouées ce jour-là. */
  readonly day: string;
  readonly runsUsed: number;
}

export const EMPTY_MINEHUNT: MinehuntState = { day: '', runsUsed: 0 };

export interface HuntLoot {
  readonly ores: number;
  readonly gold: number;
}

/** Butin d'une partie : tout si le joueur remonte à temps, la moitié si sa pioche a cassé. */
export function huntLoot(
  found: { readonly ores: number; readonly nuggets: number; readonly chest: boolean; readonly status: HuntStatus },
  values: { readonly nuggetGold: number; readonly chestGold: number },
): HuntLoot {
  const share = found.status === 'broken' ? BROKEN_KEEP_SHARE : 1;
  const ores = found.ores * ORE_PER_CELL + (found.chest ? CHEST_ORES : 0);
  const gold = found.nuggets * values.nuggetGold + (found.chest ? values.chestGold : 0);
  return { ores: Math.floor(ores * share), gold: Math.floor(gold * share) };
}

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
