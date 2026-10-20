import { TestBed } from '@angular/core/testing';

import { Progression } from '../progression/progression';
import { applyFarmDamage, isValidFarm } from '../progression/progression-rules';
import { Echoes, echoRockHp } from './echoes';

describe('Échos', () => {
  it("donnent des filons d'environ 2 minutes aux dégâts par seconde du joueur", () => {
    expect(echoRockHp(1000)).toBe(120_000);
  });

  it('recalcule au lancement un Écho entré avec l’ancien calcul, bien trop dur', () => {
    localStorage.clear();
    localStorage.setItem('mine-explorer.evolution', '4');
    localStorage.setItem('mine-explorer.progress', JSON.stringify({ zone: 12, stage: 3, damage: 0 }));
    localStorage.setItem('mine-explorer.farm', JSON.stringify({ zone: 3, damage: 10, echoHp: 1e12 }));
    TestBed.inject(Echoes);
    const echoHp = TestBed.inject(Progression).echoHp();
    expect(echoHp).not.toBeNull();
    expect(echoHp as number).toBeLessThan(1e12);
    localStorage.clear();
  });

  it('cassent un filon aux PV de l’Écho, et gardent ces PV dans la sauvegarde', () => {
    const farm = { zone: 3, damage: 0, echoHp: 500 };
    expect(applyFarmDamage(farm, 499).rockBroken).toBe(false);
    expect(applyFarmDamage(farm, 500).rockBroken).toBe(true);
    const progress = { zone: 14, stage: 1, damage: 0 };
    expect(isValidFarm({ zone: 3, damage: 499, echoHp: 500 }, progress)).toBe(true);
    expect(isValidFarm({ zone: 3, damage: 0, echoHp: -1 }, progress)).toBe(false);
  });

  it('transforme en Écho une zone passée ouverte avant la Légende', () => {
    localStorage.clear();
    localStorage.setItem('mine-explorer.evolution', '4');
    localStorage.setItem('mine-explorer.progress', JSON.stringify({ zone: 12, stage: 3, damage: 0 }));
    localStorage.setItem('mine-explorer.farm', JSON.stringify({ zone: 3, damage: 0 }));
    TestBed.inject(Echoes);
    TestBed.tick();
    const progression = TestBed.inject(Progression);
    expect(progression.farmZone()).toBe(3);
    expect(progression.inEcho()).toBe(true);
    localStorage.clear();
  });
});
