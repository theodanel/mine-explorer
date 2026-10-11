import { ZONE_CLEAR_SHARDS } from '../balance/balance';
import { strikeReward } from './mining-rules';

describe('strikeReward', () => {
  it('donne un quart de pièce par PV miné', () => {
    expect(strikeReward(40, 0, false)).toEqual({ gold: 10, shards: 0 });
  });

  it('applique le bonus d\'or du sac', () => {
    expect(strikeReward(40, 0.5, false).gold).toBe(15);
  });

  it('offre un petit lot d\'éclats quand la zone est terminée', () => {
    expect(strikeReward(10, 0, true).shards).toBe(ZONE_CLEAR_SHARDS);
  });
});
