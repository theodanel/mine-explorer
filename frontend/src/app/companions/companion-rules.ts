// Règles pures des compagnons : œufs, éclosion, doublons, étoiles, bonus et expéditions.
import {
  COMPANION_IDS,
  CompanionId,
  COMPANIONS,
  companionEffectMultiplier,
  DUPLICATE_STONES,
  EGG_RARITY_WEIGHTS,
  EXPEDITION_HOURS,
  EXPEDITION_RARITY_BONUS,
  EXPEDITION_SHARDS_PER_HOUR,
  EXPEDITION_SLOTS,
  EXPEDITION_STONES_PER_HOUR,
  HATCH_MS,
  LEGACY_STONES_PER_LEVEL,
  LEGENDARY_PITY,
  MAX_STARS,
  starCost,
} from '../balance/companions';
import { BonusId, Bonuses, NO_BONUSES, RARITY_IDS, Rarity } from '../balance/skill-tree';
import type { Random } from '../shared/random';

export interface OwnedCompanion {
  readonly stars: number;
}

export interface Expedition {
  readonly hours: number;
  readonly endsAt: number;
}

export interface CompanionState {
  readonly owned: Readonly<Partial<Record<CompanionId, OwnedCompanion>>>;
  /** Compagnon qui accompagne le mineur et donne son bonus. */
  readonly active: CompanionId | null;
  /** Œufs en attente, dans l'ordre où ils ont été trouvés. */
  readonly eggs: readonly Rarity[];
  readonly incubating: { readonly rarity: Rarity; readonly endsAt: number } | null;
  /** Œufs trouvés depuis le dernier légendaire, pour la garantie. */
  readonly sinceLegendary: number;
  /** Premier œuf offert à l'ouverture de l'onglet. */
  readonly gifted: boolean;
  readonly expeditions: Readonly<Partial<Record<CompanionId, Expedition>>>;
  /** Pierres d'éveil : elles font monter les étoiles. */
  readonly stones: number;
}

export const EMPTY_COMPANIONS: CompanionState = {
  owned: {},
  active: null,
  eggs: [],
  incubating: null,
  sinceLegendary: 0,
  gifted: false,
  expeditions: {},
  stones: 0,
};

export interface Hatching {
  readonly id: CompanionId;
  /** new : premier exemplaire ; duplicate : doublon changé en pierres d'éveil. */
  readonly kind: 'new' | 'duplicate';
  readonly stars: number;
  readonly stones: number;
}

const rarityRank = (rarity: Rarity): number => RARITY_IDS.indexOf(rarity);

/**
 * Rareté d'un œuf trouvé : tirée selon les chances affichées, jamais sous `minRarity`,
 * et légendaire d'office au bout de la garantie.
 */
export function rollEggRarity(random: Random, sinceLegendary: number, minRarity: Rarity = 'common'): Rarity {
  if (sinceLegendary >= LEGENDARY_PITY - 1) {
    return 'legendary';
  }
  const total = RARITY_IDS.reduce((sum, rarity) => sum + EGG_RARITY_WEIGHTS[rarity], 0);
  let threshold = random() * total;
  let rolled: Rarity = RARITY_IDS[RARITY_IDS.length - 1];
  for (const rarity of RARITY_IDS) {
    threshold -= EGG_RARITY_WEIGHTS[rarity];
    if (threshold < 0) {
      rolled = rarity;
      break;
    }
  }
  return rarityRank(rolled) < rarityRank(minRarity) ? minRarity : rolled;
}

/** Range un œuf trouvé ; s'il n'y a rien à couver, il passe tout de suite dans la couveuse. */
export function addEgg(state: CompanionState, rarity: Rarity, now: number): CompanionState {
  const sinceLegendary = rarity === 'legendary' ? 0 : state.sinceLegendary + 1;
  return startNextEgg({ ...state, eggs: [...state.eggs, rarity], sinceLegendary }, now);
}

export function startNextEgg(state: CompanionState, now: number): CompanionState {
  if (state.incubating !== null || state.eggs.length === 0) {
    return state;
  }
  const [rarity, ...rest] = state.eggs;
  return { ...state, eggs: rest, incubating: { rarity, endsAt: now + HATCH_MS[rarity] } };
}

export function canHatch(state: CompanionState, now: number): boolean {
  return state.incubating !== null && now >= state.incubating.endsAt;
}

/** Fait éclore l'œuf couvé : un compagnon de sa rareté, au hasard. Un doublon devient des pierres d'éveil. */
export function hatch(state: CompanionState, random: Random, now: number): { state: CompanionState; hatching: Hatching } | null {
  if (!canHatch(state, now) || state.incubating === null) {
    return null;
  }
  const rarity = state.incubating.rarity;
  const pool = COMPANION_IDS.filter((id) => COMPANIONS[id].rarity === rarity);
  const id = pool[Math.min(Math.floor(random() * pool.length), pool.length - 1)];
  const owned = state.owned[id];
  let hatching: Hatching;
  let next: CompanionState;
  if (owned === undefined) {
    hatching = { id, kind: 'new', stars: 1, stones: 0 };
    // Le premier compagnon accompagne le mineur tout de suite
    next = { ...state, owned: { ...state.owned, [id]: { stars: 1 } }, active: state.active ?? id };
  } else {
    const stones = DUPLICATE_STONES[rarity];
    hatching = { id, kind: 'duplicate', stars: owned.stars, stones };
    next = { ...state, stones: state.stones + stones };
  }
  return { state: startNextEgg({ ...next, incubating: null }, now), hatching };
}

/** Pierres pour l'étoile suivante, ou null si le compagnon est absent ou déjà à 5 étoiles. */
export function nextStarCost(state: CompanionState, id: CompanionId): number | null {
  const owned = state.owned[id];
  return owned === undefined || owned.stars >= MAX_STARS ? null : starCost(owned.stars);
}

/** Monte le compagnon d'une étoile en payant ses pierres d'éveil ; refusé s'il en manque. */
export function raiseStar(state: CompanionState, id: CompanionId): CompanionState {
  const owned = state.owned[id];
  const cost = nextStarCost(state, id);
  if (owned === undefined || cost === null || state.stones < cost) {
    return state;
  }
  return { ...state, stones: state.stones - cost, owned: { ...state.owned, [id]: { stars: owned.stars + 1 } } };
}

/** Effets d'un compagnon à ses étoiles. */
export function companionEffects(id: CompanionId, owned: OwnedCompanion): Bonuses {
  const totals: Record<BonusId, number> = { ...NO_BONUSES };
  const multiplier = companionEffectMultiplier(owned.stars);
  for (const [bonus, value] of Object.entries(COMPANIONS[id].effects) as [BonusId, number][]) {
    totals[bonus] += value * multiplier;
  }
  return totals;
}

/** Bonus du compagnon qui accompagne le mineur, ou aucun. */
export function activeCompanionBonuses(state: CompanionState): Bonuses {
  const owned = state.active === null ? undefined : state.owned[state.active];
  return state.active === null || owned === undefined ? NO_BONUSES : companionEffects(state.active, owned);
}

/** Un compagnon en expédition ne peut pas accompagner le mineur, et inversement. */
export function setActive(state: CompanionState, id: CompanionId): CompanionState {
  if (state.owned[id] === undefined || state.expeditions[id] !== undefined) {
    return state;
  }
  return { ...state, active: id };
}

export interface ExpeditionLoot {
  readonly shards: number;
  readonly stones: number;
}

/** Butin d'une expédition : des éclats et des pierres d'éveil, jamais d'or. */
export function expeditionLoot(id: CompanionId, hours: number): ExpeditionLoot {
  const bonus = EXPEDITION_RARITY_BONUS[COMPANIONS[id].rarity];
  return {
    shards: Math.round(hours * EXPEDITION_SHARDS_PER_HOUR * bonus),
    stones: Math.round(hours * EXPEDITION_STONES_PER_HOUR * bonus),
  };
}

export function canSend(state: CompanionState, id: CompanionId, hours: number): boolean {
  return (
    state.owned[id] !== undefined &&
    state.active !== id &&
    state.expeditions[id] === undefined &&
    Object.keys(state.expeditions).length < EXPEDITION_SLOTS &&
    EXPEDITION_HOURS.includes(hours)
  );
}

export function sendOnExpedition(state: CompanionState, id: CompanionId, hours: number, now: number): CompanionState {
  if (!canSend(state, id, hours)) {
    return state;
  }
  return { ...state, expeditions: { ...state.expeditions, [id]: { hours, endsAt: now + hours * 60 * 60 * 1000 } } };
}

/** Ramène un compagnon rentré avec son butin ; renvoie null s'il est encore parti. */
export function collectExpedition(
  state: CompanionState,
  id: CompanionId,
  now: number,
): { state: CompanionState; loot: ExpeditionLoot } | null {
  const expedition = state.expeditions[id];
  if (expedition === undefined || now < expedition.endsAt) {
    return null;
  }
  const expeditions = { ...state.expeditions };
  delete expeditions[id];
  const loot = expeditionLoot(id, expedition.hours);
  return { state: { ...state, expeditions, stones: state.stones + loot.stones }, loot };
}

// ─── Sauvegarde ──────────────────────────────────────────────────────────────

const isCompanionId = (value: unknown): value is CompanionId => (COMPANION_IDS as readonly unknown[]).includes(value);
const isRarity = (value: unknown): value is Rarity => (RARITY_IDS as readonly unknown[]).includes(value);
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const isCount = (value: unknown, min: number, max: number): boolean =>
  Number.isSafeInteger(value) && (value as number) >= min && (value as number) <= max;

/**
 * Ancienne sauvegarde (avant les pierres d'éveil) : les niveaux payés en minerai deviennent des pierres,
 * et le compteur de pierres démarre à ce remboursement.
 */
export function migrateCompanionState(value: unknown): unknown {
  if (!isRecord(value) || value['stones'] !== undefined || !isRecord(value['owned'])) {
    return value;
  }
  let refund = 0;
  const owned: Record<string, unknown> = {};
  for (const [id, entry] of Object.entries(value['owned'])) {
    if (isRecord(entry)) {
      const level = entry['level'];
      if (Number.isSafeInteger(level) && (level as number) > 1) {
        refund += ((level as number) - 1) * LEGACY_STONES_PER_LEVEL;
      }
      owned[id] = { stars: entry['stars'] };
    } else {
      owned[id] = entry;
    }
  }
  const expeditions = isRecord(value['expeditions']) ? value['expeditions'] : {};
  return { ...value, owned, expeditions, stones: refund };
}

export function isValidCompanionState(value: unknown): value is CompanionState {
  if (!isRecord(value)) {
    return false;
  }
  const { owned, active, eggs, incubating, sinceLegendary, gifted, expeditions, stones } = value;
  return (
    isRecord(owned) &&
    Object.entries(owned).every(([id, entry]) => isCompanionId(id) && isRecord(entry) && isCount(entry['stars'], 1, MAX_STARS)) &&
    (active === null || (isCompanionId(active) && owned[active] !== undefined)) &&
    Array.isArray(eggs) &&
    eggs.every(isRarity) &&
    (incubating === null || (isRecord(incubating) && isRarity(incubating['rarity']) && Number.isFinite(incubating['endsAt']))) &&
    isCount(sinceLegendary, 0, LEGENDARY_PITY) &&
    typeof gifted === 'boolean' &&
    isCount(stones, 0, Number.MAX_SAFE_INTEGER) &&
    isRecord(expeditions) &&
    Object.entries(expeditions).every(
      ([id, entry]) =>
        isCompanionId(id) &&
        owned[id] !== undefined &&
        isRecord(entry) &&
        EXPEDITION_HOURS.includes(entry['hours'] as number) &&
        Number.isFinite(entry['endsAt']),
    )
  );
}
