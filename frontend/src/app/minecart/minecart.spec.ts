import { TestBed } from '@angular/core/testing';

import { CLOCK } from '../shared/clock';
import { RANDOM } from '../shared/random';
import { Wallet } from '../wallet/wallet';
import { Minecart } from './minecart';

describe('Minecart', () => {
  let now = 0;

  function setup(formIndex: number, minecart?: unknown): Minecart {
    localStorage.clear();
    now = new Date(2026, 9, 14, 10).getTime();
    localStorage.setItem('mine-explorer.evolution', String(formIndex));
    localStorage.setItem('mine-explorer.progress', JSON.stringify({ zone: 10, stage: 1, damage: 0 }));
    if (minecart !== undefined) {
      localStorage.setItem('mine-explorer.minecart', JSON.stringify(minecart));
    }
    TestBed.configureTestingModule({
      providers: [
        { provide: CLOCK, useValue: () => now },
        { provide: RANDOM, useValue: () => 0.3 },
      ],
    });
    return TestBed.inject(Minecart);
  }

  beforeEach(() => vi.useFakeTimers());

  afterEach(() => {
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });

  it('reste fermé avant le Contremaître', () => {
    const minecart = setup(1);
    expect(minecart.unlocked()).toBe(false);
    expect(minecart.start()).toBe(false);
  });

  it('court jusqu’au crash, paie la course et garde le record', () => {
    const minecart = setup(3);
    const coins = TestBed.inject(Wallet).coins();
    expect(minecart.start()).toBe(true);
    expect(minecart.runsLeft()).toBe(2);
    for (let step = 0; step < 20_000 && minecart.running(); step++) {
      now += 33;
      vi.advanceTimersByTime(33);
    }
    expect(minecart.running()).toBe(false);
    const result = minecart.lastResult();
    expect(result?.meters).toBeGreaterThan(0);
    expect(minecart.record()).toBe(result?.meters);
    expect(TestBed.inject(Wallet).coins()).toBe(coins + (result?.gold ?? 0));
  });

  it('s’arrête à 3 courses par jour', () => {
    const minecart = setup(3, { record: 0, day: '2026-10-14', runsUsed: 3 });
    expect(minecart.runsLeft()).toBe(0);
    expect(minecart.start()).toBe(false);
  });
});
