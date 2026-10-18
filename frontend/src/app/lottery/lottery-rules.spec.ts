import { LOTTERY_SLOTS } from '../balance/lottery';
import { canDraw, drawSlot, isValidLotteryState, lotteryBoard, seededRandom } from './lottery-rules';

const LATE_GAME = { zone: 7, stage: 3, companionsUnlocked: true };

describe('lottery-rules', () => {
  it('les chances des six cases font 100 %', () => {
    const total = LOTTERY_SLOTS.reduce((sum, slot) => sum + slot.chance, 0);
    expect(total).toBeCloseTo(1, 10);
  });

  it('donne les mêmes lots toute la journée, et d\'autres le lendemain', () => {
    expect(lotteryBoard('2026-10-14', LATE_GAME)).toEqual(lotteryBoard('2026-10-14', LATE_GAME));
    const week = ['2026-10-15', '2026-10-16', '2026-10-17', '2026-10-18', '2026-10-19'].map((day) =>
      JSON.stringify(lotteryBoard(day, LATE_GAME)),
    );
    expect(new Set([JSON.stringify(lotteryBoard('2026-10-14', LATE_GAME)), ...week]).size).toBeGreaterThan(1);
  });

  it('ne met jamais deux fois le même lot dans une même rareté', () => {
    for (let day = 1; day <= 28; day++) {
      const lots = lotteryBoard(`2026-02-${String(day).padStart(2, '0')}`, LATE_GAME);
      expect(lots[0].prize).not.toEqual(lots[1].prize);
      expect(lots[2].prize).not.toEqual(lots[3].prize);
    }
  });

  it('sans l\'onglet Compagnons, ni œuf ni pierre d\'éveil', () => {
    for (let day = 1; day <= 28; day++) {
      const lots = lotteryBoard(`2026-03-${String(day).padStart(2, '0')}`, { zone: 1, stage: 2, companionsUnlocked: false });
      expect(lots.every((lot) => lot.prize.kind === 'gold' || lot.prize.kind === 'shards')).toBe(true);
    }
  });

  it("l'or suit la zone du joueur", () => {
    const goldIn = (zone: number) => {
      for (let day = 1; day <= 28; day++) {
        const lot = lotteryBoard(`2026-04-${String(day).padStart(2, '0')}`, { zone, stage: 1, companionsUnlocked: true }).find(
          (candidate) => candidate.prize.kind === 'gold' && candidate.rarity === 'common',
        );
        if (lot?.prize.kind === 'gold') {
          return lot.prize.amount;
        }
      }
      throw new Error('aucun lot d\'or commun sur le mois');
    };
    expect(goldIn(8)).toBeGreaterThan(goldIn(2));
  });

  it('tire les cases selon leurs chances', () => {
    const lots = lotteryBoard('2026-10-14', LATE_GAME);
    expect(drawSlot(0, lots)).toBe(0);
    expect(drawSlot(0.34, lots)).toBe(0);
    expect(drawSlot(0.35, lots)).toBe(1);
    expect(drawSlot(0.97, lots)).toBe(4);
    expect(drawSlot(0.99, lots)).toBe(5);
    expect(drawSlot(0.999999, lots)).toBe(5);
  });

  it('un tirage par jour', () => {
    expect(canDraw({ lastDraw: null }, '2026-10-14')).toBe(true);
    expect(canDraw({ lastDraw: '2026-10-14' }, '2026-10-14')).toBe(false);
    expect(canDraw({ lastDraw: '2026-10-13' }, '2026-10-14')).toBe(true);
  });

  it('rejette une sauvegarde invalide', () => {
    expect(isValidLotteryState({ lastDraw: '2026-10-14' })).toBe(true);
    expect(isValidLotteryState({ lastDraw: null })).toBe(true);
    expect(isValidLotteryState({ lastDraw: 'hier' })).toBe(false);
    expect(isValidLotteryState(null)).toBe(false);
  });

  it('le générateur à graine reste dans [0, 1)', () => {
    const random = seededRandom('2026-10-14');
    for (let i = 0; i < 1000; i++) {
      const value = random();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});
