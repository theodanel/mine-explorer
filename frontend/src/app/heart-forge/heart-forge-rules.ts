// Règles pures de la Forge du Cœur : ressources des Échos, recettes du Creuset, fusion des runes et anneau du Cœur.
import {
  ALLIANCE_RECIPES,
  ALLIANCE_RUNES,
  ECHO_ESSENCES,
  ESSENCE_ELEMENTS,
  ESSENCES,
  EssenceId,
  MAX_RUNE_RANK,
  RING_SOCKETS,
  RUNE_FUSION_COUNT,
  RUNE_FUSION_FAIL,
  RUNE_TYPES,
  RuneType,
  STAR_RUNES,
} from '../balance/heart-forge';
import type { Random } from '../shared/random';

/** Une rune : son type (élément ou alliance) et son rang (1 à 5). */
export interface Rune {
  readonly type: RuneType;
  readonly rank: number;
}

/** Clé d'une pile de runes dans la réserve : « fire:2 ». */
export type RuneKey = `${RuneType}:${number}`;

export interface HeartForgeState {
  /** Ressources récoltées dans les Échos. */
  readonly essences: Readonly<Record<EssenceId, number>>;
  /** Runes en réserve, par type et rang. */
  readonly runes: Readonly<Partial<Record<RuneKey, number>>>;
  /** Emplacements de l'anneau déjà sertis (10 : 2 par étoile). */
  readonly sockets: readonly boolean[];
  /** Recettes déjà trouvées au Creuset, pour le livre de recettes. */
  readonly recipes: readonly RuneType[];
}

const NO_ESSENCES = Object.fromEntries(ESSENCES.map((id) => [id, 0])) as Record<EssenceId, number>;

export const EMPTY_HEART_FORGE: HeartForgeState = {
  essences: NO_ESSENCES,
  runes: {},
  sockets: Array.from({ length: RING_SOCKETS }, () => false),
  recipes: [],
};

export function runeKey({ type, rank }: Rune): RuneKey {
  return `${type}:${rank}`;
}

export function runeCount(state: HeartForgeState, rune: Rune): number {
  return state.runes[runeKey(rune)] ?? 0;
}

function withRunes(state: HeartForgeState, rune: Rune, delta: number): HeartForgeState {
  return { ...state, runes: { ...state.runes, [runeKey(rune)]: runeCount(state, rune) + delta } };
}

/** Ressource de l'Écho d'une zone (1 à 11), ou null pour une zone sans Écho. */
export function echoEssence(zone: number): EssenceId | null {
  return ECHO_ESSENCES[zone - 1] ?? null;
}

export function addEssences(state: HeartForgeState, gains: Partial<Record<EssenceId, number>>): HeartForgeState {
  const essences = { ...state.essences };
  for (const id of ESSENCES) {
    essences[id] += Math.max(0, gains[id] ?? 0);
  }
  return { ...state, essences };
}

function sameEssences(a: readonly EssenceId[], b: readonly EssenceId[]): boolean {
  const sorted = (list: readonly EssenceId[]) => [...list].sort().join(',');
  return sorted(a) === sorted(b);
}

/**
 * Rune que donne un mélange de 3 ressources : une alliance si c'est sa recette, sinon l'élément le plus présent (ou
 * celui de la 1re ressource si les trois diffèrent).
 */
export function recipeResult(mix: readonly [EssenceId, EssenceId, EssenceId]): RuneType {
  const alliance = ALLIANCE_RUNES.find((type) => sameEssences(ALLIANCE_RECIPES[type], mix));
  if (alliance !== undefined) {
    return alliance;
  }
  const counts = mix.map((id) => mix.filter((other) => other === id).length);
  const best = Math.max(...counts);
  return ESSENCE_ELEMENTS[mix[best > 1 ? counts.indexOf(best) : 0]];
}

export function canBrew(state: HeartForgeState, mix: readonly EssenceId[]): boolean {
  return mix.length === 3 && ESSENCES.every((id) => state.essences[id] >= mix.filter((other) => other === id).length);
}

/** Verse 3 ressources au Creuset : elles donnent une rune de rang 1, et la recette s'inscrit au livre. */
export function brew(state: HeartForgeState, mix: readonly [EssenceId, EssenceId, EssenceId]): { state: HeartForgeState; rune: RuneType } {
  if (!canBrew(state, mix)) {
    throw new RangeError('Ressources insuffisantes pour ce mélange');
  }
  const essences = { ...state.essences };
  for (const id of mix) {
    essences[id] -= 1;
  }
  const rune = recipeResult(mix);
  const recipes = state.recipes.includes(rune) ? state.recipes : [...state.recipes, rune];
  return { state: withRunes({ ...state, essences, recipes }, { type: rune, rank: 1 }, 1), rune };
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
  return { state: withRunes(spent, { type: rune.type, rank: rune.rank + 1 }, 1), success: true };
}

/** Rune qu'attend un emplacement de l'anneau : les emplacements 0 et 1 sont ceux de la 1re étoile, etc. */
export function socketRune(socket: number): Rune {
  return STAR_RUNES[Math.floor(socket / 2)][socket % 2];
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

/** Ressources que demande une rune d'un rang donné, sans fusion ratée (3 par rune de rang 1). */
export function essencesFor(rank: number): number {
  return 3 * RUNE_FUSION_COUNT ** (rank - 1);
}

function isCount(value: unknown): boolean {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}

export function parseHeartForgeState(value: unknown): HeartForgeState | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const { essences, runes, sockets, recipes } = value as Record<string, unknown>;
  const essencesValid =
    typeof essences === 'object' && essences !== null && ESSENCES.every((id) => isCount((essences as Record<string, unknown>)[id]));
  const runesValid =
    typeof runes === 'object' &&
    runes !== null &&
    Object.entries(runes).every(([key, count]) => {
      const [type, rank] = key.split(':');
      return (RUNE_TYPES as readonly string[]).includes(type) && Number(rank) >= 1 && Number(rank) <= MAX_RUNE_RANK && isCount(count);
    });
  const socketsValid = Array.isArray(sockets) && sockets.length === RING_SOCKETS && sockets.every((filled) => typeof filled === 'boolean');
  const recipesValid = Array.isArray(recipes) && recipes.every((type) => (RUNE_TYPES as readonly unknown[]).includes(type));
  if (!essencesValid || !runesValid || !socketsValid || !recipesValid) {
    return null;
  }
  return {
    essences: essences as HeartForgeState['essences'],
    runes: runes as HeartForgeState['runes'],
    sockets: sockets as boolean[],
    recipes: recipes as RuneType[],
  };
}
