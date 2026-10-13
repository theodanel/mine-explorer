import { TestBed } from '@angular/core/testing';

import { ABYSS_RUN_MS } from '../balance/abyss';
import { Companions } from '../companions/companions';
import { CLOCK } from '../shared/clock';
import { GeodeShards } from '../wallet/geode-shards';
import { Abyss } from './abyss';

describe('Abyss', () => {
  let now = 0;

  function setup(formIndex: number, abyss?: unknown): Abyss {
    localStorage.clear();
    now = new Date(2026, 9, 14, 10).getTime();
    localStorage.setItem('mine-explorer.evolution', String(formIndex));
    if (abyss !== undefined) {
      localStorage.setItem('mine-explorer.abyss', JSON.stringify(abyss));
    }
    TestBed.configureTestingModule({ providers: [{ provide: CLOCK, useValue: () => now }] });
    return TestBed.inject(Abyss);
  }

  afterEach(() => TestBed.resetTestingModule());

  it('reste fermé avant le Contremaître', () => {
    const abyss = setup(1);
    expect(abyss.unlocked()).toBe(false);
    expect(abyss.start()).toBe(false);
  });

  it('compte un essai dès le départ et en laisse 2', () => {
    const abyss = setup(2);
    expect(abyss.start()).toBe(true);
    expect(abyss.runsLeft()).toBe(2);
    expect(abyss.start()).toBe(false);
  });

  it('paie la descente à la fin du chrono', () => {
    // Une descente déjà finie dans la sauvegarde, avec une Puissance qui passe 5 étages : elle est payée au chargement
    const abyss = setup(2, { record: 0, day: '2026-10-14', runsUsed: 1, active: { startedAt: 0, dps: 1e9 } });
    const result = abyss.lastResult();
    expect(result?.floors).toBeGreaterThan(5);
    expect(result?.newRecord).toBe(true);
    expect(abyss.record()).toBe(result?.floors);
    expect(abyss.running()).toBe(false);
    expect(TestBed.inject(GeodeShards).amount()).toBe(result?.shards);
    expect(TestBed.inject(Companions).stones()).toBeGreaterThanOrEqual(result?.stones ?? 0);
  });

  it('reprend une descente en cours après un rechargement', () => {
    const abyss = setup(2, { record: 3, day: '2026-10-14', runsUsed: 1, active: { startedAt: 0, dps: 1 } });
    // startedAt à 0 : le chrono est fini depuis longtemps, la descente se termine tout de suite
    expect(abyss.running()).toBe(false);
    expect(ABYSS_RUN_MS).toBe(30_000);
  });
});
