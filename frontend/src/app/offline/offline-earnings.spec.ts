import { TestBed } from '@angular/core/testing';

import { BASE_STATS, OFFLINE_CAP_MS, offlineGains } from '../balance/balance';
import { CLOCK } from '../shared/clock';
import { Wallet } from '../wallet/wallet';
import { OfflineEarnings } from './offline-earnings';

const LAST_SEEN_KEY = 'mine-explorer.last-seen';
const HOUR_MS = 60 * 60 * 1000;

describe('OfflineEarnings', () => {
  const now = 100 * HOUR_MS;

  function setup(lastSeen: number | null): { earnings: OfflineEarnings; wallet: Wallet } {
    localStorage.clear();
    if (lastSeen !== null) {
      localStorage.setItem(LAST_SEEN_KEY, String(lastSeen));
    }
    TestBed.configureTestingModule({ providers: [{ provide: CLOCK, useValue: () => now }] });
    return { earnings: TestBed.inject(OfflineEarnings), wallet: TestBed.inject(Wallet) };
  }

  it('ne donne rien à la première visite', () => {
    const { earnings, wallet } = setup(null);
    expect(earnings.report()).toBeNull();
    expect(wallet.coins()).toBe(0);
    expect(localStorage.getItem(LAST_SEEN_KEY)).toBe(String(now));
  });

  it('crédite une absence de 2 h', () => {
    const { earnings, wallet } = setup(now - 2 * HOUR_MS);
    const expected = offlineGains(BASE_STATS, 2 * HOUR_MS);
    expect(earnings.report()).toEqual(expected);
    expect(wallet.coins()).toBe(expected.gold);
  });

  it('plafonne l\'absence à 4 h', () => {
    const { earnings } = setup(now - 30 * HOUR_MS);
    expect(earnings.report()?.creditedMs).toBe(OFFLINE_CAP_MS);
  });

  it('ignore une absence de quelques secondes', () => {
    const { earnings } = setup(now - 5000);
    expect(earnings.report()).toBeNull();
  });
});
