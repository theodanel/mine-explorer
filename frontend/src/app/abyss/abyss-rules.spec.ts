import { floorHp, GUARDIAN_EVERY, RECORD_SHARDS, RECORD_STONES } from '../balance/abyss';
import { rockHp } from '../balance/balance';
import { descend, EMPTY_ABYSS, isValidAbyssState, MAX_FLOOR, runReward, runsLeft } from './abyss-rules';

describe('abyss-rules', () => {
  it('fait commencer le Puits au filon 5-1, deux filons plus profond à chaque étage', () => {
    expect(floorHp(1)).toBe(rockHp(5, 1));
    expect(floorHp(2)).toBe(rockHp(5, 3));
  });

  it('met un gardien trois fois plus dur tous les 10 étages', () => {
    // Étage 10 : le filon 5-19, soit le 6-4, triplé
    expect(floorHp(GUARDIAN_EVERY)).toBe(rockHp(6, 4) * 3);
    expect(floorHp(GUARDIAN_EVERY) / floorHp(GUARDIAN_EVERY - 1)).toBeGreaterThan(3);
  });

  it('compte les étages franchis et la part du filon en cours', () => {
    expect(descend(0)).toEqual({ floors: 0, progress: 0 });
    expect(descend(floorHp(1) + floorHp(2) / 2)).toEqual({ floors: 1, progress: 0.5 });
  });

  it("s'arrête au garde-fou même avec des dégâts absurdes", () => {
    expect(descend(Number.MAX_VALUE).floors).toBe(MAX_FLOOR);
  });

  it('paie un éclat par étage, et le record une seule fois par palier de 5', () => {
    expect(runReward(7, 0)).toEqual({ shards: 7 + RECORD_SHARDS, stones: RECORD_STONES, newRecordSteps: 1 });
    expect(runReward(7, 9)).toEqual({ shards: 7, stones: 0, newRecordSteps: 0 });
    expect(runReward(15, 4).newRecordSteps).toBe(3);
  });

  it('remet 3 essais chaque jour', () => {
    const state = { ...EMPTY_ABYSS, day: '2026-10-14', runsUsed: 3 };
    expect(runsLeft(state, '2026-10-14')).toBe(0);
    expect(runsLeft(state, '2026-10-15')).toBe(3);
  });

  it('refuse une sauvegarde trafiquée', () => {
    expect(isValidAbyssState({ record: 12, day: '2026-10-14', runsUsed: 1, active: null })).toBe(true);
    expect(isValidAbyssState({ record: 12, day: '2026-10-14', runsUsed: 1, active: { startedAt: 5, dps: 10 } })).toBe(true);
    expect(isValidAbyssState({ record: -1, day: '', runsUsed: 0, active: null })).toBe(false);
    expect(isValidAbyssState({ record: 0, day: 'hier', runsUsed: 0, active: null })).toBe(false);
    expect(isValidAbyssState({ record: 0, day: '', runsUsed: 9, active: null })).toBe(false);
    expect(isValidAbyssState({ record: 0, day: '', runsUsed: 0, active: { startedAt: 'maintenant', dps: 1 } })).toBe(false);
  });
});
