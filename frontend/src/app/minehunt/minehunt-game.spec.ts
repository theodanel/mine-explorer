import { caveInChance, propsFor, ROCKS_PER_RUN } from '../balance/minehunt';
import { recommendedPower } from '../balance/balance';
import { breakRock, cashOut, Gamble, isOver, nextRisk, startGamble } from './minehunt-game';

/** Tirages imposés : chaque appel rend la valeur suivante, puis la dernière en boucle. */
function sequence(...values: number[]): () => number {
  let index = 0;
  return () => values[Math.min(index++, values.length - 1)];
}

const SAFE = 0.99;
const CAVE_IN = 0;

function breakTimes(gamble: Gamble, times: number, random: () => number): Gamble {
  let next = gamble;
  for (let index = 0; index < times; index++) {
    next = breakRock(next, random);
  }
  return next;
}

describe('minehunt-game', () => {
  it('fait grossir la cagnotte à chaque rocher et monter le risque', () => {
    const start = startGamble(0, 0);
    const two = breakTimes(start, 2, () => SAFE);
    expect(two.rocks.map((rock) => rock.kind)).toEqual(['loot', 'loot']);
    expect(two.ores).toBe(2 + 3);
    expect(two.goldStages).toBeCloseTo(0.3 + 0.45);
    expect(nextRisk(two)).toBeGreaterThan(nextRisk(start));
    expect(isOver(two)).toBe(false);
  });

  it('perd toute la cagnotte sous un éboulement sans étai', () => {
    const rich = breakTimes(startGamble(0, 0), 3, () => SAFE);
    const buried = breakRock(rich, () => CAVE_IN);
    expect(buried.status).toBe('buried');
    expect(buried.ores).toBe(0);
    expect(buried.goldStages).toBe(0);
    expect(breakRock(buried, () => SAFE)).toBe(buried);
  });

  it("garde la cagnotte quand un étai retient l'éboulement", () => {
    const rich = breakTimes(startGamble(1, 0), 2, () => SAFE);
    const propped = breakRock(rich, () => CAVE_IN);
    expect(propped.status).toBe('playing');
    expect(propped.props).toBe(0);
    expect(propped.ores).toBe(rich.ores);
    expect(propped.rocks.at(-1)?.kind).toBe('propped');
  });

  it('encaisse quand le joueur le décide', () => {
    const cashed = cashOut(breakTimes(startGamble(0, 0), 1, () => SAFE));
    expect(cashed.status).toBe('cashed');
    expect(cashed.ores).toBe(2);
  });

  it('cache des coffres à partir du cinquième rocher', () => {
    const early = breakTimes(startGamble(0, 0), 4, sequence(SAFE));
    expect(early.chests).toBe(0);
    // Rocher sûr (0,99), puis coffre tiré (0)
    const chest = breakRock(early, sequence(SAFE, 0));
    expect(chest.chests).toBe(1);
  });

  it('majore la cagnotte quand toute la file est cassée', () => {
    const complete = breakTimes(startGamble(0, 0), ROCKS_PER_RUN, () => SAFE);
    expect(complete.status).toBe('complete');
    // 2 + 3 + … + 11 minerais, majorés de moitié
    expect(complete.ores).toBe(Math.round(65 * 1.5));
  });
});

describe('équilibrage de la Chasse', () => {
  it('réduit le risque avec la Chance, sans jamais l’effacer', () => {
    expect(caveInChance(0, 0)).toBeCloseTo(0.08);
    expect(caveInChance(9, 0)).toBeCloseTo(0.44);
    expect(caveInChance(9, 0.2)).toBeCloseTo(0.44 * 0.7);
    expect(caveInChance(9, 10)).toBeCloseTo(0.44 * 0.6);
  });

  it('donne des étais à la Puissance', () => {
    const recommended = recommendedPower(6, 1);
    expect(propsFor(recommended / 2, 6, 1)).toBe(0);
    expect(propsFor(recommended, 6, 1)).toBe(1);
    expect(propsFor(recommended * 2, 6, 1)).toBe(2);
    expect(propsFor(recommended * 100, 6, 1)).toBe(3);
  });
});
