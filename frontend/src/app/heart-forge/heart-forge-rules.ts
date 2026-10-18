// Règles pures de la Forge du Cœur : forger des runes, les fusionner, les sertir dans l'anneau du Cœur du monde.
import {
  MAX_RUNE_RANK,
  RING_SOCKETS,
  RUNE_ELEMENTS,
  RUNE_FORGE_SHARDS,
  RUNE_FUSION_COUNT,
  RUNE_FUSION_FAIL,
  RuneElement,
  STAR_RUNES,
} from '../balance/heart-forge';
import type { Random } from '../shared/random';

/** Une rune : son élément et son rang (1 à 5). */
export interface Rune {
  readonly element: RuneElement;
  readonly rank: number;
}

/** Clé d'une pile de runes dans l'inventaire : « fire:2 ». */
export type RuneKey = `${RuneElement}:${number}`;

export interface HeartForgeState {
  /** Éclats de cœur en réserve. */
  readonly shards: number;
  /** Runes en réserve, par élément et rang. */
  readonly runes: Readonly<Partial<Record<RuneKey, number>>>;
  /** Emplacements de l'anneau déjà sertis (10 : 2 par étoile). */
  readonly sockets: readonly boolean[];
}

export const EMPTY_HEART_FORGE: HeartForgeState = {
  shards: 0,
  runes: {},
  sockets: Array.from({ length: RING_SOCKETS }, () => false),
};

export function runeKey({ element, rank }: Rune): RuneKey {
  return `${element}:${rank}`;
}

export function runeCount(state: HeartForgeState, rune: Rune): number {
  return state.runes[runeKey(rune)] ?? 0;
}

function withRunes(state: HeartForgeState, rune: Rune, delta: number): HeartForgeState {
  return { ...state, runes: { ...state.runes, [runeKey(rune)]: runeCount(state, rune) + delta } };
}

export function addHeartShards(state: HeartForgeState, amount: number): HeartForgeState {
  return amount > 0 ? { ...state, shards: state.shards + amount } : state;
}

export function canForgeRune(state: HeartForgeState): boolean {
  return state.shards >= RUNE_FORGE_SHARDS;
}

/** Forge une rune de rang 1 ; ses minerais sont payés par l'appelant. */
export function forgeRune(state: HeartForgeState, element: RuneElement): HeartForgeState {
  if (!canForgeRune(state)) {
    return state;
  }
  return withRunes({ ...state, shards: state.shards - RUNE_FORGE_SHARDS }, { element, rank: 1 }, 1);
}

export function canFuse(state: HeartForgeState, rune: Rune): boolean {
  return rune.rank < MAX_RUNE_RANK && runeCount(state, rune) >= RUNE_FUSION_COUNT;
}

export function fusionFailChance(targetRank: number): number {
  return RUNE_FUSION_FAIL[targetRank] ?? 0;
}

/** Fusionne 3 runes en une du rang suivant ; ratée, il n'en reste qu'une des trois. */
export function fuseRunes(state: HeartForgeState, rune: Rune, random: Random): { state: HeartForgeState; success: boolean } {
  if (!canFuse(state, rune)) {
    return { state, success: false };
  }
  const spent = withRunes(state, rune, -RUNE_FUSION_COUNT);
  if (random() < fusionFailChance(rune.rank + 1)) {
    return { state: withRunes(spent, rune, 1), success: false };
  }
  return { state: withRunes(spent, { element: rune.element, rank: rune.rank + 1 }, 1), success: true };
}

/** Rune qu'attend un emplacement de l'anneau : les emplacements 0 et 1 sont ceux de la 1re étoile, etc. */
export function socketRune(socket: number): Rune {
  const star = STAR_RUNES[Math.floor(socket / 2)];
  return { element: star.elements[socket % 2], rank: star.rank };
}

export function canSocket(state: HeartForgeState, socket: number): boolean {
  return socket >= 0 && socket < RING_SOCKETS && !state.sockets[socket] && runeCount(state, socketRune(socket)) > 0;
}

/** Sertit la rune attendue : elle quitte la réserve et reste dans l'anneau. */
export function socketRuneIn(state: HeartForgeState, socket: number): HeartForgeState {
  if (!canSocket(state, socket)) {
    return state;
  }
  const sockets = state.sockets.map((filled, index) => filled || index === socket);
  return withRunes({ ...state, sockets }, socketRune(socket), -1);
}

/** Les deux runes de l'étoile (1 à 5) sont serties. */
export function starRunesSet(state: HeartForgeState, star: number): boolean {
  const first = (star - 1) * 2;
  return star >= 1 && star <= STAR_RUNES.length && state.sockets[first] && state.sockets[first + 1];
}

/** Runes de rang 1 que demande une rune d'un rang donné, sans fusion ratée. */
export function baseRunesFor(rank: number): number {
  return RUNE_FUSION_COUNT ** (rank - 1);
}

export function parseHeartForgeState(value: unknown): HeartForgeState | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const { shards, runes, sockets } = value as Record<string, unknown>;
  const runesValid =
    typeof runes === 'object' &&
    runes !== null &&
    Object.entries(runes).every(([key, count]) => {
      const [element, rank] = key.split(':');
      return (
        (RUNE_ELEMENTS as readonly string[]).includes(element) &&
        Number(rank) >= 1 &&
        Number(rank) <= MAX_RUNE_RANK &&
        Number.isSafeInteger(count) &&
        (count as number) >= 0
      );
    });
  const socketsValid = Array.isArray(sockets) && sockets.length === RING_SOCKETS && sockets.every((filled) => typeof filled === 'boolean');
  if (!Number.isSafeInteger(shards) || (shards as number) < 0 || !runesValid || !socketsValid) {
    return null;
  }
  return { shards: shards as number, runes: runes as HeartForgeState['runes'], sockets: sockets as boolean[] };
}
