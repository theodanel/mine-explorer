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
import type { SlotId } from '../equipment/equipment.model';
import { AstreFed, EMPTY_ASTRE, feedAstre, parseAstre, stageOf } from './astre-rules';
import { EMPTY_GEAR_RUNES, GearRunes, parseGearRunes, withGearSocket } from './gear-runes-rules';

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
  /** Ressources données à l'Astre du Cœur, qui remplace l'anneau de runes (26/10/2026). */
  readonly astre: AstreFed;
  /** Niveaux de Constellation allumés (fin de jeu, 26/10/2026). */
  readonly constellation: number;
}

const NO_ESSENCES = Object.fromEntries(ESSENCES.map((id) => [id, 0])) as Record<EssenceId, number>;

export const EMPTY_HEART_FORGE: HeartForgeState = {
  essences: NO_ESSENCES,
  runes: {},
  sockets: Array.from({ length: RING_SOCKETS }, () => false),
  recipes: [],
  gear: EMPTY_GEAR_RUNES,
  astre: EMPTY_ASTRE,
  constellation: 0,
};

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
export function spreadEssences(type: RuneType, amount: number): Partial<Record<EssenceId, number>> {
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
  return rune.rank >= MAX_RUNE_RANK || amount === undefined ? null : spreadEssences(rune.type, amount);
}

function canPay(state: HeartForgeState, cost: Partial<Record<EssenceId, number>>): boolean {
  return ESSENCES.every((id) => state.essences[id] >= (cost[id] ?? 0));
}

/** Rune qu'attend un emplacement de l'anneau : les emplacements 0 et 1 sont ceux de la 1re étoile, etc. */
export function socketRune(socket: number): Rune {
  return STAR_RUNES[Math.floor(socket / 2)][socket % 2];
}

/**
 * Châsses d'équipement nourries directement (26/10/2026) : on y crée la rune d'un élément avec 3 de ses ressources,
 * puis on la fait grandir avec d'autres, sans passer par une réserve. `open` : châsses ouvertes sur l'emplacement.
 */
export function canCreateGearRune(state: HeartForgeState, slot: SlotId, socket: number, type: RuneType, open: number): boolean {
  return socket >= 0 && socket < open && state.gear[slot][socket] === null && !isAllianceRune(type) && canPay(state, createCost(type));
}

export function createGearRune(state: HeartForgeState, slot: SlotId, socket: number, type: RuneType, open: number): HeartForgeState {
  const paid = canCreateGearRune(state, slot, socket, type, open) ? spendEssences(state, createCost(type)) : null;
  return paid === null ? state : { ...paid, gear: withGearSocket(paid.gear, slot, socket, { type, rank: 1 }) };
}

export function canGrowGearRune(state: HeartForgeState, slot: SlotId, socket: number): boolean {
  const rune = state.gear[slot][socket] ?? null;
  const cost = rune === null ? null : growCost(rune);
  return cost !== null && canPay(state, cost);
}

export function growGearRune(state: HeartForgeState, slot: SlotId, socket: number): HeartForgeState {
  const rune = state.gear[slot][socket] ?? null;
  const cost = rune === null ? null : growCost(rune);
  const paid = cost === null ? null : spendEssences(state, cost);
  return paid === null || rune === null
    ? state
    : { ...paid, gear: withGearSocket(paid.gear, slot, socket, { type: rune.type, rank: rune.rank + 1 }) };
}

/** Retire la rune d'une châsse : ce qu'elle a coûté revient en ressources, prêtes à nourrir autre chose. */
export function removeGearRune(state: HeartForgeState, slot: SlotId, socket: number): HeartForgeState {
  const rune = state.gear[slot][socket] ?? null;
  if (rune === null) {
    return state;
  }
  const refunded = addEssences(state, spreadEssences(rune.type, essencesFor(rune.rank)));
  return { ...refunded, gear: withGearSocket(refunded.gear, slot, socket, null) };
}

/** L'Astre du Cœur a atteint le stade de cette étoile (1 à 5) : c'est ce qu'elle demande, en plus de ses missions. */
export function starReady(state: HeartForgeState, star: number): boolean {
  return star >= 1 && stageOf(state.astre) >= star;
}

/** Allume le niveau de Constellation suivant, déjà payé en nourriture : le joueur a vérifié ce qu'il demande. */
export function raiseConstellation(state: HeartForgeState): HeartForgeState {
  return { ...state, constellation: state.constellation + 1 };
}

/** Nourrit l'Astre avec des ressources de la réserve ; sans effet s'il en manque. */
export function feedAstreWith(state: HeartForgeState, essence: EssenceId, amount: number): HeartForgeState {
  const paid = amount > 0 ? spendEssences(state, { [essence]: amount }) : null;
  return paid === null ? state : { ...paid, astre: feedAstre(paid.astre, essence, amount) };
}

/**
 * Sauvegarde d'avant l'Astre (26/10/2026) : ce que coûtaient les runes serties dans l'anneau devient sa nourriture
 * (il garde ainsi leur couleur et son avance), et les runes en réserve sont rendues en ressources.
 */
function migrateToAstre(state: HeartForgeState): HeartForgeState {
  let astre = EMPTY_ASTRE;
  state.sockets.forEach((filled, socket) => {
    if (filled) {
      const rune = socketRune(socket);
      for (const [id, amount] of Object.entries(spreadEssences(rune.type, essencesFor(rune.rank)))) {
        astre = feedAstre(astre, id as EssenceId, amount ?? 0);
      }
    }
  });
  let refunded = state;
  for (const [key, count] of Object.entries(state.runes)) {
    const [type, rank] = key.split(':');
    refunded = addEssences(refunded, scaleCost(spreadEssences(type as RuneType, essencesFor(Number(rank))), count ?? 0));
  }
  return { ...refunded, runes: {}, astre };
}

function scaleCost(cost: Partial<Record<EssenceId, number>>, factor: number): Partial<Record<EssenceId, number>> {
  return Object.fromEntries(Object.entries(cost).map(([id, amount]) => [id, (amount ?? 0) * factor]));
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
  const { essences, runes, sockets, recipes, gear: rawGear, astre: rawAstre, constellation } = value as Record<string, unknown>;
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
  // Sauvegarde d'avant la Constellation (26/10/2026) : aucun niveau allumé
  const constellationValid = constellation === undefined || isCount(constellation);
  if (!essencesValid || !runesValid || !socketsValid || !recipesValid || gear === null || !constellationValid) {
    return null;
  }
  const state: HeartForgeState = {
    essences: essences as HeartForgeState['essences'],
    runes: runes as HeartForgeState['runes'],
    sockets: sockets as boolean[],
    recipes: recipes as RuneType[],
    gear,
    astre: EMPTY_ASTRE,
    constellation: (constellation as number | undefined) ?? 0,
  };
  if (rawAstre === undefined) {
    return migrateToAstre(state);
  }
  const astre = parseAstre(rawAstre);
  return astre === null ? null : { ...state, astre };
}
