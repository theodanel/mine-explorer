import { TestBed } from '@angular/core/testing';

import { CLOCK } from '../shared/clock';
import { RANDOM } from '../shared/random';
import { GeodeShards } from '../wallet/geode-shards';
import { Wallet } from '../wallet/wallet';
import { Lottery } from './lottery';

describe('Lottery', () => {
  let now = 0;

  function setup(lottery?: unknown): Lottery {
    localStorage.clear();
    now = new Date(2026, 9, 14, 10).getTime();
    localStorage.setItem('mine-explorer.progress', JSON.stringify({ zone: 5, stage: 1, damage: 0 }));
    if (lottery !== undefined) {
      localStorage.setItem('mine-explorer.lottery', JSON.stringify(lottery));
    }
    TestBed.configureTestingModule({
      providers: [
        { provide: CLOCK, useValue: () => now },
        // Toujours la première case : un lot commun
        { provide: RANDOM, useValue: () => 0 },
      ],
    });
    return TestBed.inject(Lottery);
  }

  beforeEach(() => vi.useFakeTimers());

  afterEach(() => {
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });

  it('crédite le lot tiré, une seule fois par jour', () => {
    const lottery = setup();
    const before = { coins: TestBed.inject(Wallet).coins(), shards: TestBed.inject(GeodeShards).amount() };

    const draw = lottery.draw();

    expect(draw?.index).toBe(0);
    expect(lottery.available()).toBe(false);
    expect(lottery.draw()).toBeNull();
    const prize = draw!.lot.prize;
    if (prize.kind === 'gold') {
      expect(TestBed.inject(Wallet).coins()).toBe(before.coins + prize.amount);
    } else if (prize.kind === 'shards') {
      expect(TestBed.inject(GeodeShards).amount()).toBe(before.shards + prize.amount);
    }
    expect(JSON.parse(localStorage.getItem('mine-explorer.lottery')!)).toEqual({ lastDraw: '2026-10-14' });
  });

  it('revient le lendemain, même sans recharger', () => {
    const lottery = setup({ lastDraw: '2026-10-14' });
    expect(lottery.available()).toBe(false);

    now = new Date(2026, 9, 15, 0, 1).getTime();
    vi.advanceTimersByTime(60_000);

    expect(lottery.available()).toBe(true);
  });

  it('ignore une sauvegarde invalide', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(setup({ lastDraw: 42 }).available()).toBe(true);
  });
});
