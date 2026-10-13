// Règles pures des événements de mine : tirage, délai, valeur des récompenses.
import { damagePerSecond, goldForDamage } from '../balance/balance';
import { EVENT_DELAY_MAX_MS, EVENT_DELAY_MIN_MS, EVENT_REWARDS, MINE_EVENT_IDS, MineEventId } from '../balance/mine-events';
import type { MiningStats } from '../equipment/equipment.model';
import type { Random } from '../shared/random';

/** Délai avant le prochain événement, en jeu actif : entre 2 et 4 minutes. */
export function nextEventDelayMs(random: Random): number {
  return EVENT_DELAY_MIN_MS + random() * (EVENT_DELAY_MAX_MS - EVENT_DELAY_MIN_MS);
}

/** Chaque événement a la même chance de sortir. */
export function rollEventId(random: Random): MineEventId {
  return MINE_EVENT_IDS[Math.min(Math.floor(random() * MINE_EVENT_IDS.length), MINE_EVENT_IDS.length - 1)];
}

/** Or que le mineur gagne en minant pendant `seconds` secondes avec ces stats. */
export function goldForSeconds(stats: MiningStats, seconds: number): number {
  return goldForDamage(damagePerSecond(stats) * seconds, stats.goldBonus);
}

export interface EventGain {
  readonly gold: number;
  readonly shards: number;
  readonly ores: number;
}

/** Ce que rapporte un événement réussi (un cristal pour la pluie). */
export function eventGain(id: MineEventId, stats: MiningStats): EventGain {
  const reward = EVENT_REWARDS[id];
  return { gold: goldForSeconds(stats, reward.goldSeconds), shards: reward.shards, ores: reward.ores };
}
