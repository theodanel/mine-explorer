// Équilibrage du Marchand nain : 5 jours de visite par mois, des offres à marchander. Voir docs/game-design/marchand-nain.md.
import type { Rarity } from './skill-tree';
import type { EvolutionId } from './balance';

/** Le marchand sert à partir du Contremaître ; avant, ses visites passent sans qu'on les remarque. */
export const MERCHANT_UNLOCK_FORM: EvolutionId = 'foreman';

/** Il reste 5 jours d'affilée, à partir d'un jour du mois tiré du calendrier (entre le 3 et le 22). */
export const VISIT_DAYS = 5;
export const FIRST_POSSIBLE_DAY = 3;
export const POSSIBLE_START_DAYS = 20;
/** Les indices commencent 5 jours avant son arrivée. */
export const HINT_DAYS = 5;

/** Trois offres par jour de visite. Leur prix se compte en filons d'or de la zone du joueur. */
export const OFFERS_PER_DAY = 3;

export type MerchantGoods =
  | { readonly kind: 'shards'; readonly amount: number }
  | { readonly kind: 'stones'; readonly amount: number }
  | { readonly kind: 'ores'; readonly amount: number }
  | { readonly kind: 'egg'; readonly minRarity: Rarity };

export interface MerchantOffer {
  readonly id: string;
  readonly goods: MerchantGoods;
  /** Prix de départ, en filons d'or de la zone (milieu de zone). */
  readonly stages: number;
}

export const MERCHANT_CATALOGUE: readonly MerchantOffer[] = [
  { id: 'shards-60', goods: { kind: 'shards', amount: 60 }, stages: 6 },
  { id: 'shards-150', goods: { kind: 'shards', amount: 150 }, stages: 14 },
  { id: 'stones-10', goods: { kind: 'stones', amount: 10 }, stages: 8 },
  { id: 'stones-25', goods: { kind: 'stones', amount: 25 }, stages: 18 },
  { id: 'ores-30', goods: { kind: 'ores', amount: 30 }, stages: 5 },
  { id: 'ores-80', goods: { kind: 'ores', amount: 80 }, stages: 12 },
  { id: 'egg-rare', goods: { kind: 'egg', minRarity: 'rare' }, stages: 20 },
  { id: 'egg-epic', goods: { kind: 'egg', minRarity: 'epic' }, stages: 45 },
];

/**
 * Humeur du marchand, de 0 (furieux) à 100 (ravi). Elle part de 60 chaque jour, monte quand on achète et baisse
 * quand on marchande : plus elle est haute, plus le marchandage et le bluff réussissent.
 */
export const START_MOOD = 60;
export const MOOD_AFTER_PURCHASE = 10;

/** Marchander : de 30 % (furieux) à 80 % (ravi) de réussite. Réussi, −20 % ; raté, +10 % et l'humeur baisse. */
export const HAGGLE = { baseChance: 0.3, moodChance: 0.5, success: 0.8, failure: 1.1, moodCost: 10, moodPenalty: 15 } as const;
/** Bluffer : de 15 % à 55 %. Réussi, −40 % ; raté, il retire l'offre pour la journée. */
export const BLUFF = { baseChance: 0.15, moodChance: 0.4, success: 0.6, moodCost: 20, moodPenalty: 30 } as const;
/** Deux tentatives par offre : au-delà, le marchand campe sur son prix. */
export const ATTEMPTS_PER_OFFER = 2;
