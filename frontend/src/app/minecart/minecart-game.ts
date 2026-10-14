// Moteur pur du Wagonnet fou : le wagonnet avance tout seul, le joueur change de voie et choisit aux aiguillages.
// Aucune dépendance Angular : testé seul, piloté par minecart.ts.
import {
  BAT_FROM_METERS,
  BAT_SWITCH_METERS,
  DOUBLE_BLOCK_CHANCE,
  FIRST_FORK_METERS,
  FORK_CLEAR_METERS,
  FORK_EVERY_METERS,
  INVULNERABLE_MS,
  MAX_SPEED,
  NUGGET_SHARE,
  PICKUP_CHANCE,
  RISKY_DOUBLE_BLOCK_CHANCE,
  RISKY_PICKUP_CHANCE,
  RISKY_ROW_GAP_METERS,
  RISKY_SPEED_FACTOR,
  ROW_GAP_METERS,
  SPEED_GAIN_PER_SECOND,
  START_SPEED,
  VIEW_METERS,
} from '../balance/minecart';
import type { Random } from '../shared/random';

export const LANES = [0, 1, 2] as const;
export type Lane = (typeof LANES)[number];

export type ObstacleKind = 'rockfall' | 'brokenRail' | 'bat';
export type PickupKind = 'ore' | 'nugget';
export type ThingKind = ObstacleKind | PickupKind;

export interface Thing {
  readonly id: number;
  readonly kind: ThingKind;
  readonly lane: Lane;
  /** Position sur la voie, en mètres depuis le départ. */
  readonly at: number;
  /** Chauve-souris : la voie où elle se jette quand le wagonnet approche. */
  readonly swoopTo?: Lane;
}

export type ForkChoice = 'safe' | 'risky';

export interface Fork {
  readonly at: number;
  readonly choice: ForkChoice | null;
}

export type RideEvent =
  | { readonly kind: 'hit'; readonly obstacle: ObstacleKind }
  | { readonly kind: 'pickup'; readonly pickup: PickupKind }
  | { readonly kind: 'fork'; readonly choice: ForkChoice }
  | { readonly kind: 'crash' };

export interface Ride {
  readonly elapsedMs: number;
  readonly distance: number;
  readonly lane: Lane;
  readonly hearts: number;
  readonly maxHearts: number;
  readonly invulnerableUntilMs: number;
  readonly things: readonly Thing[];
  readonly nextRowAt: number;
  readonly nextId: number;
  /** Vrai sur la voie risquée, jusqu'au prochain aiguillage. */
  readonly risky: boolean;
  readonly fork: Fork;
  readonly ores: number;
  readonly nuggets: number;
  /** Ce qui vient d'arriver pendant le dernier pas : sons et effets à l'écran. */
  readonly events: readonly RideEvent[];
}

export function startRide(hearts: number): Ride {
  return {
    elapsedMs: 0,
    distance: 0,
    lane: 1,
    hearts,
    maxHearts: hearts,
    invulnerableUntilMs: 0,
    things: [],
    nextRowAt: VIEW_METERS / 2,
    nextId: 1,
    risky: false,
    fork: { at: FIRST_FORK_METERS, choice: null },
    ores: 0,
    nuggets: 0,
    events: [],
  };
}

export function isOver(ride: Ride): boolean {
  return ride.hearts <= 0;
}

/** Vitesse du moment, en mètres par seconde. */
export function speedOf(ride: Ride): number {
  const base = Math.min(START_SPEED + SPEED_GAIN_PER_SECOND * (ride.elapsedMs / 1000), MAX_SPEED);
  return ride.risky ? base * RISKY_SPEED_FACTOR : base;
}

/** Glisse d'une voie à gauche (-1) ou à droite (+1), sans sortir des rails. */
export function steer(ride: Ride, direction: -1 | 1): Ride {
  const lane = Math.min(Math.max(ride.lane + direction, 0), 2) as Lane;
  return lane === ride.lane || isOver(ride) ? ride : { ...ride, lane };
}

/** Choix à l'aiguillage qui arrive ; il peut changer d'avis jusqu'à le franchir. */
export function chooseFork(ride: Ride, choice: ForkChoice): Ride {
  return isOver(ride) ? ride : { ...ride, fork: { ...ride.fork, choice } };
}

/** Avance la course de `dtMs` : déplacement, chocs, trouvailles, aiguillage franchi, nouvelles rangées. */
export function tick(ride: Ride, dtMs: number, random: Random): Ride {
  if (isOver(ride)) {
    return { ...ride, events: [] };
  }
  const elapsedMs = ride.elapsedMs + dtMs;
  const distance = ride.distance + (speedOf(ride) * dtMs) / 1000;
  const events: RideEvent[] = [];
  let next: Ride = { ...ride, elapsedMs, distance, events };

  next = { ...next, things: next.things.map((thing) => swoop(thing, distance)) };
  next = resolvePassed(next, ride.distance, events);
  next = crossFork(next, events);
  next = spawnRows(next, random);
  return { ...next, things: next.things.filter((thing) => thing.at >= distance - 2) };
}

/** Une chauve-souris assez proche se jette sur sa voie de destination. */
function swoop(thing: Thing, distance: number): Thing {
  if (thing.kind !== 'bat' || thing.swoopTo === undefined || thing.at - distance > BAT_SWITCH_METERS) {
    return thing;
  }
  return { ...thing, lane: thing.swoopTo, swoopTo: undefined };
}

function isObstacle(kind: ThingKind): kind is ObstacleKind {
  return kind === 'rockfall' || kind === 'brokenRail' || kind === 'bat';
}

/** Ce que le wagonnet vient de dépasser sur sa voie : un choc ou une trouvaille. */
function resolvePassed(ride: Ride, previousDistance: number, events: RideEvent[]): Ride {
  let next = ride;
  const remaining: Thing[] = [];
  for (const thing of ride.things) {
    const passed = thing.at > previousDistance && thing.at <= ride.distance && thing.lane === ride.lane;
    if (!passed) {
      remaining.push(thing);
      continue;
    }
    if (isObstacle(thing.kind)) {
      if (next.elapsedMs >= next.invulnerableUntilMs) {
        const hearts = next.hearts - 1;
        next = { ...next, hearts, invulnerableUntilMs: next.elapsedMs + INVULNERABLE_MS };
        events.push({ kind: 'hit', obstacle: thing.kind });
        if (hearts <= 0) {
          events.push({ kind: 'crash' });
        }
      }
    } else {
      next = thing.kind === 'ore' ? { ...next, ores: next.ores + 1 } : { ...next, nuggets: next.nuggets + 1 };
      events.push({ kind: 'pickup', pickup: thing.kind });
    }
  }
  return { ...next, things: remaining };
}

/** Aiguillage franchi : la voie choisie (sûre par défaut) vaut jusqu'au prochain. */
function crossFork(ride: Ride, events: RideEvent[]): Ride {
  if (ride.distance < ride.fork.at) {
    return ride;
  }
  const choice = ride.fork.choice ?? 'safe';
  events.push({ kind: 'fork', choice });
  return { ...ride, risky: choice === 'risky', fork: { at: ride.fork.at + FORK_EVERY_METERS, choice: null } };
}

/** Remplit la voie devant le wagonnet, rangée par rangée, en laissant toujours au moins une voie libre. */
function spawnRows(ride: Ride, random: Random): Ride {
  let { nextRowAt, nextId } = ride;
  const things = [...ride.things];
  while (nextRowAt <= ride.distance + VIEW_METERS) {
    if (Math.abs(nextRowAt - ride.fork.at) > FORK_CLEAR_METERS) {
      for (const thing of rowAt(nextRowAt, ride.risky, random)) {
        things.push({ ...thing, id: nextId++ });
      }
    }
    nextRowAt += ride.risky ? RISKY_ROW_GAP_METERS : ROW_GAP_METERS;
  }
  return { ...ride, things, nextRowAt, nextId };
}

function rowAt(at: number, risky: boolean, random: Random): Omit<Thing, 'id'>[] {
  const lanes = shuffle([...LANES], random);
  const blocked = random() < (risky ? RISKY_DOUBLE_BLOCK_CHANCE : DOUBLE_BLOCK_CHANCE) ? 2 : 1;
  const row: Omit<Thing, 'id'>[] = [];
  for (const lane of lanes.slice(0, blocked)) {
    row.push(obstacleAt(at, lane, lanes, random));
  }
  for (const lane of lanes.slice(blocked)) {
    if (random() < (risky ? RISKY_PICKUP_CHANCE : PICKUP_CHANCE)) {
      row.push({ kind: random() < NUGGET_SHARE ? 'nugget' : 'ore', lane, at });
    }
  }
  return row;
}

function obstacleAt(at: number, lane: Lane, lanes: readonly Lane[], random: Random): Omit<Thing, 'id'> {
  const kinds: ObstacleKind[] = at >= BAT_FROM_METERS ? ['rockfall', 'brokenRail', 'bat'] : ['rockfall', 'brokenRail'];
  const kind = kinds[Math.floor(random() * kinds.length)];
  if (kind !== 'bat') {
    return { kind, lane, at };
  }
  // La chauve-souris part d'une voie voisine et se jette sur celle-ci : elle se voit venir, mais tard
  const neighbours = lanes.filter((other) => Math.abs(other - lane) === 1);
  return { kind, lane: neighbours[Math.floor(random() * neighbours.length)], at, swoopTo: lane };
}

function shuffle<T>(items: T[], random: Random): T[] {
  for (let index = items.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [items[index], items[other]] = [items[other], items[index]];
  }
  return items;
}
