import { TestBed } from '@angular/core/testing';

import { rockHp } from '../balance/balance';
import { MissionCounters } from '../missions/mission-counters';
import { Ores } from '../ores/ores';
import { Progression } from '../progression/progression';
import { RANDOM } from '../shared/random';
import { Wallet } from '../wallet/wallet';
import { Mining } from './mining';

describe('Mining', () => {
  function setup(): { mining: Mining; wallet: Wallet; progression: Progression; counters: MissionCounters } {
    localStorage.clear();
    // 0.5 : jamais de critique (5 %)
    TestBed.configureTestingModule({ providers: [{ provide: RANDOM, useValue: () => 0.5 }] });
    return {
      mining: TestBed.inject(Mining),
      wallet: TestBed.inject(Wallet),
      progression: TestBed.inject(Progression),
      counters: TestBed.inject(MissionCounters),
    };
  }

  it('entame le rocher et rapporte de l\'or', () => {
    const { mining, wallet, progression } = setup();
    expect(mining.strike()).toEqual({
      damage: 5,
      critical: false,
      reward: { gold: 1, shards: 0 },
      clearedZone: null,
      ore: null,
    });
    expect(wallet.coins()).toBe(1);
    expect(progression.progress().damage).toBe(5);
  });

  it('passe à l\'étape suivante et compte le rocher cassé pour les missions', () => {
    const { mining, progression, counters } = setup();
    const hitsToBreak = Math.ceil(rockHp(1, 1) / 5);
    for (let i = 0; i < hitsToBreak; i++) {
      mining.strike();
    }
    expect(progression.label()).toBe('1-2');
    expect(counters.counters().rocksBroken).toBe(1);
    // Zone 1 : minerai de Bois
    expect(TestBed.inject(Ores).stock().wood).toBe(1);
  });
});
