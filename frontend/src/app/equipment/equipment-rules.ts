// Règles pures de l'équipement : aucune dépendance à Angular ni au stockage, pour être testées
// et portées telles quelles côté Spring quand le serveur fera les tirages. Les chiffres viennent de balance.ts.
import { AWAKENING_SET_STRIKE_PER_LEVEL } from '../balance/awakening';
import {
  AFFINITY_WEIGHT,
  AFFIX_SHARE,
  affixCount,
  BASE_STATS,
  expectedStatValue,
  hitsPerSecond,
  ITEM_BASE_STRIKE_SHARE,
  NEXT_AFFIX_RATIO,
  powerOf,
  sellPriceFor,
  SET_BONUSES,
  STAT_CAPS,
  STAT_ROLL_SPREAD,
  tierChances,
  tierIndex,
} from '../balance/balance';
import type { Random } from '../shared/random';
import { applyAwakening, AwakeningLevels, lowestAwakening } from './awakening-rules';
import {
  EquippedItems,
  Item,
  MiningStats,
  SLOT_AFFINITIES,
  SLOT_IDS,
  SlotId,
  STAT_IDS,
  STATS,
  StatId,
  TIER_IDS,
  TierId,
} from './equipment.model';
import type { WorkshopLevels } from '../balance/workshop';
import { reinforce } from '../workshop/workshop-rules';

const PERCENT_PRECISION = 1000;

export interface HitResult {
  readonly damage: number;
  readonly critical: boolean;
}

export interface StatComparison {
  readonly stat: StatId;
  readonly current: number;
  readonly candidate: number;
}

/**
 * Forge un objet : son palier dépend uniquement du niveau de la pioche, et son niveau est celui de la pioche.
 * Toute pièce a une Frappe de base, puis 1 à 4 affixes tirés dans les cinq stats, sans doublon. N'importe quel
 * emplacement peut porter n'importe quelle stat, mais ses deux affinités sortent 3 fois plus souvent. Un affixe de
 * Frappe s'ajoute à la Frappe de base.
 */
export function rollItem(random: Random, createId: () => string, pickaxeLevel: number, forcedTier?: TierId): Item {
  const slot = pickOne(SLOT_IDS, random);
  const chances = tierChances(pickaxeLevel);
  // Qualité imposée : la Forge express récompense une bonne partie par une meilleure qualité
  const tier = forcedTier ?? pickWeighted(TIER_IDS, (t) => chances[t], random);
  const level = pickaxeLevel;

  const stats: Partial<MiningStats> = { strikePower: rollStat('strikePower', tier, level, ITEM_BASE_STRIKE_SHARE, random) };
  const candidates = [...STAT_IDS];
  for (let i = 0; i < affixCount(tier); i++) {
    const stat = pickWeighted(candidates, (candidate) => affinityWeight(slot, candidate), random);
    candidates.splice(candidates.indexOf(stat), 1);
    const ratio = AFFIX_SHARE[stat] * (i === 0 ? 1 : NEXT_AFFIX_RATIO);
    stats[stat] = (stats[stat] ?? 0) + rollStat(stat, tier, level, ratio, random);
  }
  return { id: createId(), slot, tier, level, stats };
}

/** Poids d'une stat dans les tirages d'affixes de cet emplacement. */
export function affinityWeight(slot: SlotId, stat: StatId): number {
  return SLOT_AFFINITIES[slot].includes(stat) ? AFFINITY_WEIGHT : 1;
}

/**
 * Vrai si l'objet porte cette stat en affixe. Toute pièce a une Frappe de base : la Frappe ne compte comme affixe
 * qu'au-delà du maximum que la base peut tirer. Le plus petit affixe de Frappe dépasse ce maximum, sans ambiguïté.
 */
export function hasAffix(item: Item, stat: StatId): boolean {
  const value = item.stats[stat];
  if (value === undefined) {
    return false;
  }
  if (stat !== 'strikePower') {
    return true;
  }
  const baseMax = expectedStatValue('strikePower', item.tier, item.level, ITEM_BASE_STRIKE_SHARE) * (1 + STAT_ROLL_SPREAD);
  return value > Math.max(1, Math.round(baseMax));
}

/** Panoplie portée : le palier le plus représenté, son nombre de pièces et le bonus de Frappe qu'il donne. */
export interface GearSet {
  readonly tier: TierId;
  readonly pieces: number;
  readonly strikePct: number;
}

/**
 * Palier le plus porté (à égalité, le plus haut), ou null sans aucune pièce. Panoplie Divin complète : le bonus
 * grandit avec l'Éveil de la pièce la moins éveillée.
 */
export function gearSet(equipped: EquippedItems, awakening: AwakeningLevels = {}): GearSet | null {
  const counts = new Map<TierId, number>();
  for (const slot of SLOT_IDS) {
    const tier = equipped[slot]?.tier;
    if (tier !== undefined) {
      counts.set(tier, (counts.get(tier) ?? 0) + 1);
    }
  }
  let best: { tier: TierId; pieces: number } | null = null;
  for (const [tier, pieces] of counts) {
    if (best === null || pieces > best.pieces || (pieces === best.pieces && tierIndex(tier) > tierIndex(best.tier))) {
      best = { tier, pieces };
    }
  }
  if (best === null) {
    return null;
  }
  const pieces = best.pieces;
  const base = SET_BONUSES.find((bonus) => pieces >= bonus.pieces)?.strikePct ?? 0;
  const awakened = pieces === SLOT_IDS.length ? lowestAwakening(equipped, awakening) * AWAKENING_SET_STRIKE_PER_LEVEL : 0;
  return { ...best, strikePct: base + awakened };
}

export function computeStats(equipped: EquippedItems, awakening: AwakeningLevels = {}, rebirths = 0): MiningStats {
  const total: MiningStats = { ...BASE_STATS };
  const awakened = applyAwakening(equipped, awakening, rebirths);
  for (const slot of SLOT_IDS) {
    const item = awakened[slot];
    for (const stat of STAT_IDS) {
      total[stat] += item?.stats[stat] ?? 0;
    }
  }
  // La panoplie multiplie toute la Frappe de l'équipement : l'Atelier et l'évolution s'y appliquent ensuite
  total.strikePower *= 1 + (gearSet(equipped, awakening)?.strikePct ?? 0);
  for (const stat of STAT_IDS) {
    const cap = STAT_CAPS[stat];
    if (cap !== undefined) {
      total[stat] = Math.min(total[stat], cap);
    }
  }
  return total;
}

/** Un coup inflige la Frappe, multipliée sur un critique. Il ne rapporte rien tant que le rocher tient. */
export function resolveHit(stats: MiningStats, random: Random): HitResult {
  const critical = random() < stats.critChance;
  const multiplier = critical ? 1 + stats.critDamage : 1;
  return { damage: Math.round(stats.strikePower * multiplier), critical };
}

/** Puissance : le chiffre central du jeu. Deux configurations de même Puissance cassent aussi vite. */
export function computePower(stats: MiningStats): number {
  return powerOf(stats);
}

/**
 * Gain (ou perte) de Puissance si l'on équipe cet objet à la place de celui porté. Les niveaux d'Atelier comptent :
 * ils dépendent de la qualité de la pièce, donc changer de qualité change aussi le bonus d'Atelier.
 */
export function powerDelta(
  equipped: EquippedItems,
  candidate: Item,
  levels: WorkshopLevels = {},
  awakening: AwakeningLevels = {},
  rebirths = 0,
): number {
  const swapped: EquippedItems = { ...equipped, [candidate.slot]: candidate };
  return gearPower(swapped, levels, awakening, rebirths) - gearPower(equipped, levels, awakening, rebirths);
}

function gearPower(equipped: EquippedItems, levels: WorkshopLevels, awakening: AwakeningLevels, rebirths: number): number {
  return computePower(reinforce(computeStats(equipped, awakening, rebirths), levels, equipped));
}

/** Multiplicateur appliqué à la vitesse d'animation du mineur. */
export function speedMultiplier(stats: MiningStats): number {
  return hitsPerSecond(stats) / hitsPerSecond(BASE_STATS);
}

export function sellPrice(item: Item): number {
  return sellPriceFor(item.tier, item.level);
}

/** Lignes de comparaison pour toutes les stats présentes sur l'un ou l'autre objet. */
export function compareItems(current: Item | undefined, candidate: Item): StatComparison[] {
  return STAT_IDS.filter((stat) => current?.stats[stat] !== undefined || candidate.stats[stat] !== undefined).map(
    (stat) => ({ stat, current: current?.stats[stat] ?? 0, candidate: candidate.stats[stat] ?? 0 }),
  );
}

function rollStat(stat: StatId, tier: TierId, level: number, ratio: number, random: Random): number {
  const spread = 1 + (random() * 2 - 1) * STAT_ROLL_SPREAD;
  const value = expectedStatValue(stat, tier, level, ratio) * spread;
  if (STATS[stat].kind === 'integer') {
    // Au moins 1 : une Frappe à 0 serait un objet vide
    return Math.max(1, Math.round(value));
  }
  return Math.round(value * PERCENT_PRECISION) / PERCENT_PRECISION;
}

function pickOne<T>(values: readonly T[], random: Random): T {
  return values[Math.floor(random() * values.length)];
}

function pickWeighted<T>(values: readonly T[], weightOf: (value: T) => number, random: Random): T {
  const totalWeight = values.reduce((sum, value) => sum + weightOf(value), 0);
  let threshold = random() * totalWeight;
  for (const value of values) {
    threshold -= weightOf(value);
    if (threshold < 0) {
      return value;
    }
  }
  // Inatteignable tant que random() < 1, gardé pour les arrondis flottants
  return values[values.length - 1];
}
