import { TestBed } from '@angular/core/testing';

import { ID_FACTORY, RANDOM } from '../shared/random';
import { GeodeShards } from '../wallet/geode-shards';
import { Wallet } from '../wallet/wallet';
import { FORGE_ANIMATION_MS, Inventory } from './inventory';

const SHARDS_KEY = 'mine-explorer.geode-shards';
const EQUIPMENT_KEY = 'mine-explorer.equipment';

describe('Inventory', () => {
  let ids: number;

  beforeEach(() => {
    localStorage.clear();
    ids = 0;
    TestBed.configureTestingModule({
      providers: [
        // Sans animation de forge : l'objet est montré tout de suite
        { provide: FORGE_ANIMATION_MS, useValue: 0 },
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

  it('ferme la comparaison sans vendre ni équiper, puis la rouvre', () => {
    const { inventory, wallet, geodeShards } = setup(10);
    inventory.forge();
    expect(inventory.reviewing()).toBe(true);
    inventory.closeReview();
    expect(inventory.reviewing()).toBe(false);
    expect(inventory.pending()?.id).toBe('item-1');
    expect(wallet.coins()).toBe(0);
    expect(inventory.forge()).toBe(false);
    expect(geodeShards.amount()).toBe(8);
    inventory.reopenReview();
    expect(inventory.reviewing()).toBe(true);
  });

  it('montre la comparaison de chaque nouvel objet forgé', () => {
    const { inventory } = setup(10);
    inventory.forge();
    inventory.closeReview();
    inventory.sellPending();
    inventory.forge();
    expect(inventory.reviewing()).toBe(true);
  });

  it('équipe l\'objet et améliore les stats', () => {
    const { inventory } = setup(2);
    inventory.forge();
    inventory.equipPending();
    expect(inventory.pending()).toBeNull();
    expect(inventory.equipped().pickaxe?.id).toBe('item-1');
    expect(inventory.stats().strikePower).toBeGreaterThan(5);
  });

  it('garde l\'objet remplacé en attente au lieu de le vendre', () => {
    const { inventory, wallet } = setup(4);
    inventory.forge();
    inventory.equipPending();
    inventory.forge();
    inventory.equipPending();
    expect(inventory.equipped().pickaxe?.id).toBe('item-2');
    expect(inventory.pending()?.id).toBe('item-1');
    expect(inventory.pendingWasEquipped()).toBe(true);
    expect(inventory.reviewing()).toBe(true);
    expect(wallet.coins()).toBe(0);
  });

  it('permet de remettre l\'ancien objet, puis de vendre celui qu\'on écarte', () => {
    const { inventory, wallet } = setup(4);
    inventory.forge();
    inventory.equipPending();
    inventory.forge();
    inventory.equipPending();
    inventory.equipPending();
    expect(inventory.equipped().pickaxe?.id).toBe('item-1');
    expect(inventory.pending()?.id).toBe('item-2');
    inventory.sellPending();
    expect(inventory.pending()).toBeNull();
    // 5 pièces pour la pioche en Bois de niveau 1 vendue
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
