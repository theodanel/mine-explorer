import { followCamera, HeroWalk, nextStand, Point, stepDistance } from './top-down-path';

/** Tirages reproductibles, répartis sur tout [0, 1). */
function sequence(): () => number {
  let seed = 7;
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
}

describe('trajet de la vue du dessus', () => {
  it('rapproche le filon suivant quand le joueur frappe vite, sans descendre sous un pas lisible', () => {
    expect(stepDistance(1083)).toBeGreaterThan(stepDistance(361));
    expect(stepDistance(0)).toBeGreaterThan(0);
    expect(stepDistance(10_000)).toBeLessThanOrEqual(stepDistance(1083));
  });

  it('caméra qui suit : le héros descend toujours plus profond, sans revenir sur ses pas', () => {
    const random = sequence();
    let at: Point = { x: 0, y: 0 };
    let heading = Math.PI / 2;
    let facing: 1 | -1 = 1;
    for (let step = 0; step < 200; step++) {
      const next = nextStand(at, heading, facing, 200, random, null);
      expect(next.spot.y).toBeGreaterThan(at.y);
      expect(Math.hypot(next.spot.x - at.x, next.spot.y - at.y)).toBeLessThanOrEqual(200);
      ({ heading, facing } = next);
      at = next.spot;
    }
  });

  it('regarde du côté où il marche, en miroir à gauche', () => {
    const left = nextStand({ x: 0, y: 0 }, Math.PI, 1, 200, () => 0.5, { minX: -1000, maxX: 1000, minY: -1000, maxY: 1000 });
    expect(left.facing).toBe(-1);
    const right = nextStand({ x: 0, y: 0 }, 0, -1, 200, () => 0.5, { minX: -1000, maxX: 1000, minY: -1000, maxY: 1000 });
    expect(right.facing).toBe(1);
  });

  it('caméra fixe : le héros reste dans la clairière', () => {
    const random = sequence();
    const bounds = { minX: 230, maxX: 490, minY: 610, maxY: 790 };
    let at: Point = { x: 360, y: 690 };
    let heading = Math.PI / 2;
    let facing: 1 | -1 = 1;
    for (let step = 0; step < 200; step++) {
      const next = nextStand(at, heading, facing, 280, random, bounds);
      expect(next.spot.x).toBeGreaterThanOrEqual(bounds.minX);
      expect(next.spot.x).toBeLessThanOrEqual(bounds.maxX);
      expect(next.spot.y).toBeGreaterThanOrEqual(bounds.minY);
      expect(next.spot.y).toBeLessThanOrEqual(bounds.maxY);
      ({ heading, facing } = next);
      at = next.spot;
    }
  });
});

describe('caméra amortie', () => {
  it('ne bouge pas tant que le héros reste dans la zone morte', () => {
    const camera = { x: 0, y: 0 };
    expect(followCamera(camera, { x: 40, y: 30 }, 60, 16, 380)).toBe(camera);
  });

  it('rattrape le héros en douceur sans jamais le dépasser', () => {
    const target = { x: 500, y: 0 };
    let camera: Point = { x: 0, y: 0 };
    let previous = camera.x;
    for (let tick = 0; tick < 600; tick++) {
      camera = followCamera(camera, target, 60, 16, 380);
      expect(camera.x).toBeGreaterThanOrEqual(previous);
      expect(camera.x).toBeLessThanOrEqual(target.x);
      previous = camera.x;
    }
    expect(target.x - camera.x).toBeCloseTo(60, 0);
  });
});

describe('marche du héros', () => {
  it('part du filon cassé et arrive au suivant au bout de la fenêtre', () => {
    const walk = new HeroWalk();
    walk.start({ x: 0, y: 0 }, { x: 100, y: 40 }, 1000);
    const middle = walk.update(500, false);
    expect(middle.x).toBeCloseTo(50, 5);
    expect(walk.walking).toBe(true);
    expect(walk.update(500, false)).toEqual({ x: 100, y: 40 });
    expect(walk.walking).toBe(false);
  });

  it('est posé d\'office si le métronome reprend l\'élan avant la fin', () => {
    const walk = new HeroWalk();
    walk.start({ x: 0, y: 0 }, { x: 100, y: 40 }, 1000);
    walk.update(100, false);
    expect(walk.update(16, true)).toEqual({ x: 100, y: 40 });
    expect(walk.walking).toBe(false);
  });
});
