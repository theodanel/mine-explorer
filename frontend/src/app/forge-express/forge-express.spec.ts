import { TestBed } from '@angular/core/testing';

import { BEST_TIER_SCORE, BONUS_TIER_SCORE, FORGE_EXPRESS_DAILY_RUNS, STRIKES_PER_RUN } from '../balance/forge-express';
import { Inventory } from '../equipment/inventory';
import { CLOCK } from '../shared/clock';
import { bestForgeTier, ForgeExpress, rewardTier } from './forge-express';
import { grade, heat, heatPeriod, isDone, START_SMITHING, strike, tick } from './forge-express-game';

describe('forge-express-game', () => {
  it('fait monter puis redescendre la chaleur, de plus en plus vite', () => {
    const period = heatPeriod(0);
    expect(heat(START_SMITHING)).toBeCloseTo(0);
    expect(heat(tick(START_SMITHING, period / 2))).toBeCloseTo(1);
    expect(heatPeriod(5)).toBeLessThan(period);
  });

  it('note la frappe selon l’écart au centre de la jauge', () => {
    expect(grade(0.5)).toBe('perfect');
    expect(grade(0.6)).toBe('good');
    expect(grade(0.7)).toBe('fair');
    expect(grade(0.95)).toBe('miss');
  });

  it('compte les points, le combo des frappes parfaites, et s’arrête après 10 frappes', () => {
    const atCentre = (smithing = START_SMITHING) => tick(smithing, heatPeriod(smithing.grades.length) / 4);
    let smithing = strike(atCentre());
    smithing = strike(atCentre(smithing));
    expect(smithing.grades).toEqual(['perfect', 'perfect']);
    expect(smithing.combo).toBe(2);
    expect(smithing.score).toBe(3 + 3 + 1);
    smithing = strike(smithing);
    expect(smithing.combo).toBe(0);
    for (let index = smithing.grades.length; index < STRIKES_PER_RUN; index++) {
      smithing = strike(smithing);
    }
    expect(isDone(smithing)).toBe(true);
    expect(strike(smithing)).toBe(smithing);
  });

  it('donne la meilleure qualité de la forge, voire une de plus, selon le score', () => {
    expect(bestForgeTier(1)).toBe('wood');
    expect(rewardTier(0, 15).boosted).toBeNull();
    expect(rewardTier(BEST_TIER_SCORE, 15)).toEqual({ tier: bestForgeTier(15), boosted: 'best' });
    expect(rewardTier(BONUS_TIER_SCORE, 15).boosted).toBe('bonus');
    expect(rewardTier(BONUS_TIER_SCORE, 15).tier).not.toBe(bestForgeTier(15));
  });
});

describe('ForgeExpress', () => {
  function setup(formIndex: number): ForgeExpress {
    localStorage.clear();
    localStorage.setItem('mine-explorer.evolution', String(formIndex));
    TestBed.configureTestingModule({ providers: [{ provide: CLOCK, useValue: () => new Date(2026, 9, 14, 10).getTime() }] });
    return TestBed.inject(ForgeExpress);
  }

  afterEach(() => TestBed.resetTestingModule());

  it('reste fermée avant le Maître des profondeurs', () => {
    expect(setup(2).start()).toBe(false);
  });

  it('donne un objet qui attend comme un objet forgé', () => {
    const forgeExpress = setup(3);
    expect(forgeExpress.start()).toBe(true);
    expect(forgeExpress.runsLeft()).toBe(FORGE_EXPRESS_DAILY_RUNS - 1);
    for (let index = 0; index < STRIKES_PER_RUN; index++) {
      forgeExpress.strike();
    }
    const result = forgeExpress.lastResult();
    expect(result).not.toBeNull();
    expect(TestBed.inject(Inventory).pending()).toEqual(result?.item);
    expect(forgeExpress.blocked()).toBe(true);
    forgeExpress.leave();
    expect(forgeExpress.start()).toBe(false);
  });
});
