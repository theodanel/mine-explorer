// Règles pures des artefacts : tirage, doublons, emplacements, réforge et bonus des artefacts portés.
import {
  AFFIX_RARITY_WEIGHTS,
  AFFIX_VALUES,
  ARTIFACT_IDS,
  ARTIFACT_MAX_LEVEL,
  ARTIFACT_RARITY_WEIGHTS,
  ARTIFACT_SLOT_COUNT,
  ArtifactAffix,
  ArtifactId,
  ARTIFACTS,
  artifactEffectMultiplier,
  REFORGE_BASE_ORES,
  REFORGE_COST_GROWTH,
  REFORGE_MAX_COST_FACTOR,
  REFORGE_ORE_KINDS,
} from '../balance/artifacts';
import { BONUS_IDS, BonusId, Bonuses, NO_BONUSES, RARITY_IDS } from '../balance/skill-tree';
import { TIER_IDS, TierId } from '../equipment/equipment.model';
import type { OreCost, OreStock } from '../ores/ores';
import type { Random } from '../shared/random';

type Slot = ArtifactId | null;

export interface ArtifactState {
  /** Niveau de chaque artefact trouvé ; absent = jamais trouvé. */
  readonly owned: Readonly<Partial<Record<ArtifactId, number>>>;
  /** Artefacts portés, un par emplacement ; seuls les emplacements ouverts comptent. */
  readonly slots: readonly Slot[];
  /** Effet secondaire gagné à la réforge. */
  readonly affixes: Readonly<Partial<Record<ArtifactId, ArtifactAffix>>>;
  /** Réforge tirée, en attente du choix du joueur : garder le nouvel effet ou revenir à l'ancien. */
  readonly pending: { readonly id: ArtifactId; readonly affix: ArtifactAffix } | null;
  /** Réforges gratuites, gagnées avec les doublons au-delà du niveau maximum. */
  readonly tokens: Readonly<Partial<Record<ArtifactId, number>>>;
  /** Réforges déjà payées de chaque artefact : le prix monte avec. */
  readonly reforges: Readonly<Partial<Record<ArtifactId, number>>>;
}

export const EMPTY_ARTIFACTS: ArtifactState = {
  owned: {},
  slots: Array.from({ length: ARTIFACT_SLOT_COUNT }, () => null),
  affixes: {},
  pending: null,
  tokens: {},
  reforges: {},
};

export interface ArtifactFind {
  readonly id: ArtifactId;
  /** new : première découverte ; levelUp : doublon qui fait monter de niveau ; maxed : doublon changé en jeton de réforge. */
  readonly kind: 'new' | 'levelUp' | 'maxed';
  readonly level: number;
}

function rollWeighted<T extends string>(weights: Readonly<Record<T, number>>, ids: readonly T[], random: Random): T {
  const total = ids.reduce((sum, id) => sum + weights[id], 0);
  let threshold = random() * total;
  for (const id of ids) {
    threshold -= weights[id];
    if (threshold < 0) {
      return id;
    }
  }
  return ids[ids.length - 1];
}

/** Tire d'abord une rareté selon ses poids, puis un artefact de cette rareté au hasard. */
export function rollArtifact(random: Random): ArtifactId {
  const rarity = rollWeighted(ARTIFACT_RARITY_WEIGHTS, RARITY_IDS, random);
  const pool = ARTIFACT_IDS.filter((id) => ARTIFACTS[id].rarity === rarity);
  return pool[Math.floor(random() * pool.length)];
}

export function addArtifact(state: ArtifactState, id: ArtifactId): { state: ArtifactState; find: ArtifactFind } {
  const level = state.owned[id];
  if (level === undefined) {
    // Le premier artefact trouvé s'équipe tout seul : la case d'artefact ne reste pas vide
    const slots = state.slots[0] === null ? [id, ...state.slots.slice(1)] : state.slots;
    return { state: { ...state, owned: { ...state.owned, [id]: 1 }, slots }, find: { id, kind: 'new', level: 1 } };
  }
  if (level >= ARTIFACT_MAX_LEVEL) {
    const tokens = { ...state.tokens, [id]: (state.tokens[id] ?? 0) + 1 };
    return { state: { ...state, tokens }, find: { id, kind: 'maxed', level } };
  }
  return {
    state: { ...state, owned: { ...state.owned, [id]: level + 1 } },
    find: { id, kind: 'levelUp', level: level + 1 },
  };
}

/** Emplacements ouverts selon la forme du mineur : 1 au départ, puis un de plus à chaque forme qui en ouvre. */
export function openSlotCount(formIndex: number, slotFormIndexes: readonly number[]): number {
  return 1 + slotFormIndexes.filter((index) => formIndex >= index).length;
}

/** Porte un artefact dans un emplacement ouvert ; s'il était déjà porté ailleurs, il change de place. */
export function equipArtifact(state: ArtifactState, id: ArtifactId, slot: number, openSlots: number): ArtifactState {
  if (state.owned[id] === undefined || slot < 0 || slot >= openSlots) {
    return state;
  }
  const slots = state.slots.map((current, index) => (index === slot ? id : current === id ? null : current));
  return { ...state, slots };
}

export function unequipArtifact(state: ArtifactState, slot: number): ArtifactState {
  return { ...state, slots: state.slots.map((current, index) => (index === slot ? null : current)) };
}

/** Premier emplacement ouvert et libre, sinon le premier : là où va un artefact qu'on équipe d'un toucher. */
export function preferredSlot(state: ArtifactState, openSlots: number): number {
  const free = state.slots.slice(0, openSlots).indexOf(null);
  return free === -1 ? 0 : free;
}

export function affixValue(affix: ArtifactAffix): number {
  return AFFIX_VALUES[affix.bonus]?.[RARITY_IDS.indexOf(affix.rarity)] ?? 0;
}

/** Effets d'un artefact à un niveau donné, avec son effet secondaire s'il en a un. */
export function artifactEffects(id: ArtifactId, level: number, affix?: ArtifactAffix): Bonuses {
  const totals: Record<BonusId, number> = { ...NO_BONUSES };
  const multiplier = artifactEffectMultiplier(level);
  for (const [bonus, value] of Object.entries(ARTIFACTS[id].effects) as [BonusId, number][]) {
    totals[bonus] += value * multiplier;
  }
  if (affix !== undefined) {
    totals[affix.bonus] += affixValue(affix);
  }
  return totals;
}

/** Bonus des artefacts portés dans les emplacements ouverts, additionnés. */
export function equippedArtifactBonuses(state: ArtifactState, openSlots: number): Bonuses {
  const totals: Record<BonusId, number> = { ...NO_BONUSES };
  for (const id of state.slots.slice(0, openSlots)) {
    const level = id === null ? undefined : state.owned[id];
    if (id === null || level === undefined) {
      continue;
    }
    const effects = artifactEffects(id, level, state.affixes[id]);
    for (const bonus of BONUS_IDS) {
      totals[bonus] += effects[bonus];
    }
  }
  return totals;
}

// ─── Réforge ────────────────────────────────────────────────────────────────

const AFFIX_BONUSES = Object.keys(AFFIX_VALUES) as BonusId[];

export function rollAffix(random: Random): ArtifactAffix {
  const bonus = AFFIX_BONUSES[Math.floor(random() * AFFIX_BONUSES.length)];
  return { bonus, rarity: rollWeighted(AFFIX_RARITY_WEIGHTS, RARITY_IDS, random) };
}

export function canReforge(state: ArtifactState, id: ArtifactId): boolean {
  return state.owned[id] === ARTIFACT_MAX_LEVEL && state.pending === null;
}

/** Minerais de chaque matériau pour la prochaine réforge de cet artefact. */
export function reforgeOresEach(state: ArtifactState, id: ArtifactId): number {
  const factor = Math.min(REFORGE_COST_GROWTH ** (state.reforges[id] ?? 0), REFORGE_MAX_COST_FACTOR);
  return Math.round(REFORGE_BASE_ORES * factor);
}

/** Les 3 matériaux dont le joueur a le plus, s'il en a assez de chacun ; null sinon. */
export function reforgeOreCost(stock: OreStock, each: number): OreCost | null {
  const richest = [...TIER_IDS].sort((a, b) => stock[b] - stock[a]).slice(0, REFORGE_ORE_KINDS);
  if (richest.length < REFORGE_ORE_KINDS || richest.some((tier) => stock[tier] < each)) {
    return null;
  }
  return Object.fromEntries(richest.map((tier): [TierId, number] => [tier, each]));
}

/**
 * Tire un nouvel effet secondaire, qui attend le choix du joueur. Paye avec un jeton s'il en a un (le prix ne monte
 * pas), sinon en minerais (payés par l'appelant).
 */
export function reforge(state: ArtifactState, id: ArtifactId, random: Random, withToken: boolean): ArtifactState {
  const pending = { id, affix: rollAffix(random) };
  if (withToken) {
    return { ...state, pending, tokens: { ...state.tokens, [id]: (state.tokens[id] ?? 0) - 1 } };
  }
  return { ...state, pending, reforges: { ...state.reforges, [id]: (state.reforges[id] ?? 0) + 1 } };
}

/** Garder le nouvel effet ou revenir à l'ancien : un tirage raté ne fait jamais rien perdre. */
export function resolveReforge(state: ArtifactState, keep: boolean): ArtifactState {
  if (state.pending === null) {
    return state;
  }
  const affixes = keep ? { ...state.affixes, [state.pending.id]: state.pending.affix } : state.affixes;
  return { ...state, affixes, pending: null };
}

// ─── Sauvegarde ─────────────────────────────────────────────────────────────

function isArtifactId(value: unknown): value is ArtifactId {
  return typeof value === 'string' && (ARTIFACT_IDS as readonly string[]).includes(value);
}

function isAffix(value: unknown): value is ArtifactAffix {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const { bonus, rarity } = value as Record<string, unknown>;
  return typeof bonus === 'string' && bonus in AFFIX_VALUES && (RARITY_IDS as readonly unknown[]).includes(rarity);
}

function isPending({ id, affix }: Record<string, unknown>, isOwned: (id: unknown) => boolean): boolean {
  return isOwned(id) && isAffix(affix);
}

function isCountMap(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.entries(value).every(([id, count]) => isArtifactId(id) && Number.isSafeInteger(count) && (count as number) >= 0)
  );
}

/**
 * Lit une sauvegarde, y compris l'ancienne (un seul artefact porté, `equipped`) : il passe dans le 1er emplacement.
 * Null si elle est invalide.
 */
export function parseArtifactState(value: unknown): ArtifactState | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const raw = value as Record<string, unknown>;
  const { owned, slots: savedSlots, equipped, affixes = {}, tokens = {}, reforges = {}, pending = null } = raw;
  if (typeof owned !== 'object' || owned === null) {
    return null;
  }
  const levelsValid = Object.entries(owned).every(
    ([id, level]) => isArtifactId(id) && Number.isSafeInteger(level) && (level as number) >= 1 && (level as number) <= ARTIFACT_MAX_LEVEL,
  );
  if (!levelsValid) {
    return null;
  }
  const isOwned = (id: unknown): boolean => isArtifactId(id) && id in owned;
  let slots: Slot[];
  if (savedSlots !== undefined) {
    if (!Array.isArray(savedSlots) || savedSlots.length !== ARTIFACT_SLOT_COUNT || !savedSlots.every((slot) => slot === null || isOwned(slot))) {
      return null;
    }
    slots = savedSlots as Slot[];
  } else {
    // Ancienne sauvegarde : l'artefact porté passe dans le 1er emplacement
    if (equipped !== null && !isOwned(equipped)) {
      return null;
    }
    slots = [(equipped as Slot) ?? null, ...Array.from({ length: ARTIFACT_SLOT_COUNT - 1 }, (): Slot => null)];
  }
  const affixesValid =
    typeof affixes === 'object' && affixes !== null && Object.entries(affixes).every(([id, affix]) => isOwned(id) && isAffix(affix));
  const pendingValid = pending === null || (typeof pending === 'object' && isPending(pending as Record<string, unknown>, isOwned));
  if (!affixesValid || !pendingValid || !isCountMap(tokens) || !isCountMap(reforges)) {
    return null;
  }
  return {
    owned: owned as ArtifactState['owned'],
    slots,
    affixes: affixes as ArtifactState['affixes'],
    pending: pending as ArtifactState['pending'],
    tokens: tokens as ArtifactState['tokens'],
    reforges: reforges as ArtifactState['reforges'],
  };
}
