import { TestBed } from '@angular/core/testing';

import { SHARD_INTERVAL_MS, ZONE_CLEAR_SHARDS, zoneHp } from '../balance/balance';
import { Progression } from '../progression/progression';
import { RANDOM } from '../shared/random';
import { GeodeShards } from '../wallet/geode-shards';
import { Wallet } from '../wallet/wallet';
import { Mining } from './mining';

describe('Mining', () => {
  function setup(): { mining: Mining; wallet: Wallet; shards: GeodeShards; progression: Progression } {
    localStorage.clear();
    // 0.5 : jamais de critique (5 %)
    TestBed.configureTestingModule({ providers: [{ provide: RANDOM, useValue: () => 0.5 }] });
    return {
      mining: TestBed.inject(Mining),
      wallet: TestBed.inject(Wallet),
      shards: TestBed.inject(GeodeShards),
      progression: TestBed.inject(Progression),
    };
  }

  it('entame la zone et rapporte de l\'or', () => {
    const { mining, wallet, progression } = setup();
    expect(mining.strike()).toEqual({ damage: 5, critical: false, reward: { gold: 1, shards: 0 }, clearedZone: null });
    expect(wallet.coins()).toBe(1);
    expect(progression.progress().damage).toBe(5);
  });

  it('passe à la zone suivante et offre des éclats quand la zone est minée', () => {
    const { mining, shards, progression } = setup();
    const hitsToClear = Math.ceil(zoneHp(1) / 5);
    for (let i = 0; i < hitsToClear; i++) {
      mining.strike();
    }
    expect(progression.zone()).toBe(2);
    expect(shards.amount()).toBe(ZONE_CLEAR_SHARDS);
  });

  it('trouve un éclat toutes les 5 minutes de minage', () => {
    const { mining, shards } = setup();
    expect(mining.mineFor(SHARD_INTERVAL_MS - 1)).toBe(0);
    expect(mining.mineFor(1)).toBe(1);
    expect(shards.amount()).toBe(1);
  });
});
