import { BASE_STATS } from '../balance/balance';
import { workshopGoldCost, workshopMaterial, workshopOreCost, WORKSHOP_STEP } from '../balance/workshop';
import { isValidLevels, reinforce, reservedOres, upgradeCost } from './workshop-rules';

describe('workshop-rules', () => {
  it('renforce la stat principale de chaque emplacement', () => {
    const stats = reinforce(BASE_STATS, { pickaxe: 2, gloves: 1 });
    expect(stats.strikePower).toBeCloseTo(BASE_STATS.strikePower * (1 + 2 * WORKSHOP_STEP));
    expect(stats.critChance).toBeCloseTo(BASE_STATS.critChance * (1 + WORKSHOP_STEP));
    expect(stats.miningSpeed).toBe(BASE_STATS.miningSpeed);
  });

  it('ne change rien sans niveau', () => {
    expect(reinforce(BASE_STATS, {})).toEqual(BASE_STATS);
  });

  it('coûte de plus en plus cher, bien plus vite que le revenu', () => {
    expect(workshopGoldCost(1) / workshopGoldCost(0)).toBeGreaterThan(1.4);
    expect(workshopOreCost(0)).toBeLessThanOrEqual(workshopOreCost(10));
  });

  it('demande le minerai de la dernière zone terminée', () => {
    expect(workshopMaterial(7)).toBe('gold');
    expect(workshopMaterial(8)).toBe('mithril');
    expect(workshopMaterial(30)).toBe('divine');
    expect(upgradeCost(0, 8).ores).toEqual({ mithril: workshopOreCost(0) });
  });

  it('garde les minerais des évolutions à venir', () => {
    // Contremaître (index 2) : il reste Maître (Mithril, Cristal) et Légende (Magma, Divin)
    expect(reservedOres(2, 'mithril')).toBe(30);
    expect(reservedOres(2, 'gold')).toBe(0);
    expect(reservedOres(4, 'divine')).toBe(0);
  });

  it('refuse une sauvegarde invalide', () => {
    expect(isValidLevels({ pickaxe: 3 })).toBe(true);
    expect(isValidLevels({ pickaxe: -1 })).toBe(false);
    expect(isValidLevels({ hat: 1 })).toBe(false);
    expect(isValidLevels([1])).toBe(false);
  });
});
