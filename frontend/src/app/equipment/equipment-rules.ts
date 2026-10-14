// Règles pures de l'équipement : aucune dépendance à Angular ni au stockage, pour être testées
// et portées telles quelles côté Spring quand le serveur fera les tirages. Les chiffres viennent de balance.ts.
import {
  AFFIX_SHARE,
  affixCount,
  BASE_STATS,
  expectedStatValue,
  hitsPerSecond,
  ITEM_BASE_STRIKE_SHARE,
  NEXT_AFFIX_RATIO,
  powerOf,
  sellPriceFor,
  STAT_CAPS,
  STAT_ROLL_SPREAD,
  tierChances,
} from '../balance/balance';
import type { Random } from '../shared/random';
import {
  EquippedItems,
  Item,
  MiningStats,
  SLOT_IDS,
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
 * Toute pièce a une Frappe de base, puis 1 à 4 affixes tirés dans les cinq stats, sans doublon : n'importe quel
 * emplacement peut porter n'importe quelle stat. Un affixe de Frappe s'ajoute à la Frappe de base.
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
    const [stat] = candidates.splice(Math.floor(random() * candidates.length), 1);
    const ratio = AFFIX_SHARE[stat] * (i === 0 ? 1 : NEXT_AFFIX_RATIO);
    stats[stat] = (stats[stat] ?? 0) + rollStat(stat, tier, level, ratio, random);
  }
  return { id: createId(), slot, tier, level, stats };
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

export function computeStats(equipped: EquippedItems): MiningStats {
  const total: MiningStats = { ...BASE_STATS };
  for (const slot of SLOT_IDS) {
    const item = equipped[slot];
    for (const stat of STAT_IDS) {
      total[stat] += item?.stats[stat] ?? 0;
    }
  }
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
export function powerDelta(equipped: EquippedItems, candidate: Item, levels: WorkshopLevels = {}): number {
  const swapped: EquippedItems = { ...equipped, [candidate.slot]: candidate };
  return gearPower(swapped, levels) - gearPower(equipped, levels);
}

function gearPower(equipped: EquippedItems, levels: WorkshopLevels): number {
  return computePower(reinforce(computeStats(equipped), levels, equipped));
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
