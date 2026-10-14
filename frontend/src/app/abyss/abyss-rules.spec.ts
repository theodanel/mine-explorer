import { RECORD_SHARDS, RECORD_STONES } from '../balance/abyss';
import { EMPTY_ABYSS, isValidAbyssState, runReward, runsLeft } from './abyss-rules';

describe('abyss-rules', () => {
  it('paie les éclats de la descente, plus le record une seule fois par palier de 5', () => {
    expect(runReward(7, 8, 0)).toEqual({ shards: 8 + RECORD_SHARDS, stones: RECORD_STONES, newRecordSteps: 1 });
    expect(runReward(7, 7, 9)).toEqual({ shards: 7, stones: 0, newRecordSteps: 0 });
    expect(runReward(15, 15, 4).newRecordSteps).toBe(3);
  });

  it('remet 3 essais chaque jour', () => {
    const state = { ...EMPTY_ABYSS, day: '2026-10-14', runsUsed: 3 };
    expect(runsLeft(state, '2026-10-14')).toBe(0);
    expect(runsLeft(state, '2026-10-15')).toBe(3);
  });

  it('refuse une sauvegarde trafiquée', () => {
    expect(isValidAbyssState({ record: 12, day: '2026-10-14', runsUsed: 1, active: null })).toBe(true);
    expect(isValidAbyssState({ record: -1, day: '', runsUsed: 0, active: null })).toBe(false);
    expect(isValidAbyssState({ record: 0, day: 'hier', runsUsed: 0, active: null })).toBe(false);
    expect(isValidAbyssState({ record: 0, day: '', runsUsed: 9, active: null })).toBe(false);
    expect(isValidAbyssState({ record: 0, day: '', runsUsed: 0, active: { startedAt: 'maintenant', dps: 1 } })).toBe(false);
  });
});
