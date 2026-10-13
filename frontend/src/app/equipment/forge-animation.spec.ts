import { TestBed } from '@angular/core/testing';

import { RANDOM } from '../shared/random';
import { FORGE_ANIMATION_MS, Inventory } from './inventory';

describe('Inventory, animation de forge', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    localStorage.setItem('mine-explorer.geode-shards', '10');
    TestBed.configureTestingModule({
      providers: [
        { provide: FORGE_ANIMATION_MS, useValue: 900 },
        { provide: RANDOM, useValue: () => 0.2 },
      ],
    });
  });

  afterEach(() => vi.useRealTimers());

  it('ne montre l\'objet qu\'à la fin de l\'animation, et bloque la forge pendant ce temps', () => {
    const inventory = TestBed.inject(Inventory);
    expect(inventory.forge()).toBe(true);
    expect(inventory.lastForged()?.item).toEqual(inventory.pending());
    expect(inventory.forging()).toBe(true);
    expect(inventory.reviewing()).toBe(false);
    inventory.sellPending();
    expect(inventory.canForge()).toBe(false);
    vi.advanceTimersByTime(900);
    expect(inventory.forging()).toBe(false);
    expect(inventory.canForge()).toBe(true);
  });
});
