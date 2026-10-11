import { SHARD_INTERVAL_MS, ZONE_CLEAR_SHARDS } from '../balance/balance';
import { mineForShards, strikeReward } from './mining-rules';

describe('strikeReward', () => {
  it('donne un quart de pièce par PV miné', () => {
    expect(strikeReward(40, 0, false)).toEqual({ gold: 10, shards: 0 });
  });

  it('applique le bonus d\'or du sac', () => {
    expect(strikeReward(40, 0.5, false).gold).toBe(15);
  });

  it('offre un lot d\'éclats quand la zone est terminée', () => {
    expect(strikeReward(10, 0, true).shards).toBe(ZONE_CLEAR_SHARDS);
  });
});

describe('mineForShards', () => {
  it('donne un éclat toutes les 5 minutes de minage', () => {
    expect(mineForShards(0, SHARD_INTERVAL_MS * 2.5)).toEqual({ shards: 2, carryMs: SHARD_INTERVAL_MS / 2 });
  });

  it('garde le temps entamé pour le prochain éclat', () => {
    expect(mineForShards(SHARD_INTERVAL_MS - 10, 20)).toEqual({ shards: 1, carryMs: 10 });
  });
});
