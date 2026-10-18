import { TestBed } from '@angular/core/testing';

import { ABYSS_RUN_MS } from '../balance/abyss';
import { CLOCK } from '../shared/clock';
import { RANDOM } from '../shared/random';
import { GeodeShards } from '../wallet/geode-shards';
import { Abyss } from './abyss';

describe('Abyss', () => {
  let now = 0;

  function setup(formIndex: number, abyss?: unknown): Abyss {
    localStorage.clear();
    now = new Date(2026, 9, 14, 10).getTime();
    localStorage.setItem('mine-explorer.evolution', String(formIndex));
    localStorage.setItem('mine-explorer.progress', JSON.stringify({ zone: 6, stage: 1, damage: 0 }));
    if (abyss !== undefined) {
      localStorage.setItem('mine-explorer.abyss', JSON.stringify(abyss));
    }
    TestBed.configureTestingModule({
      providers: [
        { provide: CLOCK, useValue: () => now },
        { provide: RANDOM, useValue: () => 0.9 },
      ],
    });
    return TestBed.inject(Abyss);
  }

  beforeEach(() => vi.useFakeTimers());

  afterEach(() => {
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });

  it('reste fermé avant le Contremaître', () => {
    const abyss = setup(1);
    expect(abyss.unlocked()).toBe(false);
    expect(abyss.start()).toBe(false);
  });

  it('compte un essai dès le départ, puis paie les étages à la fin des 30 s', () => {
    const abyss = setup(2);
    expect(abyss.start()).toBe(true);
    expect(abyss.runsLeft()).toBe(2);
    expect(abyss.start()).toBe(false);
    // Le joueur tape le rocher 200 fois : les premiers étages tombent
    for (let i = 0; i < 200; i++) {
      abyss.tap('rock');
    }
    now += ABYSS_RUN_MS + 1000;
    vi.advanceTimersByTime(100);
    const result = abyss.lastResult();
    expect(abyss.running()).toBe(false);
    expect(result?.floors).toBeGreaterThan(0);
    expect(abyss.record()).toBe(result?.floors);
    expect(TestBed.inject(GeodeShards).amount()).toBe(result?.shards);
  });

  it("ferme sans planter une descente de l'ancienne version restée dans la sauvegarde", () => {
    const abyss = setup(2, { record: 3, day: '2026-10-14', runsUsed: 1, active: { startedAt: 0, dps: 1 } });
    expect(abyss.running()).toBe(false);
    expect(abyss.record()).toBe(3);
    expect(abyss.runsLeft()).toBe(2);
  });
});
