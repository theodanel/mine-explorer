// Règles pures de la loterie du jour : les lots du jour et le tirage.
import { goldForDamage, rockHp } from '../balance/balance';
import { LOTTERY_CATALOGUE, LOTTERY_SLOTS, PrizeTemplate } from '../balance/lottery';
import type { Rarity } from '../balance/skill-tree';
import { Random } from '../shared/random';

export type LotteryPrize =
  | { readonly kind: 'gold'; readonly amount: number }
  | { readonly kind: 'shards'; readonly amount: number }
  | { readonly kind: 'stones'; readonly amount: number }
  | { readonly kind: 'egg'; readonly minRarity: Rarity };

export interface LotteryLot {
  readonly rarity: Rarity;
  readonly chance: number;
  readonly prize: LotteryPrize;
}

/** Ce dont dépendent les lots : l'or suit le filon du joueur, œufs et pierres attendent l'onglet Compagnons. */
export interface LotteryContext {
  readonly zone: number;
  readonly stage: number;
  readonly companionsUnlocked: boolean;
}

export interface LotteryState {
  /** Jour (AAAA-MM-JJ, heure du joueur) du dernier tirage, ou null s'il n'a jamais joué. */
  readonly lastDraw: string | null;
}

export const EMPTY_LOTTERY: LotteryState = { lastDraw: null };

export function isValidLotteryState(value: unknown): value is LotteryState {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const { lastDraw } = value as Record<string, unknown>;
  return lastDraw === null || (typeof lastDraw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(lastDraw));
}

export function canDraw(state: LotteryState, today: string): boolean {
  return state.lastDraw !== today;
}

/**
 * Les six lots du jour. Le jour sert de graine : tout le monde voit les mêmes lots toute la journée, même après
 * un rechargement, et ils changent à minuit. Dans une même rareté, deux cases n'ont pas le même lot.
 */
export function lotteryBoard(day: string, context: LotteryContext): readonly LotteryLot[] {
  const random = seededRandom(day);
  const taken = new Set<PrizeTemplate>();
  return LOTTERY_SLOTS.map(({ rarity, chance }) => {
    const allowed = LOTTERY_CATALOGUE[rarity].filter((template) => context.companionsUnlocked || !needsCompanions(template));
    const fresh = allowed.filter((template) => !taken.has(template));
    const pool = fresh.length > 0 ? fresh : allowed;
    const template = pool[Math.floor(random() * pool.length)];
    taken.add(template);
    return { rarity, chance, prize: prizeFor(template, context) };
  });
}

/** Case tirée pour un nombre dans [0, 1), selon les chances affichées. */
export function drawSlot(roll: number, lots: readonly LotteryLot[]): number {
  let cumulated = 0;
  for (const [index, lot] of lots.entries()) {
    cumulated += lot.chance;
    if (roll < cumulated) {
      return index;
    }
  }
  return lots.length - 1;
}

function needsCompanions(template: PrizeTemplate): boolean {
  return template.kind === 'egg' || template.kind === 'stones';
}

function prizeFor(template: PrizeTemplate, context: LotteryContext): LotteryPrize {
  if (template.kind === 'gold') {
    return { kind: 'gold', amount: goldForDamage(rockHp(context.zone, context.stage) * template.stages, 0) };
  }
  return template;
}

/** Générateur reproductible (mulberry32) dont la graine est le hachage FNV-1a du texte. */
export function seededRandom(seed: string): Random {
  let state = 2166136261;
  for (const char of seed) {
    state = Math.imul(state ^ char.charCodeAt(0), 16777619);
  }
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}
