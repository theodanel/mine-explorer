import { FIRST_FORK_METERS, FORK_EVERY_METERS, INVULNERABLE_MS, MAX_SPEED, START_SPEED, VIEW_METERS } from '../balance/minecart';
import { seededRandom } from '../lottery/lottery-rules';
import { chooseFork, isOver, LANES, Ride, speedOf, startRide, steer, Thing, tick } from './minecart-game';

/** Avance jusqu'à ce que le wagonnet ait parcouru `meters`, par pas de 50 ms. */
function rideTo(ride: Ride, meters: number, random = seededRandom('test')): Ride {
  let next = ride;
  while (next.distance < meters && !isOver(next)) {
    next = tick(next, 50, random);
  }
  return next;
}

function withThings(ride: Ride, things: Thing[]): Ride {
  // Rangées repoussées loin : seules les choses posées par le test comptent
  return { ...ride, things, nextRowAt: 10_000 };
}

describe('minecart-game', () => {
  it('part au milieu, avec ses cœurs', () => {
    const ride = startRide(3);
    expect(ride.lane).toBe(1);
    expect(ride.hearts).toBe(3);
    expect(speedOf(ride)).toBe(START_SPEED);
  });

  it('change de voie sans sortir des rails', () => {
    const ride = startRide(3);
    expect(steer(ride, -1).lane).toBe(0);
    expect(steer(steer(ride, -1), -1).lane).toBe(0);
    expect(steer(steer(ride, 1), 1).lane).toBe(2);
  });

  it('accélère jusqu’à la vitesse maximale', () => {
    expect(speedOf({ ...startRide(3), elapsedMs: 10_000_000 })).toBe(MAX_SPEED);
  });

  it('perd un cœur sur un obstacle de sa voie, puis reste intouchable un instant', () => {
    let ride = withThings(startRide(3), [
      { id: 1, kind: 'rockfall', lane: 1, at: 2 },
      { id: 2, kind: 'brokenRail', lane: 1, at: 3 },
    ]);
    ride = tick(ride, 400, () => 0.5);
    expect(ride.hearts).toBe(2);
    expect(ride.events).toContainEqual({ kind: 'hit', obstacle: 'rockfall' });
    expect(ride.invulnerableUntilMs).toBe(400 + INVULNERABLE_MS);
  });

  it('ignore les obstacles des autres voies et ramasse ce qui est sur la sienne', () => {
    let ride = withThings(startRide(3), [
      { id: 1, kind: 'rockfall', lane: 0, at: 2 },
      { id: 2, kind: 'ore', lane: 1, at: 2 },
      { id: 3, kind: 'nugget', lane: 1, at: 2.5 },
    ]);
    ride = tick(ride, 400, () => 0.5);
    expect(ride.hearts).toBe(3);
    expect(ride.ores).toBe(1);
    expect(ride.nuggets).toBe(1);
  });

  it('la chauve-souris se jette sur sa voie quand le wagonnet approche', () => {
    let ride = withThings(startRide(3), [{ id: 1, kind: 'bat', lane: 0, at: 20, swoopTo: 1 }]);
    ride = tick(ride, 100, () => 0.5);
    expect(ride.things[0].lane).toBe(0);
    ride = rideTo(ride, 9);
    expect(ride.things.find((thing) => thing.id === 1)?.lane).toBe(1);
  });

  it('s’écrase quand il n’a plus de cœur', () => {
    let ride = withThings(startRide(1), [{ id: 1, kind: 'rockfall', lane: 1, at: 2 }]);
    ride = tick(ride, 400, () => 0.5);
    expect(isOver(ride)).toBe(true);
    expect(ride.events).toContainEqual({ kind: 'crash' });
    expect(steer(ride, 1)).toBe(ride);
  });

  it('prend la voie sûre par défaut à l’aiguillage, la risquée si on la choisit', () => {
    const safe = rideTo(withThings(startRide(5), []), FIRST_FORK_METERS + 1);
    expect(safe.risky).toBe(false);
    expect(safe.fork.at).toBe(FIRST_FORK_METERS + FORK_EVERY_METERS);
    const risky = rideTo(chooseFork(withThings(startRide(5), []), 'risky'), FIRST_FORK_METERS + 1);
    expect(risky.risky).toBe(true);
    expect(speedOf(risky)).toBeGreaterThan(speedOf({ ...risky, risky: false }));
  });

  it('laisse toujours au moins une voie libre dans chaque rangée', () => {
    const random = seededRandom('rangées');
    let ride = startRide(99);
    for (let step = 0; step < 2000; step++) {
      ride = tick(ride, 50, random);
    }
    const rows = new Map<number, Set<number>>();
    for (const thing of ride.things) {
      if (thing.kind === 'rockfall' || thing.kind === 'brokenRail' || thing.kind === 'bat') {
        const lanes = rows.get(thing.at) ?? new Set<number>();
        lanes.add(thing.swoopTo ?? thing.lane);
        rows.set(thing.at, lanes);
      }
    }
    expect(rows.size).toBeGreaterThan(0);
    for (const lanes of rows.values()) {
      expect(lanes.size).toBeLessThan(LANES.length);
    }
  });

  it('remplit la voie devant le wagonnet, pas au-delà de la vue', () => {
    const ride = tick(startRide(3), 50, seededRandom('vue'));
    expect(ride.things.length).toBeGreaterThan(0);
    expect(ride.things.every((thing) => thing.at <= ride.distance + VIEW_METERS)).toBe(true);
  });
});
