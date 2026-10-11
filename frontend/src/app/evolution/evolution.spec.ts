import { TestBed } from '@angular/core/testing';

import { EVOLUTION_FORMS, evolutionStrikeMultiplier, zoneMaterial } from '../balance/balance';
import { Inventory } from '../equipment/inventory';
import { Ores } from '../ores/ores';
import { Wallet } from '../wallet/wallet';
import { canEvolve } from './evolution-rules';
import { Evolution } from './evolution';

const MINER = EVOLUTION_FORMS[1];

describe('Evolution', () => {
  function setup(zone: number, coins: number): { evolution: Evolution; ores: Ores; wallet: Wallet } {
    localStorage.clear();
    localStorage.setItem('mine-explorer.progress', JSON.stringify({ zone, stage: 1, damage: 0 }));
    localStorage.setItem('mine-explorer.coins', String(coins));
    return { evolution: TestBed.inject(Evolution), ores: TestBed.inject(Ores), wallet: TestBed.inject(Wallet) };
  }

  function giveOres(ores: Ores): void {
    for (const [tier, amount] of Object.entries(MINER.ores)) {
      ores.add(tier as keyof typeof MINER.ores, amount ?? 0);
    }
  }

  it('commence en Apprenti', () => {
    const { evolution } = setup(1, 0);
    expect(evolution.form().id).toBe('apprentice');
    expect(evolution.next()?.id).toBe('miner');
  });

  it('attend la bonne zone, même avec les minerais et l\'or', () => {
    const { evolution, ores } = setup(MINER.minZone - 1, MINER.gold);
    giveOres(ores);
    expect(evolution.ready()).toBe(false);
    expect(evolution.evolve()).toBe(false);
  });

  it('évolue en payant minerais et or', () => {
    const { evolution, ores, wallet } = setup(MINER.minZone, MINER.gold + 10);
    giveOres(ores);
    expect(evolution.ready()).toBe(true);
    expect(evolution.evolve()).toBe(true);
    expect(evolution.form().id).toBe('miner');
    expect(wallet.coins()).toBe(10);
    expect(ores.stock().stone).toBe(0);
    expect(localStorage.getItem('mine-explorer.evolution')).toBe('1');
  });

  it('augmente la Frappe de l\'inventaire', () => {
    const { evolution, ores } = setup(MINER.minZone, MINER.gold);
    giveOres(ores);
    const inventory = TestBed.inject(Inventory);
    const before = inventory.stats().strikePower;
    evolution.evolve();
    expect(inventory.stats().strikePower).toBeCloseTo(before * 1.25);
  });
});

describe('règles d\'évolution', () => {
  it('cumulent les bonus de Frappe', () => {
    expect(evolutionStrikeMultiplier(0)).toBe(1);
    expect(evolutionStrikeMultiplier(2)).toBeCloseTo(1.5625);
  });

  it('demandent les minerais des zones déjà traversées', () => {
    for (const form of EVOLUTION_FORMS) {
      const reachable = new Set(Array.from({ length: form.minZone - 1 }, (_, index) => zoneMaterial(index + 1)));
      for (const tier of Object.keys(form.ores)) {
        expect(reachable.has(tier as never)).toBe(true);
      }
    }
  });

  it('refusent tant qu\'une condition manque', () => {
    expect(canEvolve([{ label: 'Or', have: 0, need: 1, met: false, tier: null }])).toBe(false);
  });
});
