// Moteur pur de la Chasse au filon : une paroi en cases, du grisou caché, des indices comme au démineur.
import { HUNT_COLUMNS, HUNT_GAS_POCKETS, HUNT_ROWS, NUGGET_CELL_CHANCE, NUGGET_PER_GOLD_BONUS, ORE_CELL_CHANCE } from '../balance/minehunt';
import type { Random } from '../shared/random';

export type CellContent = 'empty' | 'ore' | 'nugget' | 'chest' | 'gas';

export interface Cell {
  readonly content: CellContent;
  readonly dug: boolean;
  /** Poches de grisou parmi les 8 cases voisines : l'indice affiché sur une case vide. */
  readonly around: number;
}

export type HuntStatus = 'digging' | 'stopped' | 'broken' | 'cleared';

export type HuntEvent =
  | { readonly kind: 'dug'; readonly index: number; readonly content: CellContent }
  | { readonly kind: 'gas'; readonly index: number }
  | { readonly kind: 'broken' }
  | { readonly kind: 'cleared' };

export interface Hunt {
  readonly cells: readonly Cell[];
  readonly durability: number;
  readonly maxDurability: number;
  readonly ores: number;
  readonly nuggets: number;
  readonly chest: boolean;
  readonly status: HuntStatus;
  /** Ce que le dernier coup a fait : sons et animations. */
  readonly events: readonly HuntEvent[];
}

export function neighbours(index: number): number[] {
  const column = index % HUNT_COLUMNS;
  const row = Math.floor(index / HUNT_COLUMNS);
  const result: number[] = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const x = column + dx;
      const y = row + dy;
      if ((dx !== 0 || dy !== 0) && x >= 0 && x < HUNT_COLUMNS && y >= 0 && y < HUNT_ROWS) {
        result.push(y * HUNT_COLUMNS + x);
      }
    }
  }
  return result;
}

/** Tire la paroi : le grisou, un coffre, du minerai et des pépites ; puis calcule les indices. */
export function generateWall(random: Random, goldBonus: number): Cell[] {
  const count = HUNT_COLUMNS * HUNT_ROWS;
  const order = shuffle(Array.from({ length: count }, (_, index) => index), random);
  const gas = new Set(order.slice(0, HUNT_GAS_POCKETS));
  const chest = order[HUNT_GAS_POCKETS];
  const nuggetChance = NUGGET_CELL_CHANCE + NUGGET_PER_GOLD_BONUS * Math.max(goldBonus, 0);
  const contents: CellContent[] = Array.from({ length: count }, (_, index) => {
    if (gas.has(index)) {
      return 'gas';
    }
    if (index === chest) {
      return 'chest';
    }
    const roll = random();
    return roll < ORE_CELL_CHANCE ? 'ore' : roll < ORE_CELL_CHANCE + nuggetChance ? 'nugget' : 'empty';
  });
  return withHints(contents.map((content) => ({ content, dug: false, around: 0 })));
}

function withHints(cells: readonly Cell[]): Cell[] {
  return cells.map((cell, index) => ({ ...cell, around: neighbours(index).filter((other) => cells[other].content === 'gas').length }));
}

/**
 * Nouvelle partie. Quelques cases sans grisou autour sont creusées d'office (la Chance en ajoute) : le joueur a
 * de quoi commencer à déduire au lieu de taper au hasard.
 */
export function startHunt(durability: number, reveals: number, goldBonus: number, random: Random): Hunt {
  let hunt: Hunt = {
    cells: generateWall(random, goldBonus),
    durability,
    maxDurability: durability,
    ores: 0,
    nuggets: 0,
    chest: false,
    status: 'digging',
    events: [],
  };
  const calm = shuffle(
    hunt.cells.map((cell, index) => ({ cell, index })).filter(({ cell }) => cell.content !== 'gas' && cell.around === 0),
    random,
  );
  for (const { index } of calm.slice(0, reveals)) {
    hunt = dig(hunt, index);
  }
  return { ...hunt, events: [] };
}

/** Creuse une case. Une case vide sans grisou autour ouvre aussi ses voisines, comme au démineur. */
export function dig(hunt: Hunt, index: number): Hunt {
  const target = hunt.cells[index];
  if (hunt.status !== 'digging' || target === undefined || target.dug) {
    return { ...hunt, events: [] };
  }
  if (target.content === 'gas') {
    const durability = hunt.durability - 1;
    const cells = hunt.cells.map((cell, other) => (other === index ? { ...cell, dug: true } : cell));
    const events: HuntEvent[] = [{ kind: 'gas', index }];
    if (durability <= 0) {
      events.push({ kind: 'broken' });
    }
    return { ...hunt, cells, durability, status: durability <= 0 ? 'broken' : 'digging', events };
  }
  const cells = [...hunt.cells];
  const events: HuntEvent[] = [];
  let { ores, nuggets, chest } = hunt;
  const queue = [index];
  while (queue.length > 0) {
    const current = queue.shift() as number;
    const cell = cells[current];
    if (cell.dug || cell.content === 'gas') {
      continue;
    }
    cells[current] = { ...cell, dug: true };
    events.push({ kind: 'dug', index: current, content: cell.content });
    ores += cell.content === 'ore' ? 1 : 0;
    nuggets += cell.content === 'nugget' ? 1 : 0;
    chest = chest || cell.content === 'chest';
    if (cell.around === 0) {
      queue.push(...neighbours(current));
    }
  }
  const cleared = cells.every((cell) => cell.dug || cell.content === 'gas');
  if (cleared) {
    events.push({ kind: 'cleared' });
  }
  return { ...hunt, cells, ores, nuggets, chest, status: cleared ? 'cleared' : 'digging', events };
}

/** Remonte avec tout le butin. */
export function stop(hunt: Hunt): Hunt {
  return hunt.status === 'digging' ? { ...hunt, status: 'stopped', events: [] } : hunt;
}

export function isOver(hunt: Hunt): boolean {
  return hunt.status !== 'digging';
}

function shuffle<T>(items: T[], random: Random): T[] {
  for (let index = items.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [items[index], items[other]] = [items[other], items[index]];
  }
  return items;
}
