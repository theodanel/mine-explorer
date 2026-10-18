// Moteur pur de l'Expédition aux flambeaux : la grotte, la torche qui éclaire autour du mineur, et ses pas.
import {
  CAVE_COLUMNS,
  CAVE_CONTENT,
  CAVE_ROWS,
  CHEST_LOOT,
  MONSTER_STONES,
  OIL_STEPS,
  STONES_PER_PILE,
  TREASURE_ROWS,
} from '../balance/torchlight';
import type { Random } from '../shared/random';

export type CellContent = 'floor' | 'wall' | 'monster' | 'stones' | 'chest' | 'oil' | 'treasure';
export type ExpeditionStatus = 'exploring' | 'treasure' | 'exhausted' | 'left';

/** Ce que vient de faire le dernier pas, pour l'animer. */
export type StepEvent =
  | { readonly kind: 'walk' }
  | { readonly kind: 'monster'; readonly steps: number }
  | { readonly kind: 'stones' }
  | { readonly kind: 'chest' }
  | { readonly kind: 'oil' }
  | { readonly kind: 'treasure' };

export interface Expedition {
  readonly cells: readonly CellContent[];
  /** Cases déjà éclairées une fois : la carte s'en souvient, sans en montrer les monstres. */
  readonly seen: readonly boolean[];
  readonly position: number;
  readonly stepsLeft: number;
  readonly radius: number;
  /** Pas qu'arrache un monstre, selon la Puissance. */
  readonly monsterCost: number;
  readonly stones: number;
  readonly goldStages: number;
  readonly status: ExpeditionStatus;
  readonly lastEvent: StepEvent | null;
}

export const START_INDEX = (CAVE_ROWS - 1) * CAVE_COLUMNS + Math.floor(CAVE_COLUMNS / 2);
/** Au-delà, la grotte est tirée sans rochers : le trésor doit toujours être atteignable. */
const MAX_LAYOUT_TRIES = 50;

export function rowOf(index: number): number {
  return Math.floor(index / CAVE_COLUMNS);
}

export function columnOf(index: number): number {
  return index % CAVE_COLUMNS;
}

/** Distance « du roi » aux échecs : la lumière de la torche forme un carré autour du mineur. */
export function distance(from: number, to: number): number {
  return Math.max(Math.abs(rowOf(from) - rowOf(to)), Math.abs(columnOf(from) - columnOf(to)));
}

/** Cases où l'on peut faire un pas : haut, bas, gauche, droite. */
export function orthogonalNeighbours(index: number): number[] {
  const row = rowOf(index);
  const column = columnOf(index);
  const around: number[] = [];
  if (row > 0) around.push(index - CAVE_COLUMNS);
  if (row < CAVE_ROWS - 1) around.push(index + CAVE_COLUMNS);
  if (column > 0) around.push(index - 1);
  if (column < CAVE_COLUMNS - 1) around.push(index + 1);
  return around;
}

/** Tire la grotte : le trésor en haut, puis rochers, monstres et trouvailles, avec toujours un chemin jusqu'au trésor. */
export function generateCave(random: Random): CellContent[] {
  for (let attempt = 0; attempt < MAX_LAYOUT_TRIES; attempt++) {
    const cells = layout(random, true);
    if (reachable(cells, START_INDEX, cells.indexOf('treasure'))) {
      return cells;
    }
  }
  return layout(random, false);
}

function layout(random: Random, withWalls: boolean): CellContent[] {
  const cells: CellContent[] = Array.from({ length: CAVE_COLUMNS * CAVE_ROWS }, () => 'floor');
  cells[Math.floor(random() * TREASURE_ROWS * CAVE_COLUMNS)] = 'treasure';
  // Rien ne bloque ni n'attaque à côté du départ : le premier pas est toujours libre
  const free = cells
    .map((_, index) => index)
    .filter((index) => cells[index] === 'floor' && distance(index, START_INDEX) > 1);
  shuffle(free, random);
  const contents: CellContent[] = [
    ...repeat('wall', withWalls ? CAVE_CONTENT.walls : 0),
    ...repeat('monster', CAVE_CONTENT.monsters),
    ...repeat('stones', CAVE_CONTENT.stones),
    ...repeat('chest', CAVE_CONTENT.chests),
    ...repeat('oil', CAVE_CONTENT.oil),
  ];
  contents.forEach((content, index) => (cells[free[index]] = content));
  return cells;
}

function repeat(content: CellContent, count: number): CellContent[] {
  return Array.from({ length: count }, () => content);
}

function shuffle(values: number[], random: Random): void {
  for (let index = values.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [values[index], values[other]] = [values[other], values[index]];
  }
}

function reachable(cells: readonly CellContent[], from: number, to: number): boolean {
  const visited = new Set([from]);
  const queue = [from];
  while (queue.length > 0) {
    const current = queue.shift() as number;
    if (current === to) {
      return true;
    }
    for (const next of orthogonalNeighbours(current)) {
      if (!visited.has(next) && cells[next] !== 'wall') {
        visited.add(next);
        queue.push(next);
      }
    }
  }
  return false;
}

export function startExpedition(cells: readonly CellContent[], steps: number, radius: number, monsterCost: number): Expedition {
  return light({
    cells,
    seen: cells.map(() => false),
    position: START_INDEX,
    stepsLeft: steps,
    radius,
    monsterCost,
    stones: 0,
    goldStages: 0,
    status: 'exploring',
    lastEvent: null,
  });
}

/** La case est-elle dans la lumière de la torche ? */
export function isLit(expedition: Expedition, index: number): boolean {
  return distance(expedition.position, index) <= expedition.radius;
}

/** Les yeux d'un monstre et la lueur du trésor percent le noir une case plus loin que la torche. */
export function isGlimpsed(expedition: Expedition, index: number): boolean {
  const content = expedition.cells[index];
  return (content === 'monster' || content === 'treasure') && distance(expedition.position, index) === expedition.radius + 1;
}

export function canStep(expedition: Expedition, index: number): boolean {
  return (
    expedition.status === 'exploring' &&
    orthogonalNeighbours(expedition.position).includes(index) &&
    expedition.cells[index] !== 'wall'
  );
}

/** Un pas vers une case voisine : on ramasse ce qu'elle cache, la torche éclaire autour. */
export function step(expedition: Expedition, index: number): Expedition {
  if (!canStep(expedition, index)) {
    return expedition;
  }
  const content = expedition.cells[index];
  const cells = content === 'treasure' ? expedition.cells : expedition.cells.map((cell, at) => (at === index ? 'floor' : cell));
  const moved = { ...expedition, cells, position: index, stepsLeft: expedition.stepsLeft - 1 };
  return finish(light(collect(moved, content)));
}

function collect(expedition: Expedition, content: CellContent): Expedition {
  switch (content) {
    case 'monster': {
      // Le pas compte déjà pour un : le monstre prend le reste de son prix
      const steps = expedition.monsterCost;
      return {
        ...expedition,
        stepsLeft: Math.max(expedition.stepsLeft - (steps - 1), 0),
        stones: expedition.stones + MONSTER_STONES,
        lastEvent: { kind: 'monster', steps },
      };
    }
    case 'stones':
      return { ...expedition, stones: expedition.stones + STONES_PER_PILE, lastEvent: { kind: 'stones' } };
    case 'chest':
      return {
        ...expedition,
        stones: expedition.stones + CHEST_LOOT.stones,
        goldStages: expedition.goldStages + CHEST_LOOT.goldStages,
        lastEvent: { kind: 'chest' },
      };
    case 'oil':
      return { ...expedition, stepsLeft: expedition.stepsLeft + OIL_STEPS, lastEvent: { kind: 'oil' } };
    case 'treasure':
      return { ...expedition, status: 'treasure', lastEvent: { kind: 'treasure' } };
    default:
      return { ...expedition, lastEvent: { kind: 'walk' } };
  }
}

function light(expedition: Expedition): Expedition {
  return { ...expedition, seen: expedition.seen.map((seen, index) => seen || isLit(expedition, index)) };
}

/** Plus de pas : la torche s'éteint et le mineur remonte avec ce qu'il a ramassé. */
function finish(expedition: Expedition): Expedition {
  return expedition.status === 'exploring' && expedition.stepsLeft <= 0 ? { ...expedition, status: 'exhausted' } : expedition;
}

/** Rentrer avant la fin, avec ce qu'on a ramassé. */
export function leaveCave(expedition: Expedition): Expedition {
  return expedition.status === 'exploring' ? { ...expedition, status: 'left' } : expedition;
}

export function isOver(expedition: Expedition): boolean {
  return expedition.status !== 'exploring';
}
