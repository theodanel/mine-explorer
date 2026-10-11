import { goldForDamage, SHARD_INTERVAL_MS, ZONE_CLEAR_SHARDS } from '../balance/balance';

export interface StrikeReward {
  readonly gold: number;
  readonly shards: number;
}

/** Butin d'un coup : de l'or pour chaque PV miné, et un lot d'éclats si le coup termine la zone. */
export function strikeReward(damage: number, goldBonus: number, zoneCleared: boolean): StrikeReward {
  return { gold: goldForDamage(damage, goldBonus), shards: zoneCleared ? ZONE_CLEAR_SHARDS : 0 };
}

export interface ShardTimer {
  readonly shards: number;
  /** Temps de minage accumulé vers le prochain éclat. */
  readonly carryMs: number;
}

/** Un éclat toutes les 5 minutes de minage actif, quel que soit le nombre de coups. */
export function mineForShards(carryMs: number, elapsedMs: number): ShardTimer {
  const total = carryMs + Math.max(elapsedMs, 0);
  return { shards: Math.floor(total / SHARD_INTERVAL_MS), carryMs: total % SHARD_INTERVAL_MS };
}
