import { OFFLINE_CAP_MS } from '../balance/balance';
import { buildingGoldCost, campMaterial } from '../balance/camp';
import {
  buildingCost,
  collectedAt,
  EMPTY_CAMP,
  isMaxLevel,
  isValidCampState,
  offlineCapMs,
  tavernBonus,
  wellShardsPerHour,
  wellStock,
} from './camp-rules';

const HOUR = 60 * 60 * 1000;

describe('camp-rules', () => {
  it("ne change rien tant que rien n'est construit", () => {
    expect(tavernBonus({})).toBe(0);
    expect(offlineCapMs({})).toBe(OFFLINE_CAP_MS);
    expect(wellShardsPerHour({})).toBe(0);
    expect(wellStock(EMPTY_CAMP, 10 * HOUR)).toBe(0);
  });

  it("améliore l'absence avec la Taverne et l'Entrepôt", () => {
    expect(tavernBonus({ tavern: 10 })).toBeCloseTo(0.15);
    expect(offlineCapMs({ warehouse: 8 })).toBe(OFFLINE_CAP_MS + 2 * HOUR);
  });

  it("remplit le puits avec le temps, jusqu'à 12 h de production", () => {
    const state = { levels: { well: 10 }, wellCollectedAt: 0 };
    expect(wellStock(state, 2 * HOUR)).toBe(20);
    expect(wellStock(state, 100 * HOUR)).toBe(120);
  });

  it("garde les fractions d'éclat après une récolte", () => {
    const state = { levels: { well: 1 }, wellCollectedAt: 0 };
    // 1 éclat par heure : 1 h 30 donne 1 éclat et il reste une demi-heure en route
    expect(wellStock(state, 1.5 * HOUR)).toBe(1);
    expect(collectedAt(state, 1.5 * HOUR, 1)).toBeCloseTo(HOUR);
  });

  it('coûte de plus en plus cher, en minerai de la dernière zone terminée', () => {
    expect(buildingGoldCost(1)).toBeGreaterThan(buildingGoldCost(0) * 2);
    expect(buildingCost(0, 5)).toEqual({ gold: buildingGoldCost(0), ores: { [campMaterial(5)]: 3 } });
    expect(campMaterial(5)).toBe('iron');
  });

  it("s'arrête au niveau maximal", () => {
    expect(isMaxLevel({ warehouse: 8 }, 'warehouse')).toBe(true);
    expect(isMaxLevel({ tavern: 9 }, 'tavern')).toBe(false);
  });

  it('refuse une sauvegarde trafiquée', () => {
    expect(isValidCampState({ levels: { tavern: 3, well: 1 }, wellCollectedAt: 1000 })).toBe(true);
    expect(isValidCampState({ levels: { tavern: 99 }, wellCollectedAt: null })).toBe(false);
    expect(isValidCampState({ levels: { forge: 1 }, wellCollectedAt: null })).toBe(false);
    expect(isValidCampState({ levels: {}, wellCollectedAt: -1 })).toBe(false);
    expect(isValidCampState([])).toBe(false);
  });
});
