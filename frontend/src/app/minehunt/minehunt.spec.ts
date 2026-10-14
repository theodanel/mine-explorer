import { TestBed } from '@angular/core/testing';

import { MINEHUNT_DAILY_RUNS } from '../balance/minehunt';
import { MissionCounters } from '../missions/mission-counters';
import { Ores } from '../ores/ores';
import { CLOCK } from '../shared/clock';
import { Wallet } from '../wallet/wallet';
import { Minehunt } from './minehunt';
import { huntLoot, isValidMinehuntState, runsLeft } from './minehunt-rules';

describe('minehunt-rules', () => {
  const values = { nuggetGold: 100, chestGold: 1000 };

  it('garde tout le butin en remontant, la moitié si la pioche casse', () => {
    const found = { ores: 3, nuggets: 2, chest: true };
    expect(huntLoot({ ...found, status: 'stopped' }, values)).toEqual({ ores: 16, gold: 1200 });
    expect(huntLoot({ ...found, status: 'broken' }, values)).toEqual({ ores: 8, gold: 600 });
  });

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
    TestBed.configureTestingModule({ providers: [{ provide: CLOCK, useValue: () => new Date(2026, 9, 14, 10).getTime() }] });
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
    const hunt = minehunt.hunt();
    const safe = hunt?.cells.findIndex((cell) => !cell.dug && cell.content === 'ore') ?? -1;
    if (safe >= 0) {
      minehunt.dig(safe);
    }
    minehunt.stop();
    const result = minehunt.lastResult();
    expect(result?.status).toBe('stopped');
    expect(TestBed.inject(Wallet).coins()).toBe(result?.gold);
    expect(TestBed.inject(Ores).stock().gold).toBe(result?.ores);
    minehunt.leave();
    expect(minehunt.hunt()).toBeNull();
  });
});
