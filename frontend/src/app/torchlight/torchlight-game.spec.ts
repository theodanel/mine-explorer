import { CAVE_COLUMNS, CAVE_CONTENT, CAVE_ROWS, monsterSteps, torchRadius, TREASURE_ROWS } from '../balance/torchlight';
import { recommendedPower } from '../balance/balance';
import { seededRandom } from '../lottery/lottery-rules';
import {
  CellContent,
  distance,
  generateCave,
  isGlimpsed,
  isLit,
  leaveCave,
  orthogonalNeighbours,
  rowOf,
  START_INDEX,
  startExpedition,
  step,
} from './torchlight-game';

/** Grotte vide, avec ce qu'on veut aux cases données. */
function cave(contents: Readonly<Record<number, CellContent>>): CellContent[] {
  return Array.from({ length: CAVE_COLUMNS * CAVE_ROWS }, (_, index) => contents[index] ?? 'floor');
}

const UP = START_INDEX - CAVE_COLUMNS;

describe('torchlight-game', () => {
  it('tire une grotte complète, trésor en haut, départ dégagé', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const cells = generateCave(seededRandom(`grotte-${seed}`));
      const count = (content: CellContent): number => cells.filter((cell) => cell === content).length;
      expect(count('treasure')).toBe(1);
      expect(rowOf(cells.indexOf('treasure'))).toBeLessThan(TREASURE_ROWS);
      expect(count('monster')).toBe(CAVE_CONTENT.monsters);
      expect(cells[START_INDEX]).toBe('floor');
      expect(orthogonalNeighbours(START_INDEX).every((index) => cells[index] === 'floor')).toBe(true);
    }
  });

  it('éclaire autour du mineur et laisse voir les yeux une case plus loin', () => {
    const expedition = startExpedition(cave({ [START_INDEX - 2 * CAVE_COLUMNS]: 'monster' }), 30, 1, 2);
    expect(isLit(expedition, UP)).toBe(true);
    expect(isLit(expedition, START_INDEX - 2 * CAVE_COLUMNS)).toBe(false);
    expect(isGlimpsed(expedition, START_INDEX - 2 * CAVE_COLUMNS)).toBe(true);
    expect(expedition.seen.filter(Boolean).length).toBe(6);
  });

  it("n'avance que d'une case, jamais dans un rocher", () => {
    const expedition = startExpedition(cave({ [START_INDEX - 1]: 'wall' }), 30, 1, 2);
    expect(step(expedition, START_INDEX - 1)).toBe(expedition);
    expect(step(expedition, START_INDEX - 2 * CAVE_COLUMNS)).toBe(expedition);
    const moved = step(expedition, UP);
    expect(moved.position).toBe(UP);
    expect(moved.stepsLeft).toBe(29);
  });

  it('ramasse les trouvailles, et un monstre coûte ses pas mais lâche une pierre', () => {
    const start = startExpedition(cave({ [UP]: 'monster', [UP - CAVE_COLUMNS]: 'oil', [UP - 2 * CAVE_COLUMNS]: 'chest' }), 30, 1, 4);
    const fought = step(start, UP);
    expect(fought.stepsLeft).toBe(26);
    expect(fought.stones).toBe(1);
    expect(fought.cells[UP]).toBe('floor');
    const oiled = step(fought, UP - CAVE_COLUMNS);
    expect(oiled.stepsLeft).toBe(29);
    const chest = step(oiled, UP - 2 * CAVE_COLUMNS);
    expect(chest.stones).toBe(3);
    expect(chest.goldStages).toBe(3);
  });

  it('finit au trésor, quand la torche s’éteint, ou en rentrant', () => {
    expect(step(startExpedition(cave({ [UP]: 'treasure' }), 30, 1, 2), UP).status).toBe('treasure');
    expect(step(startExpedition(cave({}), 1, 1, 2), UP).status).toBe('exhausted');
    expect(leaveCave(startExpedition(cave({}), 30, 1, 2)).status).toBe('left');
  });

  it('mesure la lumière en carré autour du mineur', () => {
    expect(distance(START_INDEX, START_INDEX - CAVE_COLUMNS - 1)).toBe(1);
  });
});

describe("équilibrage de l'Expédition", () => {
  it('agrandit la torche avec la Chance', () => {
    expect(torchRadius(0)).toBe(1);
    expect(torchRadius(0.15)).toBe(2);
  });

  it('fait payer moins de pas aux monstres quand la Puissance suit', () => {
    const recommended = recommendedPower(10, 1);
    expect(monsterSteps(recommended, 10, 1)).toBe(2);
    expect(monsterSteps(recommended / 2, 10, 1)).toBe(4);
  });
});
