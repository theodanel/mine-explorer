import { TestBed } from '@angular/core/testing';

import { MINEHUNT_DAILY_RUNS } from '../balance/minehunt';
import { MissionCounters } from '../missions/mission-counters';
import { Ores } from '../ores/ores';
import { CLOCK } from '../shared/clock';
import { RANDOM } from '../shared/random';
import { Wallet } from '../wallet/wallet';
import { Minehunt } from './minehunt';
import { isValidMinehuntState, runsLeft } from './minehunt-rules';

describe('minehunt-rules', () => {
  it('remet 3 parties chaque jour et rejette une sauvegarde invalide', () => {
    expect(runsLeft({ day: '2026-10-14', runsUsed: 3 }, '2026-10-14')).toBe(0);
    expect(runsLeft({ day: '2026-10-13', runsUsed: 3 }, '2026-10-14')).toBe(MINEHUNT_DAILY_RUNS);
    expect(isValidMinehuntState({ day: 'hier', runsUsed: 0 })).toBe(false);
    expect(isValidMinehuntState({ day: '', runsUsed: 9 })).toBe(false);
  });
});

describe('Minehunt', () => {
  function setup(formIndex: number): Minehunt {
    localStorage.clear();
    localStorage.setItem('mine-explorer.evolution', String(formIndex));
    localStorage.setItem('mine-explorer.progress', JSON.stringify({ zone: 6, stage: 1, damage: 0 }));
    TestBed.configureTestingModule({
      providers: [
        { provide: CLOCK, useValue: () => new Date(2026, 9, 14, 10).getTime() },
        // Tirages hauts : aucun éboulement, aucun coffre
        { provide: RANDOM, useValue: () => 0.99 },
      ],
    });
    return TestBed.inject(Minehunt);
  }

  afterEach(() => TestBed.resetTestingModule());

  it('reste fermée avant le Contremaître', () => {
    expect(setup(1).start()).toBe(false);
  });

  it('joue une partie, paie le butin en remontant et compte pour les missions', () => {
    const minehunt = setup(2);
    expect(minehunt.start()).toBe(true);
    expect(minehunt.runsLeft()).toBe(MINEHUNT_DAILY_RUNS - 1);
    expect(TestBed.inject(MissionCounters).counters().adventureRuns).toBe(1);
    minehunt.breakNext();
    minehunt.cashOut();
    const result = minehunt.lastResult();
    expect(result?.status).toBe('cashed');
    expect(result?.ores).toBe(2);
    expect(result?.gold).toBeGreaterThan(0);
    expect(TestBed.inject(Wallet).coins()).toBe(result?.gold);
    expect(TestBed.inject(Ores).stock().gold).toBe(result?.ores);
    minehunt.leave();
    expect(minehunt.gamble()).toBeNull();
  });
});
