import { TestBed } from '@angular/core/testing';

import { upgradeCost } from './workshop-rules';
import { Workshop } from './workshop';
import { Ores } from '../ores/ores';
import { Wallet } from '../wallet/wallet';

describe('Workshop', () => {
  function setup(formIndex: number, coins: number, ores: Record<string, number>): Workshop {
    localStorage.clear();
    localStorage.setItem('mine-explorer.progress', JSON.stringify({ zone: 8, stage: 1, damage: 0 }));
    localStorage.setItem('mine-explorer.evolution', String(formIndex));
    localStorage.setItem('mine-explorer.coins', String(coins));
    const stock = { wood: 0, stone: 0, copper: 0, iron: 0, steel: 0, gold: 0, mithril: 0, crystal: 0, magma: 0, divine: 0, ...ores };
    localStorage.setItem('mine-explorer.ores', JSON.stringify(stock));
    return TestBed.inject(Workshop);
  }

  const cost = upgradeCost(0, 8);

  it('reste fermé avant le Contremaître', () => {
    const workshop = setup(1, cost.gold, { mithril: 50 });
    expect(workshop.check('pickaxe')).toBe('locked');
    expect(workshop.upgrade('pickaxe')).toBe(false);
  });

  it('renforce un emplacement contre or et minerai', () => {
    const workshop = setup(2, cost.gold, { mithril: 40 });
    expect(workshop.upgrade('pickaxe')).toBe(true);
    expect(workshop.level('pickaxe')).toBe(1);
    expect(TestBed.inject(Wallet).coins()).toBe(0);
    expect(TestBed.inject(Ores).stock().mithril).toBe(40 - (cost.ores.mithril ?? 0));
  });

  it('ne touche pas au minerai gardé pour l\'évolution suivante', () => {
    const workshop = setup(2, cost.gold, { mithril: 30 });
    expect(workshop.spendableOres()).toBe(0);
    expect(workshop.check('pickaxe')).toBe('ores');
  });

  it('refuse sans assez d\'or', () => {
    const workshop = setup(2, cost.gold - 1, { mithril: 40 });
    expect(workshop.check('bag')).toBe('gold');
  });

  it('garde les niveaux au rechargement', () => {
    setup(2, cost.gold, { mithril: 40 }).upgrade('boots');
    TestBed.resetTestingModule();
    expect(TestBed.inject(Workshop).level('boots')).toBe(1);
  });
});
