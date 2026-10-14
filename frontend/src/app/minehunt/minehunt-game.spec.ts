import { HUNT_COLUMNS, HUNT_GAS_POCKETS, HUNT_ROWS } from '../balance/minehunt';
import { seededRandom } from '../lottery/lottery-rules';
import { Cell, dig, generateWall, Hunt, neighbours, startHunt, stop } from './minehunt-game';

function wall(gasAt: readonly number[], loot: Readonly<Record<number, Cell['content']>> = {}): Hunt {
  const cells = Array.from({ length: HUNT_COLUMNS * HUNT_ROWS }, (_, index): Cell => ({
    content: gasAt.includes(index) ? 'gas' : (loot[index] ?? 'empty'),
    dug: false,
    around: 0,
  }));
  const withHints = cells.map((cell, index) => ({ ...cell, around: neighbours(index).filter((other) => cells[other].content === 'gas').length }));
  return { cells: withHints, durability: 2, maxDurability: 2, ores: 0, nuggets: 0, chest: false, status: 'digging', events: [] };
}

describe('minehunt-game', () => {
  it('tire une paroi avec le bon nombre de grisous, un coffre et des indices justes', () => {
    const cells = generateWall(seededRandom('paroi'), 0);
    expect(cells).toHaveLength(HUNT_COLUMNS * HUNT_ROWS);
    expect(cells.filter((cell) => cell.content === 'gas')).toHaveLength(HUNT_GAS_POCKETS);
    expect(cells.filter((cell) => cell.content === 'chest')).toHaveLength(1);
    cells.forEach((cell, index) => {
      expect(cell.around).toBe(neighbours(index).filter((other) => cells[other].content === 'gas').length);
    });
  });

  it('compte les voisins d’une case de coin et du milieu', () => {
    expect(neighbours(0)).toHaveLength(3);
    expect(neighbours(HUNT_COLUMNS + 1)).toHaveLength(8);
  });

  it('ouvre en cascade les cases sans grisou autour, et ramasse le butin au passage', () => {
    const hunt = dig(wall([HUNT_COLUMNS * HUNT_ROWS - 1], { 3: 'ore', 4: 'nugget', 10: 'chest' }), 0);
    expect(hunt.cells.filter((cell) => cell.dug).length).toBe(HUNT_COLUMNS * HUNT_ROWS - 1);
    expect(hunt).toMatchObject({ ores: 1, nuggets: 1, chest: true, status: 'cleared' });
  });

  it('s’arrête sur une case indice', () => {
    const hunt = dig(wall([2]), 1);
    expect(hunt.cells.filter((cell) => cell.dug)).toHaveLength(1);
    expect(hunt.cells[1].around).toBe(1);
  });

  it('abîme la pioche sur le grisou, et la casse au dernier coup', () => {
    let hunt = dig(wall([0, 1]), 0);
    expect(hunt.durability).toBe(1);
    expect(hunt.status).toBe('digging');
    hunt = dig(hunt, 1);
    expect(hunt.status).toBe('broken');
    expect(dig(hunt, 20).cells[20].dug).toBe(false);
  });

  it('remonte quand le joueur le décide', () => {
    expect(stop(wall([0])).status).toBe('stopped');
  });

  it('ouvre des cases d’office au départ, sans toucher au grisou', () => {
    const hunt = startHunt(3, 2, 0, seededRandom('départ'));
    expect(hunt.durability).toBe(3);
    expect(hunt.cells.some((cell) => cell.dug)).toBe(true);
    expect(hunt.cells.some((cell) => cell.dug && cell.content === 'gas')).toBe(false);
  });
});
