import { CHALLENGE_DAYS, CHALLENGE_MILESTONES, CHALLENGE_POINTS } from '../balance/challenge';
import { EMPTY_COUNTERS } from '../missions/mission-rules';
import { challengeEndsAt, challengePeriod, challengePoints, claimableMilestones } from './challenge-rules';

describe('challenge-rules', () => {
  it('compte les points depuis le début du défi', () => {
    const baseline = { ...EMPTY_COUNTERS, rocksBroken: 10, itemsForged: 100 };
    const counters = { ...baseline, rocksBroken: 12, itemsForged: 110, eventsTouched: 1 };
    expect(challengePoints(counters, baseline)).toBe(
      2 * CHALLENGE_POINTS.rocksBroken + 10 * CHALLENGE_POINTS.itemsForged + CHALLENGE_POINTS.eventsTouched,
    );
  });

  it('propose les paliers atteints et pas encore récupérés', () => {
    const second = CHALLENGE_MILESTONES[1].points;
    expect(claimableMilestones(second, [])).toEqual([0, 1]);
    expect(claimableMilestones(second, [0])).toEqual([1]);
    expect(claimableMilestones(0, [])).toEqual([]);
  });

  it('change de défi tous les 3 jours, et finit au début du suivant', () => {
    const start = new Date(2026, 9, 13, 12).getTime();
    const end = challengeEndsAt(start);
    expect(end).toBeGreaterThan(start);
    expect(end - start).toBeLessThanOrEqual(CHALLENGE_DAYS * 24 * 60 * 60 * 1000);
    expect(challengePeriod(end)).toBe(challengePeriod(start) + 1);
    expect(challengePeriod(end - 1)).toBe(challengePeriod(start));
  });
});
