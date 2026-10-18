import { applyFarmDamage, isValidFarm } from '../progression/progression-rules';
import { echoRockHp } from './echoes';

describe('Échos', () => {
  it("donnent des filons d'environ 2 minutes à la Puissance du joueur", () => {
    expect(echoRockHp(1000, 2)).toBe(240_000);
  });

  it('cassent un filon aux PV de l’Écho, et gardent ces PV dans la sauvegarde', () => {
    const farm = { zone: 3, damage: 0, echoHp: 500 };
    expect(applyFarmDamage(farm, 499).rockBroken).toBe(false);
    expect(applyFarmDamage(farm, 500).rockBroken).toBe(true);
    const progress = { zone: 14, stage: 1, damage: 0 };
    expect(isValidFarm({ zone: 3, damage: 499, echoHp: 500 }, progress)).toBe(true);
    expect(isValidFarm({ zone: 3, damage: 0, echoHp: -1 }, progress)).toBe(false);
  });
});
