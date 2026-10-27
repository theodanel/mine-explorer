import {
  Counters,
  DAILY_MISSIONS,
  dayKey,
  EMPTY_COUNTERS,
  isComplete,
  isValidCounters,
  MissionDef,
  missionProgress,
} from './mission-rules';

const gauges = { stagesReached: 1, pickaxeLevel: 1 };

function counters(overrides: Partial<Counters>): Counters {
  return { ...EMPTY_COUNTERS, ...overrides };
}

describe('avancement', () => {
  const rocks = DAILY_MISSIONS[0];
  const stage: MissionDef = { id: 'filon', label: 'Atteins le filon 1-5', metric: { kind: 'gauge', id: 'stagesReached' }, target: 5, reward: { shards: 1, gold: 0 } };

  it('mesure un compteur depuis le début de la mission', () => {
    const baseline = counters({ rocksBroken: 10 });
    expect(missionProgress(rocks, counters({ rocksBroken: 10 }), baseline, gauges)).toBe(0);
    expect(isComplete(rocks, counters({ rocksBroken: 11 }), baseline, gauges)).toBe(true);
  });

  it('lit une jauge telle quelle', () => {
    expect(missionProgress(stage, EMPTY_COUNTERS, EMPTY_COUNTERS, { ...gauges, stagesReached: 3 })).toBe(3);
    expect(isComplete(stage, EMPTY_COUNTERS, EMPTY_COUNTERS, { ...gauges, stagesReached: 5 })).toBe(true);
  });

  it('plafonne l\'avancement à l\'objectif', () => {
    expect(missionProgress(DAILY_MISSIONS[1], counters({ itemsForged: 500 }), EMPTY_COUNTERS, gauges)).toBe(10);
  });
});

describe('outils', () => {
  it('donne le jour local', () => {
    expect(dayKey(new Date(2026, 9, 11, 23, 59).getTime())).toBe('2026-10-11');
  });

  it('valide des compteurs', () => {
    expect(isValidCounters(EMPTY_COUNTERS)).toBe(true);
    expect(isValidCounters({ ...EMPTY_COUNTERS, rocksBroken: -1 })).toBe(false);
  });
});
