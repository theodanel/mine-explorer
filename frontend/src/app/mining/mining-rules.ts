import { goldForDamage, ZONE_CLEAR_SHARDS } from '../balance/balance';

export interface StrikeReward {
  readonly gold: number;
  readonly shards: number;
}

/** Butin d'un coup : de l'or pour chaque PV miné, et un lot d'éclats si le coup termine la zone. */
export function strikeReward(damage: number, goldBonus: number, zoneCleared: boolean): StrikeReward {
  return { gold: goldForDamage(damage, goldBonus), shards: zoneCleared ? ZONE_CLEAR_SHARDS : 0 };
}
