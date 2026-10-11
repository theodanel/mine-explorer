import { TestBed } from '@angular/core/testing';

import { ID_FACTORY, RANDOM } from '../shared/random';
import { GeodeShards } from '../wallet/geode-shards';
import { Wallet } from '../wallet/wallet';
import { Inventory } from './inventory';

const SHARDS_KEY = 'mine-explorer.geode-shards';
const EQUIPMENT_KEY = 'mine-explorer.equipment';

describe('Inventory', () => {
  let ids: number;

  beforeEach(() => {
    localStorage.clear();
    ids = 0;
    TestBed.configureTestingModule({
      providers: [
        // 0.2 → pioche en Bois à chaque tirage
        { provide: RANDOM, useValue: () => 0.2 },
        { provide: ID_FACTORY, useValue: () => `item-${++ids}` },
      ],
    });
  });

  function setup(shards: number): { inventory: Inventory; wallet: Wallet; geodeShards: GeodeShards } {
    localStorage.setItem(SHARDS_KEY, String(shards));
    return {
      inventory: TestBed.inject(Inventory),
      wallet: TestBed.inject(Wallet),
      geodeShards: TestBed.inject(GeodeShards),
    };
  }

  it('forge un objet en payant des éclats, pas des pièces', () => {
    const { inventory, wallet, geodeShards } = setup(3);
    expect(inventory.forge()).toBe(true);
    expect(geodeShards.amount()).toBe(1);
    expect(wallet.coins()).toBe(0);
    expect(inventory.pending()?.slot).toBe('pickaxe');
  });

  it('refuse de forger sans assez d\'éclats', () => {
    const { inventory, geodeShards } = setup(1);
    expect(inventory.canForge()).toBe(false);
    expect(inventory.forge()).toBe(false);
    expect(geodeShards.amount()).toBe(1);
    expect(inventory.pending()).toBeNull();
  });

  it('refuse de forger tant qu\'un objet attend', () => {
    const { inventory, geodeShards } = setup(10);
    inventory.forge();
    expect(inventory.forge()).toBe(false);
    expect(geodeShards.amount()).toBe(8);
  });

  it('équipe l\'objet et améliore les stats', () => {
    const { inventory } = setup(2);
    inventory.forge();
    inventory.equipPending();
    expect(inventory.pending()).toBeNull();
    expect(inventory.equipped().pickaxe?.id).toBe('item-1');
    expect(inventory.stats().strikePower).toBeGreaterThan(5);
  });

  it('vend automatiquement l\'objet remplacé', () => {
    const { inventory, wallet } = setup(4);
    inventory.forge();
    inventory.equipPending();
    inventory.forge();
    inventory.equipPending();
    expect(inventory.equipped().pickaxe?.id).toBe('item-2');
    // 5 pièces pour la pioche en Bois de niveau 1 revendue
    expect(wallet.coins()).toBe(5);
  });

  it('vend l\'objet forgé contre des pièces', () => {
    const { inventory, wallet } = setup(2);
    inventory.forge();
    inventory.sellPending();
    expect(inventory.pending()).toBeNull();
    expect(wallet.coins()).toBe(5);
  });

  it('sauvegarde l\'équipement porté', () => {
    const { inventory } = setup(2);
    inventory.forge();
    inventory.equipPending();
    const saved = JSON.parse(localStorage.getItem(EQUIPMENT_KEY) ?? 'null');
    expect(saved.equipped.pickaxe.id).toBe('item-1');
  });

  it('refuse d\'équiper sans objet en attente', () => {
    const { inventory } = setup(0);
    expect(() => inventory.equipPending()).toThrow();
  });
});
