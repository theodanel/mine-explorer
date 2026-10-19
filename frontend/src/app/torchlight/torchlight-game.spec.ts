import { CAVE_COLUMNS, CAVE_CONTENT, CAVE_ROWS, monsterSteps, torchRadius, TREASURE_ROWS } from '../balance/torchlight';
import { recommendedPower } from '../balance/balance';
import { seededRandom } from '../lottery/lottery-rules';
import {
  CellContent,
  distance,
  generateCave,
  isLit,
  leaveCave,
  orthogonalNeighbours,
  prowl,
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
/** Hasard fixe : les monstres prennent toujours la première case libre. */
const FIRST = (): number => 0;

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

  it("n'éclaire que les cases autour du mineur", () => {
    const expedition = startExpedition(cave({ [START_INDEX - 2 * CAVE_COLUMNS]: 'monster' }), 30, 1, 2);
    expect(isLit(expedition, UP)).toBe(true);
    expect(isLit(expedition, START_INDEX - 2 * CAVE_COLUMNS)).toBe(false);
  });

  it("fait bouger les monstres d'une case tous les 2 pas", () => {
    const lurking = START_INDEX - 4 * CAVE_COLUMNS;
    const start = startExpedition(cave({ [lurking]: 'monster' }), 30, 1, 2);
    const once = step(start, UP, FIRST);
    expect(once.cells.indexOf('monster')).toBe(lurking);
    const twice = step(once, UP - CAVE_COLUMNS, FIRST);
    expect(twice.turns).toBe(2);
    expect(distance(twice.cells.indexOf('monster'), lurking)).toBe(1);
    expect(twice.cells.filter((cell) => cell === 'monster').length).toBe(1);
  });

  it('ne fait marcher un monstre ni sur le mineur, ni sur un rocher, ni sur une trouvaille', () => {
    const cornered = cave({ [UP]: 'monster', [UP - CAVE_COLUMNS]: 'wall', [UP - 1]: 'chest', [UP + 1]: 'oil' });
    expect(prowl(cornered, START_INDEX, FIRST)).toEqual(cornered);
  });

  it("n'avance que d'une case, jamais dans un rocher", () => {
    const expedition = startExpedition(cave({ [START_INDEX - 1]: 'wall' }), 30, 1, 2);
    expect(step(expedition, START_INDEX - 1, FIRST)).toBe(expedition);
    expect(step(expedition, START_INDEX - 2 * CAVE_COLUMNS, FIRST)).toBe(expedition);
    const moved = step(expedition, UP, FIRST);
    expect(moved.position).toBe(UP);
    expect(moved.stepsLeft).toBe(29);
  });

  it('ramasse les trouvailles, et un monstre coûte ses pas mais lâche une pierre', () => {
    const start = startExpedition(cave({ [UP]: 'monster', [UP - CAVE_COLUMNS]: 'oil', [UP - 2 * CAVE_COLUMNS]: 'chest' }), 30, 1, 4);
    const fought = step(start, UP, FIRST);
    expect(fought.stepsLeft).toBe(26);
    expect(fought.stones).toBe(1);
    expect(fought.cells[UP]).toBe('floor');
    const oiled = step(fought, UP - CAVE_COLUMNS, FIRST);
    expect(oiled.stepsLeft).toBe(29);
    const chest = step(oiled, UP - 2 * CAVE_COLUMNS, FIRST);
    expect(chest.stones).toBe(3);
    expect(chest.goldStages).toBe(3);
  });

  it('finit au trésor, quand la torche s’éteint, ou en rentrant', () => {
    expect(step(startExpedition(cave({ [UP]: 'treasure' }), 30, 1, 2), UP, FIRST).status).toBe('treasure');
    expect(step(startExpedition(cave({}), 1, 1, 2), UP, FIRST).status).toBe('exhausted');
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
