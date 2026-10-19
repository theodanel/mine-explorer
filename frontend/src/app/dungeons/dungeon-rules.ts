// Règles pures des donjons de ressources : clés du jour, niveaux débloqués, partie à coups comptés.
import { DUNGEON_DAILY_KEYS, DUNGEON_IDS, DUNGEON_MAX_KEYS, DUNGEON_STRIKES, DungeonId, dungeonHp } from '../balance/dungeons';

export interface DungeonState {
  /** Clés en réserve, par donjon. */
  readonly keys: Readonly<Record<DungeonId, number>>;
  /** Plus haut niveau battu, par donjon (0 : aucun). */
  readonly best: Readonly<Record<DungeonId, number>>;
  /** Jour (AAAA-MM-JJ) des dernières clés données. */
  readonly keysDay: string;
}

const PER_DUNGEON = <T>(value: T): Record<DungeonId, T> =>
  Object.fromEntries(DUNGEON_IDS.map((id) => [id, value])) as Record<DungeonId, T>;

export const EMPTY_DUNGEONS: DungeonState = { keys: PER_DUNGEON(0), best: PER_DUNGEON(0), keysDay: '' };

/** Nombre de jours entre deux clés de jour (AAAA-MM-JJ), 0 si le premier est vide. */
function daysBetween(from: string, to: string): number {
  if (from === '') {
    return 1;
  }
  const day = 24 * 60 * 60 * 1000;
  return Math.max(Math.round((Date.parse(to) - Date.parse(from)) / day), 0);
}

/** Les clés du jour : 2 par jour écoulé et par donjon, sans dépasser 4. */
export function refillKeys(state: DungeonState, today: string): DungeonState {
  const days = daysBetween(state.keysDay, today);
  if (days === 0) {
    return state;
  }
  const keys = PER_DUNGEON(0);
  for (const id of DUNGEON_IDS) {
    keys[id] = Math.min(state.keys[id] + days * DUNGEON_DAILY_KEYS, DUNGEON_MAX_KEYS);
  }
  return { ...state, keys, keysDay: today };
}

/** Une partie : le rocher du niveau, ses PV restants et les coups qu'il reste. */
export interface DungeonRun {
  readonly dungeon: DungeonId;
  readonly level: number;
  readonly hp: number;
  readonly maxHp: number;
  readonly strikesLeft: number;
}

export function startRun(dungeon: DungeonId, level: number): DungeonRun {
  const hp = dungeonHp(level);
  return { dungeon, level, hp, maxHp: hp, strikesLeft: DUNGEON_STRIKES };
}

export function strikeRun(run: DungeonRun, damage: number): DungeonRun {
  if (isRunOver(run)) {
    return run;
  }
  return { ...run, hp: Math.max(run.hp - damage, 0), strikesLeft: run.strikesLeft - 1 };
}

export function isRunWon(run: DungeonRun): boolean {
  return run.hp <= 0;
}

export function isRunOver(run: DungeonRun): boolean {
  return isRunWon(run) || run.strikesLeft <= 0;
}

/** Une victoire : une clé dépensée, et le niveau battu devient le record s'il est plus haut. */
export function recordVictory(state: DungeonState, dungeon: DungeonId, level: number): DungeonState {
  return {
    ...state,
    keys: { ...state.keys, [dungeon]: Math.max(state.keys[dungeon] - 1, 0) },
    best: { ...state.best, [dungeon]: Math.max(state.best[dungeon], level) },
  };
}

export function isValidDungeonState(value: unknown): value is DungeonState {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const { keys, best, keysDay } = value as Record<string, unknown>;
  const counts = (record: unknown, max: number): boolean =>
    typeof record === 'object' &&
    record !== null &&
    DUNGEON_IDS.every((id) => {
      const count = (record as Record<string, unknown>)[id];
      return Number.isSafeInteger(count) && (count as number) >= 0 && (count as number) <= max;
    });
  return (
    counts(keys, DUNGEON_MAX_KEYS) &&
    counts(best, Number.MAX_SAFE_INTEGER) &&
    typeof keysDay === 'string' &&
    (keysDay === '' || /^\d{4}-\d{2}-\d{2}$/.test(keysDay))
  );
}
