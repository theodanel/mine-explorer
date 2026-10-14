import { TestBed } from '@angular/core/testing';

import { Ores } from '../ores/ores';
import { Wallet } from '../wallet/wallet';
import { Workshop } from './workshop';
import { upgradeCost } from './workshop-rules';

const STEEL_PICKAXE = { id: 'p1', slot: 'pickaxe', tier: 'steel', level: 12, stats: { strikePower: 100 } };

describe('Workshop', () => {
  function setup(formIndex: number, coins: number, ores: Record<string, number>, workshop?: unknown): Workshop {
    localStorage.clear();
    localStorage.setItem('mine-explorer.progress', JSON.stringify({ zone: 8, stage: 1, damage: 0 }));
    localStorage.setItem('mine-explorer.evolution', String(formIndex));
    localStorage.setItem('mine-explorer.coins', String(coins));
    localStorage.setItem('mine-explorer.equipment', JSON.stringify({ equipped: { pickaxe: STEEL_PICKAXE }, pending: null }));
    const stock = { wood: 0, stone: 0, copper: 0, iron: 0, steel: 0, gold: 0, mithril: 0, crystal: 0, magma: 0, divine: 0, ...ores };
    localStorage.setItem('mine-explorer.ores', JSON.stringify(stock));
    if (workshop !== undefined) {
      localStorage.setItem('mine-explorer.workshop', JSON.stringify(workshop));
    }
    return TestBed.inject(Workshop);
  }

  const cost = upgradeCost('steel', 0)!;

  afterEach(() => TestBed.resetTestingModule());

  it('reste fermé avant le Mineur', () => {
    const workshop = setup(0, cost.gold, { steel: 50 });
    expect(workshop.check('pickaxe')).toBe('locked');
    expect(workshop.upgrade('pickaxe')).toBe(false);
  });

  it('renforce la pièce portée dans sa qualité, contre or et minerai de cette qualité', () => {
    const workshop = setup(1, cost.gold, { steel: 40 });
    expect(workshop.upgrade('pickaxe')).toBe(true);
    expect(workshop.level('pickaxe')).toBe(1);
    expect(workshop.levels()).toEqual({ pickaxe: { steel: 1 } });
    expect(TestBed.inject(Wallet).coins()).toBe(0);
    expect(TestBed.inject(Ores).stock().steel).toBe(40 - (cost.ores.steel ?? 0));
  });

  it('refuse un emplacement vide, ou sans assez de minerai ou d\'or', () => {
    expect(setup(1, cost.gold, { steel: 40 }).check('helmet')).toBe('empty');
    TestBed.resetTestingModule();
    expect(setup(1, cost.gold, { steel: 0 }).check('pickaxe')).toBe('ores');
    TestBed.resetTestingModule();
    expect(setup(1, cost.gold - 1, { steel: 40 }).check('pickaxe')).toBe('gold');
  });

  it('s\'arrête au niveau 50', () => {
    expect(setup(1, 1e15, { steel: 99 }, { pickaxe: { steel: 50 } }).check('pickaxe')).toBe('max');
  });

  it('garde les niveaux au rechargement', () => {
    setup(1, cost.gold, { steel: 40 }).upgrade('pickaxe');
    TestBed.resetTestingModule();
    expect(TestBed.inject(Workshop).level('pickaxe')).toBe(1);
  });

  it('convertit une ancienne sauvegarde vers la qualité portée', () => {
    const workshop = setup(1, 0, {}, { pickaxe: 6, helmet: 3 });
    expect(workshop.levels()).toEqual({ pickaxe: { steel: 6 } });
    expect(JSON.parse(localStorage.getItem('mine-explorer.workshop')!)).toEqual({ pickaxe: { steel: 6 } });
  });
});
