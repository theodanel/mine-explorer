import { minedGold, shardsForStage, zoneClearShards } from '../balance/balance';

export interface StrikeReward {
  readonly gold: number;
  readonly shards: number;
}

export interface StrikeContext {
  /** Filon frappé, avant que le coup ne fasse passer au suivant. */
  readonly zone: number;
  readonly stage: number;
  readonly stageCleared: boolean;
  readonly zoneCleared: boolean;
  /** Le coup a déterré un éclat (tiré au hasard par l'appelant, selon SHARD_FIND_CHANCE). */
  readonly foundShard: boolean;
}

/**
 * Butin d'un coup : de l'or pour chaque PV miné, parfois un éclat déterré,
 * des éclats quand le filon est épuisé et un bonus en fin de zone.
 */
export function strikeReward(damage: number, goldBonus: number, context: StrikeContext): StrikeReward {
  const foundShards = context.foundShard ? 1 : 0;
  const stageShards = context.stageCleared ? shardsForStage(context.zone, context.stage) : 0;
  const zoneShards = context.zoneCleared ? zoneClearShards(context.zone) : 0;
  return { gold: minedGold(damage, goldBonus), shards: foundShards + stageShards + zoneShards };
}
