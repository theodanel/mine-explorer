import { TestBed } from '@angular/core/testing';

import { CRYSTAL_RAIN_COUNT, EVENT_DELAY_MIN_MS, EVENT_LIFETIME_MS, GEODE_TAPS } from '../balance/mine-events';
import { Navigation } from '../navigation/navigation';
import { CLOCK } from '../shared/clock';
import { RANDOM } from '../shared/random';
import { GeodeShards } from '../wallet/geode-shards';
import { Wallet } from '../wallet/wallet';
import { MineEvents } from './mine-events';

describe('MineEvents', () => {
  let now = 0;

  function setup(): MineEvents {
    localStorage.clear();
    now = 0;
    TestBed.configureTestingModule({
      providers: [
        { provide: CLOCK, useValue: () => now },
        // 0 : délai minimal, premier événement de la liste (géode), position à gauche
        { provide: RANDOM, useValue: () => 0 },
      ],
    });
    return TestBed.inject(MineEvents);
  }

  it('fait apparaître un événement après le délai de jeu actif', () => {
    const events = setup();
    now = EVENT_DELAY_MIN_MS - 1;
    events.tick();
    expect(events.active()).toBeNull();
    now = EVENT_DELAY_MIN_MS;
    events.tick();
    expect(events.active()?.id).toBe('giantGeode');
  });

  it('ne compte pas le temps passé sur une autre page', () => {
    const events = setup();
    TestBed.inject(Navigation).open('skills');
    now = EVENT_DELAY_MIN_MS * 2;
    events.tick();
    expect(events.active()).toBeNull();
  });

  it('ouvre la géode au cinquième coup', () => {
    const events = setup();
    events.spawn('giantGeode');
    for (let tap = 1; tap < GEODE_TAPS; tap++) {
      expect(events.tap()).toBe(false);
    }
    expect(events.tap()).toBe(true);
    expect(events.active()).toBeNull();
    expect(TestBed.inject(GeodeShards).amount()).toBe(1);
    expect(TestBed.inject(Wallet).coins()).toBeGreaterThan(0);
  });

  it('laisse partir un événement ignoré, sans rien retirer', () => {
    const events = setup();
    events.spawn('thiefRat');
    now = EVENT_LIFETIME_MS.thiefRat;
    events.tick();
    expect(events.active()).toBeNull();
    expect(TestBed.inject(Wallet).coins()).toBe(0);
  });

  it('donne un éclat par cristal attrapé', () => {
    const events = setup();
    events.spawn('crystalRain');
    for (let index = 0; index < CRYSTAL_RAIN_COUNT; index++) {
      expect(events.tap(index)).toBe(true);
    }
    expect(events.tap(0)).toBe(false);
    expect(TestBed.inject(GeodeShards).amount()).toBe(CRYSTAL_RAIN_COUNT);
    expect(events.active()).toBeNull();
  });
});
