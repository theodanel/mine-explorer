// Règles pures du Défi de la mine : période en cours, points marqués, paliers atteints.
import { CHALLENGE_DAYS, CHALLENGE_MILESTONES, CHALLENGE_POINTS } from '../balance/challenge';
import type { Counters } from '../missions/mission-rules';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Numéro du jour local (minuit heure du joueur), compté depuis le 1er janvier 1970. */
export function localDayIndex(timestamp: number): number {
  const offsetMs = new Date(timestamp).getTimezoneOffset() * 60 * 1000;
  return Math.floor((timestamp - offsetMs) / DAY_MS);
}

/** Numéro du défi en cours : un nouveau tous les 3 jours. */
export function challengePeriod(timestamp: number): number {
  return Math.floor(localDayIndex(timestamp) / CHALLENGE_DAYS);
}

/** Fin du défi en cours : minuit local du jour où commence le suivant. */
export function challengeEndsAt(timestamp: number): number {
  const nextDay = (challengePeriod(timestamp) + 1) * CHALLENGE_DAYS;
  const naive = nextDay * DAY_MS;
  return naive + new Date(naive).getTimezoneOffset() * 60 * 1000;
}

/** Points marqués depuis le début du défi. */
export function challengePoints(counters: Counters, baseline: Counters): number {
  return (Object.keys(CHALLENGE_POINTS) as (keyof typeof CHALLENGE_POINTS)[]).reduce(
    (sum, id) => sum + Math.max(counters[id] - baseline[id], 0) * CHALLENGE_POINTS[id],
    0,
  );
}

/** Paliers atteints et pas encore récupérés. */
export function claimableMilestones(points: number, claimed: readonly number[]): number[] {
  return CHALLENGE_MILESTONES.flatMap((milestone, index) => (points >= milestone.points && !claimed.includes(index) ? [index] : []));
}
