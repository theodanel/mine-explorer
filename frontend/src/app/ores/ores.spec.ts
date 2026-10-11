import { TestBed } from '@angular/core/testing';

import { canAfford, Ores } from './ores';

describe('Ores', () => {
  function setup(): Ores {
    localStorage.clear();
    return TestBed.inject(Ores);
  }

  it('ajoute et sauvegarde des minerais', () => {
    const ores = setup();
    ores.add('copper', 3);
    expect(ores.stock().copper).toBe(3);
    expect(JSON.parse(localStorage.getItem('mine-explorer.ores') ?? '{}').copper).toBe(3);
  });

  it('dépense tout un coût, ou rien', () => {
    const ores = setup();
    ores.add('stone', 5);
    expect(ores.spend({ stone: 3, copper: 1 })).toBe(false);
    expect(ores.stock().stone).toBe(5);
    expect(ores.spend({ stone: 3 })).toBe(true);
    expect(ores.stock().stone).toBe(2);
  });

  it('refuse une quantité invalide', () => {
    expect(() => setup().add('wood', 0)).toThrow(RangeError);
  });

  it('vérifie qu\'un stock couvre un coût', () => {
    const stock = { wood: 1, stone: 0, copper: 0, iron: 0, steel: 0, gold: 0, mithril: 0, crystal: 0, magma: 0, divine: 0 };
    expect(canAfford(stock, { wood: 1 })).toBe(true);
    expect(canAfford(stock, { wood: 2 })).toBe(false);
  });
});
