import { TestBed } from '@angular/core/testing';

import { Artifacts } from '../artifacts/artifacts';
import { rockHp, shardsForStage } from '../balance/balance';
import { MissionCounters } from '../missions/mission-counters';
import { Ores } from '../ores/ores';
import { Progression } from '../progression/progression';
import { RANDOM } from '../shared/random';
import { GeodeShards } from '../wallet/geode-shards';
import { Wallet } from '../wallet/wallet';
import { Mining } from './mining';

describe('Mining', () => {
  // 0.5 par défaut : jamais de critique (5 %) ni d'éclat déterré (2 %)
  function setup(roll = 0.5): { mining: Mining; wallet: Wallet; progression: Progression; counters: MissionCounters } {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [{ provide: RANDOM, useValue: () => roll }] });
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
      reward: { gold: 2, shards: 0 },
      rockBroken: false,
      clearedZone: null,
      ore: null,
    });
    expect(wallet.coins()).toBe(2);
    expect(progression.progress().damage).toBe(5);
  });

  it('applique une explosion à la Frappe, sans critique, et la signale à la scène', () => {
    const { mining, progression } = setup();
    const outcome = mining.blast('dynamite', 6);
    expect(outcome).toMatchObject({ damage: 30, critical: false });
    expect(progression.progress().damage).toBe(30);
    expect(mining.blasts()).toMatchObject({ id: 1, spell: 'dynamite' });
  });

  it('livre un artefact quand une zone est terminée', () => {
    localStorage.clear();
    localStorage.setItem('mine-explorer.progress', JSON.stringify({ zone: 1, stage: 15, damage: rockHp(1, 15) - 1 }));
    TestBed.configureTestingModule({ providers: [{ provide: RANDOM, useValue: () => 0.5 }] });
    expect(TestBed.inject(Mining).strike().clearedZone).toBe(1);
    expect(Object.keys(TestBed.inject(Artifacts).owned())).toHaveLength(1);
  });

  it('déterre parfois un éclat en frappant', () => {
    const { mining } = setup(0.01);
    expect(mining.strike().reward.shards).toBe(1);
    expect(TestBed.inject(GeodeShards).amount()).toBe(1);
  });

  it('passe à l\'étape suivante et compte le rocher cassé pour les missions', () => {
    const { mining, progression, counters } = setup();
    const hitsToBreak = Math.ceil(rockHp(1, 1) / 5);
    for (let i = 0; i < hitsToBreak; i++) {
      mining.strike();
    }
    expect(progression.label()).toBe('1-2');
    expect(counters.counters().rocksBroken).toBe(1);
    // Zone 1 : des éclats, mais pas de minerai (le bois n'en est pas un)
    expect(TestBed.inject(GeodeShards).amount()).toBe(shardsForStage(1, 1));
    expect(TestBed.inject(Ores).stock().wood).toBe(0);
  });
});
