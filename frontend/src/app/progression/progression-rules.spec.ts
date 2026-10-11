import { zoneHp } from '../balance/balance';
import { applyDamage, isValidProgress, remainingHp, START_PROGRESS, zoneHealth } from './progression-rules';

describe('applyDamage', () => {
  it('entame la vie de la zone', () => {
    expect(applyDamage(START_PROGRESS, 5)).toEqual({ progress: { zone: 1, damage: 5 }, clearedZone: null });
  });

  it('passe à la zone suivante quand la vie tombe à zéro, en perdant les dégâts en trop', () => {
    const almostDone = { zone: 1, damage: zoneHp(1) - 1 };
    expect(applyDamage(almostDone, 1000)).toEqual({ progress: { zone: 2, damage: 0 }, clearedZone: 1 });
  });
});

describe('vie de la zone', () => {
  it('donne les PV restants et la part de vie', () => {
    const half = { zone: 1, damage: zoneHp(1) / 2 };
    expect(remainingHp(half)).toBe(zoneHp(1) / 2);
    expect(zoneHealth(half)).toBeCloseTo(0.5);
  });
});

describe('isValidProgress', () => {
  it('accepte une progression cohérente', () => {
    expect(isValidProgress({ zone: 3, damage: 10 })).toBe(true);
  });

  it.each([
    null,
    { zone: 0, damage: 0 },
    { zone: 1, damage: -1 },
    { zone: 1, damage: zoneHp(1) },
    { zone: 1.5, damage: 0 },
    { zone: '1', damage: 0 },
  ])('rejette %j', (value: unknown) => {
    expect(isValidProgress(value)).toBe(false);
  });
});
