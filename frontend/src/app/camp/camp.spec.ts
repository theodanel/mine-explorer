import { TestBed } from '@angular/core/testing';

import { OFFLINE_CAP_MS } from '../balance/balance';
import { OfflineEarnings } from '../offline/offline-earnings';
import { CLOCK } from '../shared/clock';
import { GeodeShards } from '../wallet/geode-shards';
import { Wallet } from '../wallet/wallet';
import { Camp } from './camp';
import { buildingCost } from './camp-rules';

const HOUR = 60 * 60 * 1000;

describe('Camp', () => {
  let now = 0;

  function setup(zone: number, coins: number, iron: number, camp?: unknown): Camp {
    localStorage.clear();
    now = 0;
    localStorage.setItem('mine-explorer.progress', JSON.stringify({ zone, stage: 1, damage: 0 }));
    localStorage.setItem('mine-explorer.coins', String(coins));
    const stock = { wood: 0, stone: 0, copper: 0, iron, steel: 0, gold: 0, mithril: 0, crystal: 0, magma: 0, divine: 0 };
    localStorage.setItem('mine-explorer.ores', JSON.stringify(stock));
    if (camp !== undefined) {
      localStorage.setItem('mine-explorer.camp', JSON.stringify(camp));
    }
    TestBed.configureTestingModule({ providers: [{ provide: CLOCK, useValue: () => now }] });
    return TestBed.inject(Camp);
  }

  const cost = buildingCost(0, 5);

  it('reste fermé avant la zone 5', () => {
    const camp = setup(4, cost.gold, 50);
    expect(camp.unlocked()).toBe(false);
    expect(camp.build('tavern')).toBe(false);
  });

  it('construit un bâtiment contre or et minerai', () => {
    const camp = setup(5, cost.gold, 10);
    expect(camp.build('tavern')).toBe(true);
    expect(camp.level('tavern')).toBe(1);
    expect(TestBed.inject(Wallet).coins()).toBe(0);
    expect(camp.check('tavern')).toBe('gold');
  });

  it('remplit le puits dès sa construction, puis le récolte', () => {
    const camp = setup(5, cost.gold, 10);
    camp.build('well');
    now += 10 * HOUR;
    expect(camp.collectWell()).toBe(3);
    expect(TestBed.inject(GeodeShards).amount()).toBe(3);
    expect(camp.collectWell()).toBe(0);
  });

  it('ignore une sauvegarde du Campement mal formée, sans planter', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const camp = setup(5, 0, 0, { levels: { warehouse: 4, tavern: 2 }, wallCollectedAt: null });
    expect(camp.offlineCapMs()).toBe(OFFLINE_CAP_MS);
  });

  it("applique la Taverne et l'Entrepôt aux gains hors ligne", () => {
    setup(5, 0, 0, { levels: { warehouse: 8, tavern: 10 }, wellCollectedAt: null });
    localStorage.setItem('mine-explorer.last-seen', String(1));
    now = 1 + 10 * HOUR;
    const report = TestBed.inject(OfflineEarnings).report();
    expect(report?.creditedMs).toBe(OFFLINE_CAP_MS + 2 * HOUR);
  });
});
