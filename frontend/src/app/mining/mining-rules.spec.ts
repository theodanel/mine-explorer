import { shardsForStage, ZONE_CLEAR_SHARDS } from '../balance/balance';
import { strikeReward } from './mining-rules';

const ONGOING = { zone: 1, stage: 1, stageCleared: false, zoneCleared: false, foundShard: false };

describe('strikeReward', () => {
  it('donne un quart de pièce par PV miné', () => {
    expect(strikeReward(40, 0, ONGOING)).toEqual({ gold: 10, shards: 0 });
  });

  it('applique le bonus d\'or du sac', () => {
    expect(strikeReward(40, 0.5, ONGOING).gold).toBe(15);
  });

  it('donne un éclat quand le coup en déterre un', () => {
    expect(strikeReward(10, 0, { ...ONGOING, foundShard: true }).shards).toBe(1);
  });

  it('donne les éclats du filon épuisé', () => {
    expect(strikeReward(10, 0, { ...ONGOING, stage: 7, stageCleared: true }).shards).toBe(shardsForStage(1, 7));
  });

  it('cumule l\'éclat déterré, le filon et la fin de zone', () => {
    const context = { zone: 1, stage: 15, stageCleared: true, zoneCleared: true, foundShard: true };
    expect(strikeReward(10, 0, context).shards).toBe(1 + shardsForStage(1, 15) + ZONE_CLEAR_SHARDS);
  });
});

describe('shardsForStage', () => {
  it('arrose les 5 premiers filons : deux forges chacun', () => {
    expect(shardsForStage(1, 1)).toBe(4);
    expect(shardsForStage(1, 5)).toBe(4);
  });

  it('donne une forge par filon jusqu\'à la zone 2', () => {
    expect(shardsForStage(1, 6)).toBe(2);
    expect(shardsForStage(2, 15)).toBe(2);
  });

  it('donne ensuite un éclat par filon', () => {
    expect(shardsForStage(3, 1)).toBe(1);
    expect(shardsForStage(9, 15)).toBe(1);
  });
});
