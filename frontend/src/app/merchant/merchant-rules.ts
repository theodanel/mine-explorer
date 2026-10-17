// Règles pures du Marchand nain : calendrier des visites, offres du jour, marchandage et bluff.
import {
  ATTEMPTS_PER_OFFER,
  BLUFF,
  HAGGLE,
  HINT_DAYS,
  MERCHANT_CATALOGUE,
  MerchantOffer,
  MOOD_AFTER_PURCHASE,
  OFFERS_PER_DAY,
  START_MOOD,
  VISIT_DAYS,
} from '../balance/merchant';
import { seededRandom } from '../lottery/lottery-rules';

/** Assez loin pour trouver à coup sûr sa prochaine visite : il passe tous les mois. */
const SEARCH_DAYS = 62;

/**
 * Jours de visite du mois (1 à 31), triés : 10 jours tirés au hasard parmi ceux du mois, sans qu'il y en ait
 * forcément d'affilée. Les mêmes pour tous les joueurs : ils se tirent du calendrier.
 */
export function visitDays(year: number, month: number): readonly number[] {
  const random = seededRandom(`marchand-${year}-${month}`);
  const days = Array.from({ length: new Date(year, month + 1, 0).getDate() }, (_, index) => index + 1);
  // Mélange de Fisher-Yates, puis les 10 premiers
  for (let index = days.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [days[index], days[other]] = [days[other], days[index]];
  }
  return days.slice(0, VISIT_DAYS).sort((a, b) => a - b);
}

function isVisitDay(day: Date): boolean {
  return visitDays(day.getFullYear(), day.getMonth()).includes(day.getDate());
}

export type MerchantPhase =
  | { readonly kind: 'away' }
  /** Il approche : les indices montent à mesure que le jour J se rapproche. */
  | { readonly kind: 'coming'; readonly daysLeft: number }
  /** Il est là ; lastDay : il repart ce soir et ne revient pas demain. */
  | { readonly kind: 'here'; readonly lastDay: boolean };

/** Où en est le marchand, à cette date (heure du joueur). */
export function merchantPhase(now: Date): MerchantPhase {
  if (isVisitDay(now)) {
    return { kind: 'here', lastDay: !isVisitDay(addDays(now, 1)) };
  }
  const daysLeft = daysUntilVisit(now);
  return daysLeft <= HINT_DAYS ? { kind: 'coming', daysLeft } : { kind: 'away' };
}

/** Jours avant sa prochaine arrivée (0 s'il est là). */
export function daysUntilVisit(now: Date): number {
  for (let ahead = 0; ahead < SEARCH_DAYS; ahead++) {
    if (isVisitDay(addDays(now, ahead))) {
      return ahead;
    }
  }
  return SEARCH_DAYS;
}

/** Même jour quelques jours plus tard, par le calendrier, pour ne pas buter sur un changement d'heure. */
function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days, 12);
}

/** Les 3 offres du jour, les mêmes pour tous les joueurs ce jour-là. */
export function dailyOffers(day: string): readonly MerchantOffer[] {
  const random = seededRandom(`marchand-${day}`);
  const pool = [...MERCHANT_CATALOGUE];
  const picked: MerchantOffer[] = [];
  while (picked.length < OFFERS_PER_DAY && pool.length > 0) {
    picked.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
  }
  return picked;
}

export type OfferStatus = 'open' | 'bought' | 'withdrawn';

export interface OfferState {
  /** Multiplicateur du prix de départ, après marchandage. */
  readonly factor: number;
  readonly attempts: number;
  readonly status: OfferStatus;
}

export interface MerchantState {
  readonly day: string;
  readonly mood: number;
  readonly offers: Readonly<Record<string, OfferState>>;
}

export function freshMerchantDay(day: string): MerchantState {
  return { day, mood: START_MOOD, offers: {} };
}

export function offerState(state: MerchantState, id: string): OfferState {
  return state.offers[id] ?? { factor: 1, attempts: 0, status: 'open' };
}

export type Outcome = 'success' | 'failure';

function clampMood(mood: number): number {
  return Math.min(Math.max(mood, 0), 100);
}

function canTry(offer: OfferState): boolean {
  return offer.status === 'open' && offer.attempts < ATTEMPTS_PER_OFFER;
}

/** Marchander : réussite selon l'humeur. Réussi, le prix baisse ; raté, il monte. L'humeur baisse dans les deux cas. */
export function haggle(state: MerchantState, id: string, roll: number): { state: MerchantState; outcome: Outcome } | null {
  const offer = offerState(state, id);
  if (!canTry(offer)) {
    return null;
  }
  const success = roll < HAGGLE.baseChance + (HAGGLE.moodChance * state.mood) / 100;
  const next: OfferState = {
    ...offer,
    attempts: offer.attempts + 1,
    factor: offer.factor * (success ? HAGGLE.success : HAGGLE.failure),
  };
  const mood = clampMood(state.mood - (success ? HAGGLE.moodCost : HAGGLE.moodPenalty));
  return { state: { ...state, mood, offers: { ...state.offers, [id]: next } }, outcome: success ? 'success' : 'failure' };
}

/** Bluffer : gros rabais si ça passe, sinon il retire l'offre pour la journée. */
export function bluff(state: MerchantState, id: string, roll: number): { state: MerchantState; outcome: Outcome } | null {
  const offer = offerState(state, id);
  if (!canTry(offer)) {
    return null;
  }
  const success = roll < BLUFF.baseChance + (BLUFF.moodChance * state.mood) / 100;
  const next: OfferState = success
    ? { ...offer, attempts: offer.attempts + 1, factor: offer.factor * BLUFF.success }
    : { ...offer, attempts: offer.attempts + 1, status: 'withdrawn' };
  const mood = clampMood(state.mood - (success ? BLUFF.moodCost : BLUFF.moodPenalty));
  return { state: { ...state, mood, offers: { ...state.offers, [id]: next } }, outcome: success ? 'success' : 'failure' };
}

/** Achat conclu : l'offre est prise et le marchand se réjouit. */
export function purchase(state: MerchantState, id: string): MerchantState | null {
  const offer = offerState(state, id);
  if (offer.status !== 'open') {
    return null;
  }
  return {
    ...state,
    mood: clampMood(state.mood + MOOD_AFTER_PURCHASE),
    offers: { ...state.offers, [id]: { ...offer, status: 'bought' } },
  };
}

export function canHaggle(state: MerchantState, id: string): boolean {
  return canTry(offerState(state, id));
}

export function isValidMerchantState(value: unknown): value is MerchantState {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  const { day, mood, offers } = value as Record<string, unknown>;
  if (typeof day !== 'string' || typeof mood !== 'number' || mood < 0 || mood > 100 || typeof offers !== 'object' || offers === null) {
    return false;
  }
  return Object.values(offers).every((offer) => {
    if (typeof offer !== 'object' || offer === null) {
      return false;
    }
    const { factor, attempts, status } = offer as Record<string, unknown>;
    return (
      typeof factor === 'number' &&
      factor > 0 &&
      Number.isSafeInteger(attempts) &&
      (attempts as number) >= 0 &&
      (status === 'open' || status === 'bought' || status === 'withdrawn')
    );
  });
}
