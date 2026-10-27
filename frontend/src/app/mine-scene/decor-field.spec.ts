import { DECOR_CELL_PX, decorsIn } from './decor-field';

const AREA = { left: -1500, top: -1500, right: 1500, bottom: 1500 };

describe('décors semés sur le sol', () => {
  it('pose toujours les mêmes décors au même endroit', () => {
    expect(decorsIn(AREA, 6)).toEqual(decorsIn(AREA, 6));
  });

  it('garde au plus un décor par case, dans sa case', () => {
    const decors = decorsIn(AREA, 6);
    expect(new Set(decors.map((decor) => decor.key)).size).toBe(decors.length);
    for (const decor of decors) {
      const [column, row] = decor.key.split(':').map(Number);
      expect(Math.floor(decor.at.x / DECOR_CELL_PX)).toBe(column);
      expect(Math.floor(decor.at.y / DECOR_CELL_PX)).toBe(row);
      expect(decor.kind).toBeGreaterThanOrEqual(0);
      expect(decor.kind).toBeLessThan(6);
    }
  });

  it('laisse du sol nu entre les décors', () => {
    const cells = (AREA.right - AREA.left) / DECOR_CELL_PX + 1;
    const share = decorsIn(AREA, 6).length / cells ** 2;
    expect(share).toBeGreaterThan(0.25);
    expect(share).toBeLessThan(0.65);
  });

  it('ne pose rien sans images de décor', () => {
    expect(decorsIn(AREA, 0)).toEqual([]);
  });
});
