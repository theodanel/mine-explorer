import {
  Counters,
  DAILY_MISSIONS,
  dayKey,
  EMPTY_COUNTERS,
  isComplete,
  isValidCounters,
  mainMission,
  missionProgress,
} from './mission-rules';

const gauges = { stagesReached: 1, pickaxeLevel: 1 };

function counters(overrides: Partial<Counters>): Counters {
  return { ...EMPTY_COUNTERS, ...overrides };
}

describe('missions principales', () => {
  it('commencent par casser un premier rocher', () => {
    expect(mainMission(0)).toMatchObject({ label: 'Casse un rocher', target: 1, reward: { shards: 4 } });
  });

  it('enchaînent un cycle de 6 missions aux objectifs croissants', () => {
    expect(mainMission(6).label).toBe('Casse 5 rochers');
    expect(mainMission(2).label).toBe("Atteins l'étape 1-5");
    expect(mainMission(8).label).toBe("Atteins l'étape 1-11");
    expect(mainMission(5).label).toBe('Monte la pioche au niveau 2');
  });

  it('donnent un éclat de plus tous les 2 tours', () => {
    expect(mainMission(12).reward.shards).toBe(mainMission(0).reward.shards + 1);
  });
});

describe('avancement', () => {
  const rocks = mainMission(0);

  it('mesure un compteur depuis le début de la mission', () => {
    const baseline = counters({ rocksBroken: 10 });
    expect(missionProgress(rocks, counters({ rocksBroken: 10 }), baseline, gauges)).toBe(0);
    expect(isComplete(rocks, counters({ rocksBroken: 11 }), baseline, gauges)).toBe(true);
  });

  it('lit une jauge telle quelle', () => {
    const stage = mainMission(2);
    expect(missionProgress(stage, EMPTY_COUNTERS, EMPTY_COUNTERS, { ...gauges, stagesReached: 3 })).toBe(3);
    expect(isComplete(stage, EMPTY_COUNTERS, EMPTY_COUNTERS, { ...gauges, stagesReached: 5 })).toBe(true);
  });

  it('plafonne l\'avancement à l\'objectif', () => {
    expect(missionProgress(DAILY_MISSIONS[0], counters({ rocksBroken: 500 }), EMPTY_COUNTERS, gauges)).toBe(20);
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
