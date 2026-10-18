import { seededRandom } from '../lottery/lottery-rules';
import {
  AMBIENCE_AREA,
  AMBIENCES,
  AmbienceId,
  PASSERS,
  passerDelay,
  spawnParticle,
  stepParticle,
  zoneAmbience,
  zonePasser,
} from './ambience';

const SECONDS_PER_FRAME = 1 / 60;
const SIMULATED_FRAMES = 60 * 30;

describe('ambience', () => {
  it('donne une ambiance à chaque zone, et garde celle du Cœur du monde au-delà', () => {
    expect(zoneAmbience(5)).toBe(AMBIENCES.embers);
    expect(zoneAmbience(12)).toBe(AMBIENCES.snow);
    expect(zoneAmbience(25)).toBe(zoneAmbience(20));
  });

  it.each(Object.keys(AMBIENCES) as AmbienceId[])('garde les particules « %s » dans la grotte, en mouvement', (id) => {
    const preset = AMBIENCES[id];
    const random = seededRandom(id);
    let particle = spawnParticle(preset, random, true);
    let moved = false;
    for (let frame = 0; frame < SIMULATED_FRAMES; frame++) {
      const next = stepParticle(particle, preset, SECONDS_PER_FRAME, random);
      moved ||= next.x !== particle.x || next.y !== particle.y || next.alpha !== particle.alpha;
      particle = next;
      expect(particle.x).toBeGreaterThanOrEqual(AMBIENCE_AREA.left);
      expect(particle.x).toBeLessThanOrEqual(AMBIENCE_AREA.right);
      expect(particle.y).toBeGreaterThanOrEqual(AMBIENCE_AREA.top);
      expect(particle.y).toBeLessThanOrEqual(AMBIENCE_AREA.bottom);
      expect(particle.alpha).toBeGreaterThanOrEqual(0);
      expect(particle.alpha).toBeLessThanOrEqual(preset.alpha);
    }
    expect(moved).toBe(true);
  });

  it('fait passer la silhouette de la zone : chauves-souris en zone 1, dragon divin au sanctuaire', () => {
    expect(zonePasser(1)).toBe(PASSERS.bats);
    expect(zonePasser(10)).toBe(PASSERS.divineDragon);
    expect(zonePasser(25)).toBe(zonePasser(20));
  });

  it('fait passer la première silhouette plus tôt que les suivantes', () => {
    const random = seededRandom('passages');
    for (let draw = 0; draw < 20; draw++) {
      expect(passerDelay(random, true)).toBeLessThanOrEqual(80);
      expect(passerDelay(random, false)).toBeGreaterThanOrEqual(120);
    }
  });
});
