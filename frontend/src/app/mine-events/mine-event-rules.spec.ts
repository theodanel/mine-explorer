import { damagePerSecond, goldForDamage } from '../balance/balance';
import { EVENT_DELAY_MAX_MS, EVENT_DELAY_MIN_MS, MINE_EVENT_IDS } from '../balance/mine-events';
import { BASE_STATS } from '../balance/balance';
import { eventGain, goldForSeconds, nextEventDelayMs, rollEventId } from './mine-event-rules';

describe('mine-event-rules', () => {
  it('attend entre 2 et 4 minutes', () => {
    expect(nextEventDelayMs(() => 0)).toBe(EVENT_DELAY_MIN_MS);
    expect(nextEventDelayMs(() => 0.999999)).toBeLessThan(EVENT_DELAY_MAX_MS);
  });

  it('tire chaque événement, même avec un tirage à la limite', () => {
    expect(rollEventId(() => 0)).toBe(MINE_EVENT_IDS[0]);
    expect(rollEventId(() => 0.999999)).toBe(MINE_EVENT_IDS[MINE_EVENT_IDS.length - 1]);
  });

  it('paie l\'or en secondes de revenu actuel', () => {
    expect(goldForSeconds(BASE_STATS, 60)).toBe(goldForDamage(damagePerSecond(BASE_STATS) * 60, 0));
    expect(eventGain('thiefRat', BASE_STATS).gold).toBeGreaterThan(eventGain('giantGeode', BASE_STATS).gold);
    expect(eventGain('crystalRain', BASE_STATS)).toEqual({ gold: 0, shards: 1, ores: 0 });
  });
});
