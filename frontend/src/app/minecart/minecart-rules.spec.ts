import { MINECART_DAILY_RUNS } from '../balance/minecart';
import { isValidMinecartState, rideReward, runsLeft } from './minecart-rules';

describe('minecart-rules', () => {
  const bonus = (steps: number) => steps * 1000;

  it('paie le minerai et les pépites ramassés', () => {
    expect(rideReward(320, { ores: 12, nuggets: 3 }, 1000, 50, bonus)).toEqual({ ores: 12, gold: 150, newRecordSteps: 0 });
  });

  it('ajoute le bonus des paliers de 500 m battus pour la première fois', () => {
    expect(rideReward(1250, { ores: 0, nuggets: 0 }, 600, 50, bonus)).toEqual({ ores: 0, gold: 1000, newRecordSteps: 1 });
  });

  it('remet 3 courses chaque jour', () => {
    expect(runsLeft({ record: 0, day: '2026-10-14', runsUsed: 2 }, '2026-10-14')).toBe(1);
    expect(runsLeft({ record: 0, day: '2026-10-13', runsUsed: 3 }, '2026-10-14')).toBe(MINECART_DAILY_RUNS);
  });

  it('refuse une sauvegarde invalide', () => {
    expect(isValidMinecartState({ record: 420, day: '2026-10-14', runsUsed: 1 })).toBe(true);
    expect(isValidMinecartState({ record: -1, day: '', runsUsed: 0 })).toBe(false);
    expect(isValidMinecartState({ record: 0, day: 'hier', runsUsed: 0 })).toBe(false);
    expect(isValidMinecartState({ record: 0, day: '', runsUsed: 9 })).toBe(false);
  });
});
