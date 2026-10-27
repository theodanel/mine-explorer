import { hasCrossedFrame } from './frame-crossing';
import { HeroWalk } from './top-down-path';
import { IMPACT_FRAME, isWindingUp, STRIKE_FRAME_COUNT, strikeCycleMs, walkWindowMs, windUpMs } from './strike-rhythm';

/** Vitesse d'animation de base (12 images par seconde), vitesse maximale (×3) et sous Frénésie (×4). */
const BASE_SPEED = 0.2;
const SPEEDS = [BASE_SPEED, BASE_SPEED * 3, BASE_SPEED * 4];
const TICK_MS = 1000 / 60;

describe('rythme du coup de pioche', () => {
  it('donne 1,1 s de marche au départ et 0,36 s à vitesse maximale', () => {
    expect(walkWindowMs(BASE_SPEED)).toBeCloseTo(1083, 0);
    expect(walkWindowMs(BASE_SPEED * 3)).toBeCloseTo(361, 0);
  });

  it.each(SPEEDS)('à la vitesse %d, le trajet tient dans le temps avant le prochain impact moins l\'élan', (speed) => {
    expect(walkWindowMs(speed)).toBeLessThanOrEqual(strikeCycleMs(speed) - windUpMs(speed));
  });

  it('distingue l\'élan (avant l\'impact) de la fin du geste', () => {
    expect(isWindingUp(0)).toBe(true);
    expect(isWindingUp(IMPACT_FRAME - 1)).toBe(true);
    expect(isWindingUp(IMPACT_FRAME)).toBe(false);
    expect(isWindingUp(STRIKE_FRAME_COUNT - 1)).toBe(false);
  });

  // Rejoue le métronome comme Pixi (animationSpeed image par tick, ticks irréguliers) et une marche à chaque impact :
  // le héros ne doit jamais être en route pendant l'élan, ni au moment d'un impact.
  it.each([
    [BASE_SPEED, TICK_MS],
    [BASE_SPEED * 3, TICK_MS],
    [BASE_SPEED * 4, TICK_MS],
    [BASE_SPEED * 3, 50],
  ])('à la vitesse %d (tick de %d ms), le héros est arrivé avant l\'élan suivant', (speed, tickMs) => {
    const walk = new HeroWalk();
    let time = 0;
    let previousFrame = 0;
    let impacts = 0;
    for (let tick = 0; tick < 2000; tick++) {
      time += (speed * tickMs) / TICK_MS;
      const frame = Math.floor(time) % STRIKE_FRAME_COUNT;
      walk.update(tickMs, isWindingUp(frame));
      if (isWindingUp(frame)) {
        expect(walk.walking).toBe(false);
      }
      if (hasCrossedFrame(previousFrame, frame, IMPACT_FRAME)) {
        expect(walk.walking).toBe(false);
        impacts++;
        walk.start({ x: 0, y: 0 }, { x: 200, y: 50 }, walkWindowMs(speed));
      }
      previousFrame = frame;
    }
    expect(impacts).toBeGreaterThan(10);
  });
});
