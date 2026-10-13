import { TestBed } from '@angular/core/testing';

import { FORGE_ANIMATION_MS, Inventory } from '../equipment/inventory';
import { ID_FACTORY, RANDOM } from '../shared/random';
import { GeodeShards } from '../wallet/geode-shards';
import { Wallet } from '../wallet/wallet';
import { AutoForge } from './auto-forge';
import { NO_FILTERS } from './auto-forge-rules';

describe('AutoForge', () => {
  let ids: number;

  function setup(shards: number): { autoForge: AutoForge; inventory: Inventory; wallet: Wallet; geodeShards: GeodeShards } {
    localStorage.clear();
    localStorage.setItem('mine-explorer.geode-shards', String(shards));
    ids = 0;
    TestBed.configureTestingModule({
      providers: [
        // Sans animation de forge : l'objet est montré tout de suite
        { provide: FORGE_ANIMATION_MS, useValue: 0 },
        // 0.2 → pioche en Bois de niveau 1 à chaque tirage
        { provide: RANDOM, useValue: () => 0.2 },
        { provide: ID_FACTORY, useValue: () => `item-${++ids}` },
      ],
    });
    return {
      autoForge: TestBed.inject(AutoForge),
      inventory: TestBed.inject(Inventory),
      wallet: TestBed.inject(Wallet),
      geodeShards: TestBed.inject(GeodeShards),
    };
  }

  it('ne forge rien tant qu\'elle est arrêtée', () => {
    const { autoForge, geodeShards } = setup(10);
    autoForge.tick();
    expect(geodeShards.amount()).toBe(10);
  });

  it('sans filtre, propose l\'objet et attend la décision du joueur', () => {
    const { autoForge, inventory, geodeShards } = setup(10);
    autoForge.setEnabled(true);
    autoForge.tick();
    autoForge.tick();
    expect(inventory.pending()?.id).toBe('item-1');
    expect(inventory.reviewing()).toBe(true);
    expect(geodeShards.amount()).toBe(8);
  });

  it('reprend après la vente', () => {
    const { autoForge, inventory } = setup(10);
    autoForge.setEnabled(true);
    autoForge.tick();
    inventory.sellPending();
    autoForge.tick();
    expect(inventory.pending()?.id).toBe('item-2');
  });

  it('vend tout seul ce qui ne passe pas les filtres, et continue', () => {
    const { autoForge, inventory, wallet, geodeShards } = setup(6);
    autoForge.setEnabled(true);
    autoForge.setFilters({ ...NO_FILTERS, minTier: 'iron' });
    autoForge.tick();
    autoForge.tick();
    autoForge.tick();
    expect(inventory.pending()).toBeNull();
    expect(geodeShards.amount()).toBe(0);
    expect(autoForge.autoSold()).toBe(3);
    expect(wallet.coins()).toBe(autoForge.autoSoldGold());
  });

  it('garde ses réglages d\'une partie à l\'autre', () => {
    const { autoForge } = setup(0);
    autoForge.setEnabled(true);
    autoForge.setFilters({ ...NO_FILTERS, stats: ['critChance'] });
    TestBed.resetTestingModule();
    const reloaded = TestBed.inject(AutoForge);
    expect(reloaded.enabled()).toBe(true);
    expect(reloaded.filters().stats).toEqual(['critChance']);
  });
});
