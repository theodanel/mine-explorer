import { BONUS_IDS, NO_BONUSES } from '../balance/skill-tree';
import { describeBonus, describeBonuses } from './bonus-format';

describe('bonus-format', () => {
  it('écrit les pourcentages et les points en français', () => {
    expect(describeBonus('strikePct', 0.05)).toBe('+5 % de Frappe');
    expect(describeBonus('critChance', 0.02)).toBe('+2 points de Critique');
    expect(describeBonus('critChance', 0.01)).toBe('+1 point de Critique');
    expect(describeBonus('speed', -0.1)).toBe('−10 points de Vitesse');
    expect(describeBonus('cooldownPct', 0.15)).toBe('−15 % de recharge des sorts');
    expect(describeBonus('goldPct', 0.075)).toBe('+7,5 % d\'or');
  });

  it('a une phrase pour chaque bonus', () => {
    for (const id of BONUS_IDS) {
      expect(describeBonus(id, 0.1).length).toBeGreaterThan(0);
    }
  });

  it('ne garde que les bonus non nuls', () => {
    expect(describeBonuses(NO_BONUSES)).toEqual([]);
    expect(describeBonuses({ ...NO_BONUSES, blastPct: 0.2 })).toEqual(['+20 % de dégâts des explosions']);
  });
});
