// Règles pures des compagnons : œufs, éclosion, doublons, niveaux, bonus et expéditions.
import {
  COMPANION_IDS,
  CompanionId,
  COMPANIONS,
  companionEffectMultiplier,
  EGG_RARITY_WEIGHTS,
  EXPEDITION_HOURS,
  EXPEDITION_HOURS_PER_ORE,
  EXPEDITION_RARITY_BONUS,
  EXPEDITION_SLOTS,
  EXPEDITION_SHARDS_PER_HOUR,
  HATCH_MS,
  LEGENDARY_PITY,
  MAX_COMPANION_LEVEL,
  MAX_STARS,
  STAR_OVERFLOW_SHARDS,
} from '../balance/companions';
import { BonusId, Bonuses, NO_BONUSES, RARITY_IDS, Rarity } from '../balance/skill-tree';
import type { Random } from '../shared/random';

export interface OwnedCompanion {
  readonly stars: number;
  readonly level: number;
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
}

export const EMPTY_COMPANIONS: CompanionState = {
  owned: {},
  active: null,
  eggs: [],
  incubating: null,
  sinceLegendary: 0,
  gifted: false,
  expeditions: {},
};

export interface Hatching {
  readonly id: CompanionId;
  /** new : premier exemplaire ; star : doublon qui ajoute une étoile ; maxed : doublon changé en éclats. */
  readonly kind: 'new' | 'star' | 'maxed';
  readonly stars: number;
  readonly shards: number;
}

/** Rareté d'un œuf trouvé ; le légendaire tombe d'office au bout de la garantie. */
export function rollEggRarity(random: Random, sinceLegendary: number): Rarity {
  if (sinceLegendary >= LEGENDARY_PITY - 1) {
    return 'legendary';
  }
  const total = RARITY_IDS.reduce((sum, rarity) => sum + EGG_RARITY_WEIGHTS[rarity], 0);
  let threshold = random() * total;
  for (const rarity of RARITY_IDS) {
    threshold -= EGG_RARITY_WEIGHTS[rarity];
    if (threshold < 0) {
      return rarity;
    }
  }
  return RARITY_IDS[RARITY_IDS.length - 1];
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

/** Fait éclore l'œuf couvé : un compagnon de sa rareté, au hasard. L'œuf suivant prend la place. */
export function hatch(state: CompanionState, random: Random, now: number): { state: CompanionState; hatching: Hatching } | null {
  if (!canHatch(state, now) || state.incubating === null) {
    return null;
  }
  const pool = COMPANION_IDS.filter((id) => COMPANIONS[id].rarity === state.incubating?.rarity);
  const id = pool[Math.min(Math.floor(random() * pool.length), pool.length - 1)];
  const owned = state.owned[id];
  let hatching: Hatching;
  let next: CompanionState;
  if (owned === undefined) {
    hatching = { id, kind: 'new', stars: 1, shards: 0 };
    // Le premier compagnon accompagne le mineur tout de suite
    next = { ...state, owned: { ...state.owned, [id]: { stars: 1, level: 1 } }, active: state.active ?? id };
  } else if (owned.stars >= MAX_STARS) {
    hatching = { id, kind: 'maxed', stars: owned.stars, shards: STAR_OVERFLOW_SHARDS };
    next = state;
  } else {
    hatching = { id, kind: 'star', stars: owned.stars + 1, shards: 0 };
    next = { ...state, owned: { ...state.owned, [id]: { ...owned, stars: owned.stars + 1 } } };
  }
  return { state: startNextEgg({ ...next, incubating: null }, now), hatching };
}

/** Effets d'un compagnon à ses étoiles et à son niveau. */
export function companionEffects(id: CompanionId, owned: OwnedCompanion): Bonuses {
  const totals: Record<BonusId, number> = { ...NO_BONUSES };
  const multiplier = companionEffectMultiplier(owned.stars, owned.level);
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

export function canFeed(state: CompanionState, id: CompanionId): boolean {
  const owned = state.owned[id];
  return owned !== undefined && owned.level < MAX_COMPANION_LEVEL;
}

export function feed(state: CompanionState, id: CompanionId): CompanionState {
  const owned = state.owned[id];
  if (owned === undefined || !canFeed(state, id)) {
    return state;
  }
  return { ...state, owned: { ...state.owned, [id]: { ...owned, level: owned.level + 1 } } };
}

export interface ExpeditionLoot {
  readonly shards: number;
  readonly ores: number;
}

/** Butin d'une expédition : des éclats et du minerai, jamais d'or. */
export function expeditionLoot(id: CompanionId, hours: number): ExpeditionLoot {
  return {
    shards: Math.round(hours * EXPEDITION_SHARDS_PER_HOUR * EXPEDITION_RARITY_BONUS[COMPANIONS[id].rarity]),
    ores: Math.floor(hours / EXPEDITION_HOURS_PER_ORE),
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

/** Ramène un compagnon rentré ; renvoie null s'il est encore parti. */
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
  return { state: { ...state, expeditions }, loot: expeditionLoot(id, expedition.hours) };
}

// ─── Sauvegarde ──────────────────────────────────────────────────────────────

const isCompanionId = (value: unknown): value is CompanionId => (COMPANION_IDS as readonly unknown[]).includes(value);
const isRarity = (value: unknown): value is Rarity => (RARITY_IDS as readonly unknown[]).includes(value);
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const isCount = (value: unknown, min: number, max: number): boolean =>
  Number.isSafeInteger(value) && (value as number) >= min && (value as number) <= max;

export function isValidCompanionState(value: unknown): value is CompanionState {
  if (!isRecord(value)) {
    return false;
  }
  const { owned, active, eggs, incubating, sinceLegendary, gifted, expeditions } = value;
  return (
    isRecord(owned) &&
    Object.entries(owned).every(
      ([id, entry]) =>
        isCompanionId(id) && isRecord(entry) && isCount(entry['stars'], 1, MAX_STARS) && isCount(entry['level'], 1, MAX_COMPANION_LEVEL),
    ) &&
    (active === null || (isCompanionId(active) && owned[active] !== undefined)) &&
    Array.isArray(eggs) &&
    eggs.every(isRarity) &&
    (incubating === null || (isRecord(incubating) && isRarity(incubating['rarity']) && Number.isFinite(incubating['endsAt']))) &&
    isCount(sinceLegendary, 0, LEGENDARY_PITY) &&
    typeof gifted === 'boolean' &&
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
