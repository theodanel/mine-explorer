import type { Point } from './top-down-path';

/** Le sol est découpé en cases : au plus un décor par case, toujours le même pour une case donnée. */
export const DECOR_CELL_PX = 300;
/** Part des cases qui portent un décor. */
const DECOR_DENSITY = 0.45;
/** Le décor reste loin des bords de sa case : deux décors voisins ne se chevauchent pas. */
const CELL_INSET = 0.2;

export interface PlacedDecor {
  /** Identifiant stable de la case, pour garder le même sprite tant qu'elle reste à l'écran. */
  readonly key: string;
  readonly kind: number;
  readonly at: Point;
  /** 1 ou -1 : un décor sur deux est retourné, pour varier avec peu d'images. */
  readonly flip: 1 | -1;
}

export interface Area {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

/**
 * Décors posés sur le sol visible, tirés d'un hasard fixé par la case : la galerie reste la même quand le héros y
 * repasse, sans rien garder en mémoire.
 */
export function decorsIn(area: Area, kinds: number): PlacedDecor[] {
  if (kinds <= 0) {
    return [];
  }
  const placed: PlacedDecor[] = [];
  for (let column = Math.floor(area.left / DECOR_CELL_PX); column <= Math.floor(area.right / DECOR_CELL_PX); column++) {
    for (let row = Math.floor(area.top / DECOR_CELL_PX); row <= Math.floor(area.bottom / DECOR_CELL_PX); row++) {
      if (cellNoise(column, row, 0) >= DECOR_DENSITY) {
        continue;
      }
      const inside = 1 - 2 * CELL_INSET;
      placed.push({
        key: `${column}:${row}`,
        kind: Math.floor(cellNoise(column, row, 1) * kinds),
        at: {
          x: (column + CELL_INSET + cellNoise(column, row, 2) * inside) * DECOR_CELL_PX,
          y: (row + CELL_INSET + cellNoise(column, row, 3) * inside) * DECOR_CELL_PX,
        },
        flip: cellNoise(column, row, 4) < 0.5 ? 1 : -1,
      });
    }
  }
  return placed;
}

/** Hasard reproductible dans [0, 1) pour une case et un tirage. */
function cellNoise(column: number, row: number, draw: number): number {
  let hash = Math.imul(column, 0x27d4eb2d) ^ Math.imul(row, 0x165667b1) ^ Math.imul(draw + 1, 0x9e3779b9);
  hash = Math.imul(hash ^ (hash >>> 15), 0x85ebca6b);
  hash = Math.imul(hash ^ (hash >>> 13), 0xc2b2ae35);
  return ((hash ^ (hash >>> 16)) >>> 0) / 2 ** 32;
}
