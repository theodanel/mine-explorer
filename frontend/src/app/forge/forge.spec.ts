import { TestBed } from '@angular/core/testing';

import { segmentCost, upgradeDurationMs } from '../balance/balance';
import { CLOCK } from '../shared/clock';
import { Wallet } from '../wallet/wallet';
import { Forge } from './forge';

const PICKAXE_KEY = 'mine-explorer.pickaxe';

describe('Forge (pioche)', () => {
  let now: number;

  function setup(coins: number): { forge: Forge; wallet: Wallet } {
    localStorage.clear();
    localStorage.setItem('mine-explorer.coins', String(coins));
    now = 1_000_000;
    TestBed.configureTestingModule({ providers: [{ provide: CLOCK, useValue: () => now }] });
    return { forge: TestBed.inject(Forge), wallet: TestBed.inject(Wallet) };
  }

  it('commence au niveau 1 sans segment', () => {
    const { forge } = setup(0);
    expect(forge.level()).toBe(1);
    expect(forge.segments()).toBe(0);
  });

  it('remplit un segment en payant de l\'or', () => {
    const cost = segmentCost(1) ?? 0;
    const { forge, wallet } = setup(cost + 1);
    expect(forge.paySegment()).toBe(true);
    expect(forge.segments()).toBe(1);
    expect(wallet.coins()).toBe(1);
  });

  it('lance le minuteur au dixième segment, puis monte de niveau à la fin', () => {
    const { forge } = setup(100_000);
    for (let i = 0; i < 10; i++) {
      forge.paySegment();
    }
    expect(forge.upgrading()).toBe(true);
    expect(forge.level()).toBe(1);
    expect(forge.paySegment()).toBe(false);

    now += upgradeDurationMs(1);
    forge.tick();
    expect(forge.level()).toBe(2);
    expect(forge.segments()).toBe(0);
    expect(JSON.parse(localStorage.getItem(PICKAXE_KEY) ?? 'null')).toEqual({
      level: 2,
      segments: 0,
      upgradeEndsAt: null,
    });
  });

  it('refuse un segment sans assez d\'or', () => {
    const { forge, wallet } = setup(1);
    expect(forge.canPaySegment()).toBe(false);
    expect(forge.paySegment()).toBe(false);
    expect(wallet.coins()).toBe(1);
  });

  it('ignore une sauvegarde invalide', () => {
    localStorage.clear();
    localStorage.setItem(PICKAXE_KEY, JSON.stringify({ level: 99, segments: 0, upgradeEndsAt: null }));
    expect(TestBed.inject(Forge).level()).toBe(1);
  });
});
