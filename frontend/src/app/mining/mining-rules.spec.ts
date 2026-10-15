import { shardsForStage, zoneClearShards } from '../balance/balance';
import { strikeReward } from './mining-rules';

const ONGOING = { zone: 1, stage: 1, stageCleared: false, zoneCleared: false, foundShard: false };

describe('strikeReward', () => {
  it('donne 0,68 pièce par PV miné en jeu, deux fois le tarif hors ligne', () => {
    expect(strikeReward(40, 0, ONGOING)).toEqual({ gold: 27, shards: 0 });
  });

  it('applique le bonus d\'or du sac', () => {
    expect(strikeReward(40, 0.5, ONGOING).gold).toBe(41);
  });

  it('donne un éclat quand le coup en déterre un', () => {
    expect(strikeReward(10, 0, { ...ONGOING, foundShard: true }).shards).toBe(1);
  });

  it('donne les éclats du filon épuisé', () => {
    expect(strikeReward(10, 0, { ...ONGOING, stage: 7, stageCleared: true }).shards).toBe(shardsForStage(1, 7));
  });

  it('cumule l\'éclat déterré, le filon et la fin de zone', () => {
    const context = { zone: 1, stage: 15, stageCleared: true, zoneCleared: true, foundShard: true };
    expect(strikeReward(10, 0, context).shards).toBe(1 + shardsForStage(1, 15) + zoneClearShards(1));
  });
});

describe('shardsForStage', () => {
  it('arrose les 5 premiers filons : deux forges chacun', () => {
    expect(shardsForStage(1, 1)).toBe(4);
    expect(shardsForStage(1, 5)).toBe(4);
  });

  it('donne trois éclats par filon dans les zones adoucies (1 à 4)', () => {
    expect(shardsForStage(1, 6)).toBe(3);
    expect(shardsForStage(4, 15)).toBe(3);
  });

  it('donne ensuite un éclat par tranche de 40 s du filon : plus la zone est longue, plus il rapporte', () => {
    expect(shardsForStage(5, 1)).toBe(3);
    expect(shardsForStage(9, 15)).toBe(8);
    expect(shardsForStage(12, 1)).toBe(18);
  });

  it('remplit le coffre du gardien selon la zone', () => {
    expect(zoneClearShards(9)).toBe(45);
  });
});
