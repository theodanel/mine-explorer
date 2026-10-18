import { TestBed } from '@angular/core/testing';

import { ATTEMPTS_PER_OFFER, HINT_DAYS, OFFERS_PER_DAY, START_MOOD, VISIT_DAYS } from '../balance/merchant';
import { CLOCK } from '../shared/clock';
import { RANDOM } from '../shared/random';
import { GeodeShards } from '../wallet/geode-shards';
import { Wallet } from '../wallet/wallet';
import { Merchant } from './merchant';
import {
  bluff,
  dailyOffers,
  daysUntilVisit,
  freshMerchantDay,
  haggle,
  isValidMerchantState,
  merchantPhase,
  offerState,
  purchase,
  visitDays,
} from './merchant-rules';

describe('merchant-rules : calendrier', () => {
  it('passe 10 jours par mois, tirés au hasard, les mêmes pour tout le monde', () => {
    for (let month = 0; month < 12; month++) {
      const days = visitDays(2027, month);
      expect(days).toHaveLength(VISIT_DAYS);
      expect(new Set(days).size).toBe(VISIT_DAYS);
      expect(days.every((day) => day >= 1 && day <= new Date(2027, month + 1, 0).getDate())).toBe(true);
      expect(visitDays(2027, month)).toEqual(days);
    }
  });

  it("ne reste pas 10 jours d'affilée", () => {
    for (let month = 0; month < 12; month++) {
      const days = visitDays(2027, month);
      expect(days[days.length - 1] - days[0]).toBeGreaterThan(VISIT_DAYS - 1);
    }
  });

  it('est là ses jours de visite, et dit quand il repart', () => {
    const days = visitDays(2026, 10);
    const phases = Array.from({ length: 30 }, (_, index) => merchantPhase(new Date(2026, 10, index + 1, 15)));
    expect(phases.filter((phase) => phase.kind === 'here')).toHaveLength(VISIT_DAYS);
    for (const day of days) {
      expect(merchantPhase(new Date(2026, 10, day, 9))).toEqual({ kind: 'here', lastDay: !days.includes(day + 1) });
    }
  });

  it("s'annonce par des indices les jours qui précèdent sa visite", () => {
    const days = visitDays(2026, 10);
    for (let day = 1; day <= 30; day++) {
      if (days.includes(day)) {
        continue;
      }
      const date = new Date(2026, 10, day, 12);
      const daysLeft = daysUntilVisit(date);
      expect(daysLeft).toBeGreaterThan(0);
      expect(merchantPhase(date)).toEqual(daysLeft <= HINT_DAYS ? { kind: 'coming', daysLeft } : { kind: 'away' });
    }
  });

  it('compte les jours avant son retour', () => {
    const [first] = visitDays(2026, 10);
    expect(daysUntilVisit(new Date(2026, 10, first, 12))).toBe(0);
    expect(daysUntilVisit(new Date(2026, 9, 31, 12))).toBe(first);
  });
});

describe('merchant-rules : marchandage', () => {
  const day = freshMerchantDay('2026-11-10');
  const id = dailyOffers('2026-11-10')[0].id;

  it('propose 3 offres différentes, les mêmes toute la journée', () => {
    const offers = dailyOffers('2026-11-10');
    expect(offers).toHaveLength(OFFERS_PER_DAY);
    expect(new Set(offers.map((offer) => offer.id)).size).toBe(OFFERS_PER_DAY);
    expect(dailyOffers('2026-11-10')).toEqual(offers);
  });

  it('baisse le prix si le marchandage passe, le monte sinon, et l’humeur baisse', () => {
    const won = haggle(day, id, 0);
    expect(won?.outcome).toBe('success');
    expect(offerState(won!.state, id).factor).toBeCloseTo(0.8);
    expect(won!.state.mood).toBeLessThan(START_MOOD);
    const lost = haggle(day, id, 0.99);
    expect(lost?.outcome).toBe('failure');
    expect(offerState(lost!.state, id).factor).toBeCloseTo(1.1);
  });

  it('retire l’offre quand le bluff rate', () => {
    expect(offerState(bluff(day, id, 0.99)!.state, id).status).toBe('withdrawn');
    expect(offerState(bluff(day, id, 0)!.state, id).factor).toBeCloseTo(0.6);
  });

  it('limite les tentatives par offre et se réjouit d’un achat', () => {
    let state = day;
    for (let attempt = 0; attempt < ATTEMPTS_PER_OFFER; attempt++) {
      state = haggle(state, id, 0)!.state;
    }
    expect(haggle(state, id, 0)).toBeNull();
    const bought = purchase(state, id)!;
    expect(offerState(bought, id).status).toBe('bought');
    expect(bought.mood).toBeGreaterThan(state.mood);
    expect(purchase(bought, id)).toBeNull();
  });

  it('rejette une sauvegarde invalide', () => {
    expect(isValidMerchantState(day)).toBe(true);
    expect(isValidMerchantState({ ...day, mood: 140 })).toBe(false);
    expect(isValidMerchantState({ ...day, offers: { x: { factor: 1, attempts: 0, status: 'volé' } } })).toBe(false);
  });
});

describe('Merchant', () => {
  function setup(date: Date, coins: number): Merchant {
    localStorage.clear();
    localStorage.setItem('mine-explorer.evolution', '2');
    localStorage.setItem('mine-explorer.progress', JSON.stringify({ zone: 5, stage: 1, damage: 0 }));
    localStorage.setItem('mine-explorer.coins', String(coins));
    TestBed.configureTestingModule({
      providers: [
        { provide: CLOCK, useValue: () => date.getTime() },
        { provide: RANDOM, useValue: () => 0 },
      ],
    });
    return TestBed.inject(Merchant);
  }

  afterEach(() => TestBed.resetTestingModule());

  it('vend une offre pendant sa visite, contre de l’or', () => {
    const merchant = setup(new Date(2026, 10, visitDays(2026, 10)[0], 12), 1e12);
    expect(merchant.here()).toBe(true);
    const offer = merchant.offers()[0];
    const shards = TestBed.inject(GeodeShards).amount();
    expect(merchant.buy(offer.id)).toBe(true);
    expect(TestBed.inject(Wallet).coins()).toBe(1e12 - offer.price);
    if (offer.goods.kind === 'shards') {
      expect(TestBed.inject(GeodeShards).amount()).toBe(shards + offer.goods.amount);
    }
    expect(merchant.offers()[0].status).toBe('bought');
  });

  it('ne vend rien hors de sa visite, ni sans assez d’or', () => {
    const days = visitDays(2026, 10);
    const start = days[0];
    const awayDay = Array.from({ length: 30 }, (_, index) => index + 1).find((day) => !days.includes(day)) ?? 1;
    const away = setup(new Date(2026, 10, awayDay, 12), 1e12);
    expect(away.here()).toBe(false);
    expect(away.buy(away.offers()[0].id)).toBe(false);
    TestBed.resetTestingModule();
    const poor = setup(new Date(2026, 10, start, 12), 0);
    expect(poor.buy(poor.offers()[0].id)).toBe(false);
  });
});
