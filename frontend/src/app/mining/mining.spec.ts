import { TestBed } from '@angular/core/testing';

import { Artifacts } from '../artifacts/artifacts';
import { Companions } from '../companions/companions';
import { rockHp, shardsForStage } from '../balance/balance';
import { MissionCounters } from '../missions/mission-counters';
import { Ores } from '../ores/ores';
import { Progression } from '../progression/progression';
import { RANDOM } from '../shared/random';
import { GeodeShards } from '../wallet/geode-shards';
import { Wallet } from '../wallet/wallet';
import { Mining } from './mining';

/** Multiple de Frappe qui casse n'importe quel gardien d'un coup. */
const ONE_SHOT = 1e9;

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
      reward: { gold: 3, shards: 0 },
      rockBroken: false,
      clearedZone: null,
      ore: null,
      essence: null,
    });
    expect(wallet.coins()).toBe(3);
    expect(progression.progress().damage).toBe(5);
  });

  it('applique une explosion à la Frappe, sans critique, et la signale à la scène', () => {
    const { mining, progression } = setup();
    const outcome = mining.blast('dynamite', 6);
    expect(outcome).toMatchObject({ damage: 30, critical: false });
    expect(progression.progress().damage).toBe(30);
    expect(mining.blasts()).toMatchObject({ id: 1, spell: 'dynamite' });
  });

  it("livre un artefact par zone terminée, dès la zone 2 qui ouvre l'onglet", () => {
    const artifactsForClearing = (zone: number) => {
      localStorage.clear();
      localStorage.setItem('mine-explorer.progress', JSON.stringify({ zone, stage: 15, damage: 0 }));
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [{ provide: RANDOM, useValue: () => 0.5 }] });
      // Le gardien de la zone tombe d'un seul coup énorme
      expect(TestBed.inject(Mining).blast('dynamite', ONE_SHOT).clearedZone).toBe(zone);
      return Object.keys(TestBed.inject(Artifacts).owned()).length;
    };
    expect(artifactsForClearing(1)).toBe(0);
    expect(artifactsForClearing(2)).toBe(1);
  });

  it('donne un œuf de compagnon pour chaque zone terminée à partir de la zone 2', () => {
    const eggsForClearing = (zone: number) => {
      localStorage.clear();
      localStorage.setItem('mine-explorer.progress', JSON.stringify({ zone, stage: 15, damage: 0 }));
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [{ provide: RANDOM, useValue: () => 0.5 }] });
      const addEgg = vi.spyOn(TestBed.inject(Companions), 'addEgg');
      TestBed.inject(Mining).blast('dynamite', ONE_SHOT);
      return addEgg.mock.calls.length;
    };
    // Zone 1 terminée : l'onglet s'ouvre, avec son œuf offert à part
    expect(eggsForClearing(1)).toBe(0);
    expect(eggsForClearing(2)).toBe(1);
    // En zone 6, le rattrapage a déjà donné les œufs des zones 2 à 5 : la zone 6 en ajoute un
    expect(eggsForClearing(6)).toBe(1);
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
