// Règles pures qui réunissent toutes les sources de stats du mineur : équipement (évolution comprise),
// arbre de compétences, artefact et sorts actifs. Cumul : les familles se multiplient pour la Frappe et l'or,
// les points (Critique, Vitesse, chance d'éclat…) s'additionnent.
import { OFFLINE_EFFICIENCY, SHARD_FIND_CHANCE, STAT_CAPS } from '../balance/balance';
import { BONUS_IDS, BonusId, Bonuses, NO_BONUSES } from '../balance/skill-tree';
import type { MiningStats } from '../equipment/equipment.model';

/** Effets des sorts en cours. */
export interface SpellBuffs {
  readonly speed: number;
  readonly guaranteedCrit: boolean;
  readonly goldMultiplier: number;
  readonly shardChance: number;
}

export const NO_BUFFS: SpellBuffs = { speed: 0, guaranteedCrit: false, goldMultiplier: 1, shardChance: 0 };

export interface MinerProfile {
  readonly stats: MiningStats;
  /** Chance qu'un coup déterre un éclat. */
  readonly shardChance: number;
  /** Part de l'or gagnée pendant l'absence. */
  readonly offlineEfficiency: number;
  readonly cooldownPct: number;
  readonly durationPct: number;
  readonly blastPct: number;
}

/** Surplus au-delà des plafonds : 1 point de vitesse en trop = +100 % de Frappe, 1 point de critique = +2 de dégâts crit. */
const SPEED_TO_STRIKE = 1;
const CRIT_TO_CRIT_DAMAGE = 2;

/** Bonus relatifs (Frappe, or) : chaque famille multiplie. Les autres s'additionnent. */
const MULTIPLICATIVE: ReadonlySet<BonusId> = new Set<BonusId>(['strikePct', 'goldPct']);

/** Réunit plusieurs familles de bonus en un seul total, selon la règle de cumul. */
export function combineFamilies(families: readonly Bonuses[]): Bonuses {
  const totals: Record<BonusId, number> = { ...NO_BONUSES };
  for (const id of BONUS_IDS) {
    if (MULTIPLICATIVE.has(id)) {
      totals[id] = families.reduce((product, family) => product * (1 + family[id]), 1) - 1;
    } else {
      totals[id] = families.reduce((sum, family) => sum + family[id], 0);
    }
  }
  return totals;
}

/**
 * Profil complet du mineur. `gear` vient de l'équipement, évolution comprise ; les plafonds s'appliquent
 * aux bonus permanents, et les sorts passent au-dessus le temps de leur effet.
 */
export function minerProfile(gear: MiningStats, families: readonly Bonuses[], buffs: SpellBuffs): MinerProfile {
  const bonus = combineFamilies(families);
  const critCap = STAT_CAPS.critChance ?? 1;
  const speedCap = STAT_CAPS.miningSpeed ?? Infinity;
  const rawCrit = gear.critChance + bonus.critChance;
  const rawSpeed = gear.miningSpeed + bonus.speed;
  const permanentCrit = Math.min(rawCrit, critCap);
  const permanentSpeed = Math.min(rawSpeed, speedCap);
  // Plafonds convertis (27/10/2026) : la vitesse en trop devient de la Frappe, le critique en trop des dégâts critiques
  const extraSpeed = Math.max(rawSpeed - speedCap, 0);
  const extraCrit = Math.max(rawCrit - critCap, 0);
  const gold = (1 + gear.goldBonus) * (1 + bonus.goldPct) * buffs.goldMultiplier - 1;
  return {
    stats: {
      strikePower: gear.strikePower * (1 + bonus.strikePct) * (1 + extraSpeed * SPEED_TO_STRIKE),
      miningSpeed: permanentSpeed + buffs.speed,
      critChance: buffs.guaranteedCrit ? 1 : permanentCrit,
      critDamage: gear.critDamage + bonus.critDamage + extraCrit * CRIT_TO_CRIT_DAMAGE,
      goldBonus: gold,
    },
    shardChance: SHARD_FIND_CHANCE + bonus.shardChance + buffs.shardChance,
    offlineEfficiency: OFFLINE_EFFICIENCY + bonus.offlineEfficiency,
    cooldownPct: bonus.cooldownPct,
    durationPct: bonus.durationPct,
    blastPct: bonus.blastPct,
  };
}
