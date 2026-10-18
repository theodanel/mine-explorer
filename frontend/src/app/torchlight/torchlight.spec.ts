import { TestBed } from '@angular/core/testing';

import { TORCHLIGHT_DAILY_RUNS } from '../balance/torchlight';
import { Companions } from '../companions/companions';
import { MissionCounters } from '../missions/mission-counters';
import { CLOCK } from '../shared/clock';
import { Torchlight, isValidTorchlightState } from './torchlight';
import { orthogonalNeighbours } from './torchlight-game';

describe('Torchlight', () => {
  function setup(formIndex: number): Torchlight {
    localStorage.clear();
    localStorage.setItem('mine-explorer.evolution', String(formIndex));
    localStorage.setItem('mine-explorer.progress', JSON.stringify({ zone: 12, stage: 1, damage: 0 }));
    TestBed.configureTestingModule({ providers: [{ provide: CLOCK, useValue: () => new Date(2026, 9, 15, 10).getTime() }] });
    return TestBed.inject(Torchlight);
  }

  afterEach(() => TestBed.resetTestingModule());

  it('reste fermée avant la Légende', () => {
    expect(setup(3).start()).toBe(false);
  });

  it("part en expédition, ramasse et rentre avec ses pierres d'éveil", () => {
    const torchlight = setup(4);
    const companions = TestBed.inject(Companions);
    const before = companions.stones();
    expect(torchlight.start()).toBe(true);
    expect(torchlight.runsLeft()).toBe(TORCHLIGHT_DAILY_RUNS - 1);
    expect(TestBed.inject(MissionCounters).counters().adventureRuns).toBe(1);
    const expedition = torchlight.expedition();
    const next = orthogonalNeighbours(expedition?.position ?? 0)[0];
    torchlight.stepTo(next);
    torchlight.goBack();
    const result = torchlight.lastResult();
    expect(result?.status).toBe('left');
    expect(companions.stones()).toBe(before + (result?.stones ?? 0));
    torchlight.leave();
    expect(torchlight.expedition()).toBeNull();
  });

  it('rejette une sauvegarde invalide', () => {
    expect(isValidTorchlightState({ day: '2026-10-15', runsUsed: 1 })).toBe(true);
    expect(isValidTorchlightState({ day: 'hier', runsUsed: 0 })).toBe(false);
    expect(isValidTorchlightState({ day: '', runsUsed: 9 })).toBe(false);
  });
});
