import { TestBed } from '@angular/core/testing';

import { goldForDamage, rockHp, STAGES_PER_ZONE } from '../balance/balance';
import { Mining } from '../mining/mining';
import { MissionCounters } from '../missions/mission-counters';
import { Ores } from '../ores/ores';
import { RANDOM } from '../shared/random';
import { Wallet } from '../wallet/wallet';
import { Progression } from './progression';
import { applyFarmDamage, canFarm, farmRockHp, isValidFarm } from './progression-rules';

describe('retour dans une zone passée (règles)', () => {
  const progress = { zone: 8, stage: 4, damage: 10 };

  it('ne revient que dans une zone déjà terminée', () => {
    expect(canFarm(progress, 3)).toBe(true);
    expect(canFarm(progress, 8)).toBe(false);
    expect(canFarm(progress, 9)).toBe(false);
    expect(canFarm(progress, 0)).toBe(false);
  });

  it('casse des filons sans fin, de la résistance du dernier filon de la zone', () => {
    expect(farmRockHp(3)).toBe(rockHp(3, STAGES_PER_ZONE));
    const first = applyFarmDamage({ zone: 3, damage: 0 }, farmRockHp(3) - 1);
    expect(first.rockBroken).toBe(false);
    const second = applyFarmDamage(first.farm, 50);
    expect(second.rockBroken).toBe(true);
    expect(second.farm).toEqual({ zone: 3, damage: 0 });
  });

  it('ne compte que les PV vraiment minés', () => {
    expect(applyFarmDamage({ zone: 2, damage: 0 }, 1e12).mined).toBe(farmRockHp(2));
  });

  it('rejette une sauvegarde invalide', () => {
    expect(isValidFarm({ zone: 3, damage: 0 }, progress)).toBe(true);
    expect(isValidFarm({ zone: 8, damage: 0 }, progress)).toBe(false);
    expect(isValidFarm({ zone: 3, damage: farmRockHp(3) }, progress)).toBe(false);
    expect(isValidFarm({ zone: 'trois', damage: 0 }, progress)).toBe(false);
  });
});

describe('retour dans une zone passée (en jeu)', () => {
  function setup(): void {
    localStorage.clear();
    localStorage.setItem('mine-explorer.progress', JSON.stringify({ zone: 8, stage: 4, damage: 0 }));
    // Un coup énorme : il casse un filon de zone 3 à chaque frappe
    localStorage.setItem('mine-explorer.equipment', JSON.stringify({
      equipped: { pickaxe: { id: 'p', slot: 'pickaxe', tier: 'divine', level: 30, stats: { strikePower: 1e9 } } },
      pending: null,
    }));
    TestBed.configureTestingModule({ providers: [{ provide: RANDOM, useValue: () => 0.5 }] });
  }

  afterEach(() => TestBed.resetTestingModule());

  it('mine la zone choisie sans toucher la progression, puis la reprend', () => {
    setup();
    const progression = TestBed.inject(Progression);
    expect(progression.startFarm(3)).toBe(true);
    expect(progression.playingZone()).toBe(3);
    expect(progression.zone()).toBe(8);

    const coins = TestBed.inject(Wallet).coins();
    const outcome = TestBed.inject(Mining).strike();

    expect(outcome.rockBroken).toBe(true);
    expect(outcome.ore?.tier).toBe('copper');
    expect(TestBed.inject(Ores).stock().copper).toBe(1);
    // L'or ne vient que des PV du filon, pas des dégâts du coup
    expect(TestBed.inject(Wallet).coins() - coins).toBeLessThanOrEqual(goldForDamage(farmRockHp(3), 1));
    expect(TestBed.inject(MissionCounters).counters().rocksBroken).toBe(0);
    expect(progression.progress()).toEqual({ zone: 8, stage: 4, damage: 0 });

    progression.stopFarm();
    expect(progression.playingZone()).toBe(8);
  });

  it('se souvient du retour au rechargement', () => {
    setup();
    TestBed.inject(Progression).startFarm(5);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    expect(TestBed.inject(Progression).farmZone()).toBe(5);
  });
});
