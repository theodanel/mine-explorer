// Règles pures de la Forge du Cœur : ressources des Échos, création et croissance des runes, et anneau du Cœur.
// Les runes serties sur l'équipement sont dans gear-runes-rules.ts.
import {
  ALLIANCE_RECIPES,
  ALLIANCE_RUNES,
  ECHO_ESSENCES,
  ESSENCE_ELEMENTS,
  ESSENCES,
  EssenceId,
  ALLIANCE_EXTRA_ESSENCES,
  MAX_RUNE_RANK,
  RING_SOCKETS,
  RUNE_CREATE_ESSENCES,
  RUNE_GROW_ESSENCES,
  RUNE_TYPES,
  RuneType,
  STAR_RUNES,
} from '../balance/heart-forge';
import { EMPTY_GEAR_RUNES, GearRunes, parseGearRunes } from './gear-runes-rules';

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
  /** Runes serties sur les emplacements d'équipement, dès la 1re étoile. */
  readonly gear: GearRunes;
}

const NO_ESSENCES = Object.fromEntries(ESSENCES.map((id) => [id, 0])) as Record<EssenceId, number>;

export const EMPTY_HEART_FORGE: HeartForgeState = {
  essences: NO_ESSENCES,
  runes: {},
  sockets: Array.from({ length: RING_SOCKETS }, () => false),
  recipes: [],
  gear: EMPTY_GEAR_RUNES,
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

/** Paie des ressources : null s'il en manque une, sans rien prendre. */
export function spendEssences(state: HeartForgeState, cost: Partial<Record<EssenceId, number>>): HeartForgeState | null {
  const essences = { ...state.essences };
  for (const id of ESSENCES) {
    essences[id] -= Math.max(0, cost[id] ?? 0);
    if (essences[id] < 0) {
      return null;
    }
  }
  return { ...state, essences };
}

export function isAllianceRune(type: RuneType): type is (typeof ALLIANCE_RUNES)[number] {
  return (ALLIANCE_RUNES as readonly RuneType[]).includes(type);
}

/** Recette d'une rune : 3 ressources de son élément, ou les 3 de son alliance. */
export function recipeOf(type: RuneType): readonly [EssenceId, EssenceId, EssenceId] {
  if (isAllianceRune(type)) {
    return ALLIANCE_RECIPES[type];
  }
  const essence = ESSENCES.find((id) => ESSENCE_ELEMENTS[id] === type) ?? ESSENCES[0];
  return [essence, essence, essence];
}

/** Ressources pour une quantité donnée, réparties comme la recette (2 Braise pour 1 Sève, pour Magma). */
function spread(type: RuneType, amount: number): Partial<Record<EssenceId, number>> {
  const recipe = recipeOf(type);
  const cost: Partial<Record<EssenceId, number>> = {};
  let given = 0;
  for (const id of new Set(recipe)) {
    const share = Math.floor((amount * recipe.filter((other) => other === id).length) / recipe.length);
    cost[id] = share;
    given += share;
  }
  // Le reste de la division va à la ressource principale, la première de la recette
  cost[recipe[0]] = (cost[recipe[0]] ?? 0) + amount - given;
  return cost;
}

/** Coût de création d'une rune de rang 1 : 3 ressources, plus 2 pour une alliance. */
export function createCost(type: RuneType): Partial<Record<EssenceId, number>> {
  const cost: Partial<Record<EssenceId, number>> = {};
  const recipe = recipeOf(type);
  const paid = isAllianceRune(type) ? [...recipe, ...recipe.slice(0, ALLIANCE_EXTRA_ESSENCES)] : recipe.slice(0, RUNE_CREATE_ESSENCES);
  for (const id of paid) {
    cost[id] = (cost[id] ?? 0) + 1;
  }
  return cost;
}

/** Ressources pour faire grandir une rune de son rang au suivant, ou null au rang maximum. */
export function growCost(rune: Rune): Partial<Record<EssenceId, number>> | null {
  const amount = RUNE_GROW_ESSENCES[rune.rank + 1];
  return rune.rank >= MAX_RUNE_RANK || amount === undefined ? null : spread(rune.type, amount);
}

function canPay(state: HeartForgeState, cost: Partial<Record<EssenceId, number>>): boolean {
  return ESSENCES.every((id) => state.essences[id] >= (cost[id] ?? 0));
}

/**
 * Recettes d'alliance révélées par les étoiles : celles des runes que demandent les étoiles déjà éveillées et la
 * suivante. On ne peut créer une alliance que si sa recette est connue (révélée, ou trouvée avant le 25/10/2026).
 */
export function revealedRecipes(stars: number): readonly RuneType[] {
  return STAR_RUNES.slice(0, Math.min(stars + 1, STAR_RUNES.length))
    .flat()
    .map((rune) => rune.type)
    .filter((type, index, all) => isAllianceRune(type) && all.indexOf(type) === index);
}

export function knowsRecipe(state: HeartForgeState, type: RuneType, stars: number): boolean {
  return !isAllianceRune(type) || state.recipes.includes(type) || revealedRecipes(stars).includes(type);
}

export function canCreate(state: HeartForgeState, type: RuneType, stars: number): boolean {
  return knowsRecipe(state, type, stars) && canPay(state, createCost(type));
}

/** Crée une rune de rang 1 ; elle s'inscrit au livre. Sans effet si la recette est inconnue ou les ressources manquent. */
export function createRune(state: HeartForgeState, type: RuneType, stars: number): HeartForgeState {
  const paid = canCreate(state, type, stars) ? spendEssences(state, createCost(type)) : null;
  if (paid === null) {
    return state;
  }
  const recipes = paid.recipes.includes(type) ? paid.recipes : [...paid.recipes, type];
  return withRunes({ ...paid, recipes }, { type, rank: 1 }, 1);
}

export function canGrow(state: HeartForgeState, rune: Rune): boolean {
  const cost = growCost(rune);
  return cost !== null && runeCount(state, rune) > 0 && canPay(state, cost);
}

/** Nourrit une rune de la réserve : elle passe au rang suivant. */
export function growRune(state: HeartForgeState, rune: Rune): HeartForgeState {
  const cost = growCost(rune);
  const paid = cost !== null && canGrow(state, rune) ? spendEssences(state, cost) : null;
  if (paid === null) {
    return state;
  }
  return withRunes(withRunes(paid, rune, -1), { type: rune.type, rank: rune.rank + 1 }, 1);
}

/** Rune qu'attend un emplacement de l'anneau : les emplacements 0 et 1 sont ceux de la 1re étoile, etc. */
export function socketRune(socket: number): Rune {
  return STAR_RUNES[Math.floor(socket / 2)][socket % 2];
}

/** Étoile (1 à 5) dont l'emplacement attend une rune. */
export function socketStar(socket: number): number {
  return Math.floor(socket / 2) + 1;
}

/**
 * Les emplacements d'une étoile ne s'ouvrent qu'une fois l'étoile précédente obtenue (25/10/2026) : on ne prépare plus
 * tout l'anneau d'avance, chaque étoile est une étape. `stars` : étoiles déjà obtenues.
 */
export function socketOpen(socket: number, stars: number): boolean {
  return socketStar(socket) <= stars + 1;
}

export function canSocket(state: HeartForgeState, socket: number, stars: number): boolean {
  return (
    socket >= 0 &&
    socket < RING_SOCKETS &&
    socketOpen(socket, stars) &&
    !state.sockets[socket] &&
    runeCount(state, socketRune(socket)) > 0
  );
}

/** Sertit la rune attendue : elle quitte la réserve et reste dans l'anneau. */
export function socketRuneIn(state: HeartForgeState, socket: number, stars: number): HeartForgeState {
  if (!canSocket(state, socket, stars)) {
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

/** Ressources que demande une rune d'un rang donné, de sa création à ce rang (3 au rang 1, 674 au rang 5). */
export function essencesFor(rank: number): number {
  let total = RUNE_CREATE_ESSENCES;
  for (let next = 2; next <= rank; next++) {
    total += RUNE_GROW_ESSENCES[next] ?? 0;
  }
  return total;
}

function isRune(value: unknown): value is Rune {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const { type, rank } = value as Record<string, unknown>;
  return (RUNE_TYPES as readonly unknown[]).includes(type) && Number.isSafeInteger(rank) && (rank as number) >= 1 && (rank as number) <= MAX_RUNE_RANK;
}

function isCount(value: unknown): boolean {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}

export function parseHeartForgeState(value: unknown): HeartForgeState | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const { essences, runes, sockets, recipes, gear: rawGear } = value as Record<string, unknown>;
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
  const gear = parseGearRunes(rawGear, isRune);
  if (!essencesValid || !runesValid || !socketsValid || !recipesValid || gear === null) {
    return null;
  }
  return {
    essences: essences as HeartForgeState['essences'],
    runes: runes as HeartForgeState['runes'],
    sockets: sockets as boolean[],
    recipes: recipes as RuneType[],
    gear,
  };
}
