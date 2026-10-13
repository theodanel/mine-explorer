import { TestBed } from '@angular/core/testing';

import { HATCH_MS } from '../balance/companions';
import { CLOCK } from '../shared/clock';
import { RANDOM } from '../shared/random';
import { Companions } from './companions';

describe('Companions', () => {
  let now = 0;

  function setup(zone: number): Companions {
    localStorage.clear();
    now = 0;
    localStorage.setItem('mine-explorer.progress', JSON.stringify({ zone, stage: 1, damage: 0 }));
    TestBed.configureTestingModule({
      providers: [
        { provide: CLOCK, useValue: () => now },
        { provide: RANDOM, useValue: () => 0 },
      ],
    });
    const companions = TestBed.inject(Companions);
    TestBed.tick();
    return companions;
  }

  it('reste fermé avant la zone 3, sans œuf', () => {
    const companions = setup(2);
    expect(companions.unlocked()).toBe(false);
    expect(companions.incubating()).toBeNull();
  });

  it('offre un premier œuf commun à l\'ouverture, puis le fait éclore', () => {
    const companions = setup(3);
    expect(companions.incubating()?.rarity).toBe('common');
    now = HATCH_MS.common;
    expect(companions.hatch()?.id).toBe('canary');
    expect(companions.active()).toBe('canary');
    expect(companions.bonuses().goldPct).toBeGreaterThan(0);
  });

  it('montre et dépense les pierres d\'éveil pour monter une étoile', () => {
    const companions = setup(3);
    now = HATCH_MS.common;
    companions.hatch();
    const cost = companions.starCost('canary') ?? 0;
    expect(companions.canRaiseStar('canary')).toBe(false);
    companions.addStones(cost);
    expect(companions.stones()).toBe(cost);
    expect(companions.raiseStar('canary')).toBe(true);
    expect(companions.owned().canary?.stars).toBe(2);
    expect(companions.stones()).toBe(0);
  });
});
