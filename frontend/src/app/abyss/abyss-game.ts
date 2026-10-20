// Moteur du mini-jeu du Puits sans fond : une descente de 30 s, étage par étage, pilotée par les touchers.
// Fichier pur (aucune dépendance Angular ni au temps réel) : la page appelle tick, tap et cast, les tests aussi.
import {
  ABYSS_RUN_MS,
  COMBO_MAX,
  COMBO_STEP,
  COMBO_WINDOW_MS,
  CRYSTAL_BONUS_MS,
  CRYSTAL_LIFETIME_MS,
  CRYSTAL_SPAWN_MAX_MS,
  CRYSTAL_SPAWN_MIN_MS,
  floorHp,
  FloorKind,
  floorKind,
  TRAP_FUSE_MS,
  TRAP_PENALTY_MS,
  WEAK_POINT_MOVE_MS,
  WEAK_POINT_MULTIPLIER,
  FLOOR_SHARDS,
} from '../balance/abyss';
import type { SpellDef } from '../balance/skill-tree';
import type { Random } from '../shared/random';

/** Ce que le build du joueur apporte à la descente. */
export interface Fighter {
  /** Dégâts d'un coup, sans critique. */
  readonly strike: number;
  readonly critChance: number;
  /** Bonus d'un critique : 0,5 → coup ×1,5. */
  readonly critDamage: number;
  /** Coups automatiques du mineur par seconde, en plus des touchers. */
  readonly hitsPerSecond: number;
}

export interface Point {
  /** Position de 0 à 1 dans la zone du rocher (point faible) ou de l'écran (cristal de temps). */
  readonly x: number;
  readonly y: number;
}

export interface Floor {
  readonly number: number;
  readonly kind: FloorKind;
  readonly hp: number;
  readonly maxHp: number;
  /** Rocher à cristal : son point faible, qui se déplace. */
  readonly weakPoint: Point | null;
  /** Rocher piégé : temps avant l'explosion. */
  readonly fuseMs: number | null;
}

/** Ce qui vient de se passer, pour les effets à l'écran (chiffres de dégâts, éclats, explosion). */
export type GameEvent =
  | { readonly kind: 'hit'; readonly damage: number; readonly critical: boolean; readonly weak: boolean }
  | { readonly kind: 'floorCleared'; readonly floor: number; readonly shards: number }
  | { readonly kind: 'trapExploded' }
  | { readonly kind: 'timeBonus'; readonly ms: number }
  | { readonly kind: 'spell'; readonly spell: string };

export interface Buffs {
  /** Dégâts doublés jusqu'à ce moment (Frénésie). */
  readonly doubleUntilMs: number;
  /** Tous les coups critiques (Œil du géologue). */
  readonly critUntilMs: number;
  /** Un éclat de plus par étage (Filon doré, Écho de géode). */
  readonly bonusShardUntilMs: number;
}

export interface Game {
  /** Temps écoulé depuis le départ. */
  readonly elapsedMs: number;
  readonly timeLeftMs: number;
  readonly floor: Floor;
  readonly floorsCleared: number;
  readonly shards: number;
  readonly combo: number;
  readonly lastTapMs: number;
  /** Fraction de coup automatique en attente. */
  readonly autoProgress: number;
  readonly crystal: (Point & { readonly ageMs: number }) | null;
  readonly nextCrystalMs: number;
  readonly sinceWeakMoveMs: number;
  readonly buffs: Buffs;
  readonly spellsUsed: readonly string[];
  readonly events: readonly GameEvent[];
}

const NO_BUFFS: Buffs = { doubleUntilMs: 0, critUntilMs: 0, bonusShardUntilMs: 0 };

export function startGame(random: Random): Game {
  return {
    elapsedMs: 0,
    timeLeftMs: ABYSS_RUN_MS,
    floor: makeFloor(1, random),
    floorsCleared: 0,
    shards: 0,
    combo: 0,
    lastTapMs: -Infinity,
    autoProgress: 0,
    crystal: null,
    nextCrystalMs: between(CRYSTAL_SPAWN_MIN_MS, CRYSTAL_SPAWN_MAX_MS, random),
    sinceWeakMoveMs: 0,
    buffs: NO_BUFFS,
    spellsUsed: [],
    events: [],
  };
}

export function isOver(game: Game): boolean {
  return game.timeLeftMs <= 0;
}

/** Combo actuel en multiplicateur : ×1 au premier toucher, jusqu'à ×1,9 en enchaînant vite. */
export function comboMultiplier(combo: number): number {
  return 1 + COMBO_STEP * Math.max(Math.min(combo, COMBO_MAX) - 1, 0);
}

/** Le temps passe : coups automatiques, mèche, cristal de temps et point faible. Les événements repartent de zéro. */
export function tick(game: Game, dtMs: number, fighter: Fighter, random: Random): Game {
  if (isOver(game)) {
    return { ...game, events: [] };
  }
  const dt = Math.min(dtMs, game.timeLeftMs);
  let next: Game = { ...game, elapsedMs: game.elapsedMs + dt, timeLeftMs: game.timeLeftMs - dt, events: [] };

  // Le mineur frappe tout seul, à sa vitesse
  let auto = next.autoProgress + (fighter.hitsPerSecond * dt) / 1000;
  while (auto >= 1) {
    auto -= 1;
    next = hit(next, fighter, random, 1, false);
  }
  next = { ...next, autoProgress: auto };

  next = burnFuse(next, dt, fighter, random);
  next = moveWeakPoint(next, dt, random);
  return driftCrystal(next, dt, random);
}

/** Toucher : sur le rocher (avec combo), sur son point faible (×3) ou sur le cristal de temps (+2 s). */
export function tap(game: Game, target: 'rock' | 'weak' | 'crystal', fighter: Fighter, random: Random): Game {
  if (isOver(game)) {
    return game;
  }
  if (target === 'crystal') {
    if (game.crystal === null) {
      return game;
    }
    return {
      ...game,
      timeLeftMs: game.timeLeftMs + CRYSTAL_BONUS_MS,
      crystal: null,
      events: [...game.events, { kind: 'timeBonus', ms: CRYSTAL_BONUS_MS }],
    };
  }
  const chained = game.elapsedMs - game.lastTapMs <= COMBO_WINDOW_MS;
  const combo = chained ? Math.min(game.combo + 1, COMBO_MAX) : 1;
  const weak = target === 'weak' && game.floor.weakPoint !== null;
  const tapped: Game = { ...game, combo, lastTapMs: game.elapsedMs };
  return hit(tapped, fighter, random, comboMultiplier(combo) * (weak ? WEAK_POINT_MULTIPLIER : 1), weak);
}

/**
 * Sort lancé une fois par descente. Explosions : un coup de N Frappes. Frénésie : dégâts doublés.
 * Œil du géologue : tous les coups critiques. Filon doré et Écho de géode : un éclat de plus par étage.
 */
export function cast(game: Game, spell: SpellDef, rank: number, fighter: Fighter, random: Random): Game {
  if (isOver(game) || game.spellsUsed.includes(spell.id)) {
    return game;
  }
  const used: Game = {
    ...game,
    spellsUsed: [...game.spellsUsed, spell.id],
    events: [...game.events, { kind: 'spell', spell: spell.id }],
  };
  const until = game.elapsedMs + spell.durationMs + spell.durationPerRankMs * Math.max(rank - 1, 0);
  const effect = spell.effect;
  switch (effect.kind) {
    case 'blast':
      return damage(used, fighter.strike * (effect.strike + effect.strikePerRank * Math.max(rank - 1, 0)), false, false, fighter, random);
    case 'speed':
      return { ...used, buffs: { ...used.buffs, doubleUntilMs: until } };
    case 'crit':
      return { ...used, buffs: { ...used.buffs, critUntilMs: until } };
    case 'gold':
    case 'shard':
      return { ...used, buffs: { ...used.buffs, bonusShardUntilMs: until } };
  }
}

function hit(game: Game, fighter: Fighter, random: Random, multiplier: number, weak: boolean): Game {
  const critical = game.elapsedMs < game.buffs.critUntilMs || random() < fighter.critChance;
  const doubled = game.elapsedMs < game.buffs.doubleUntilMs ? 2 : 1;
  const amount = fighter.strike * (critical ? 1 + fighter.critDamage : 1) * multiplier * doubled;
  return damage(game, amount, critical, weak, fighter, random);
}

function damage(game: Game, amount: number, critical: boolean, weak: boolean, fighter: Fighter, random: Random): Game {
  const hp = game.floor.hp - amount;
  const hitEvent: GameEvent = { kind: 'hit', damage: Math.round(amount), critical, weak };
  const hurt: Game = { ...game, floor: { ...game.floor, hp: Math.max(hp, 0) }, events: [...game.events, hitEvent] };
  return hp <= 0 ? clearFloor(hurt, fighter, random) : hurt;
}

function clearFloor(game: Game, fighter: Fighter, random: Random): Game {
  const shards = game.elapsedMs < game.buffs.bonusShardUntilMs ? FLOOR_SHARDS * 2 : FLOOR_SHARDS;
  return {
    ...game,
    floorsCleared: game.floorsCleared + 1,
    shards: game.shards + shards,
    floor: makeFloor(game.floor.number + 1, random),
    sinceWeakMoveMs: 0,
    events: [...game.events, { kind: 'floorCleared', floor: game.floor.number, shards }],
  };
}

/** Rocher piégé : la mèche brûle ; s'il tient encore, il explose. L'étage est passé, mais sans éclat, et coûte 3 s. */
function burnFuse(game: Game, dt: number, fighter: Fighter, random: Random): Game {
  const fuse = game.floor.fuseMs;
  if (fuse === null) {
    return game;
  }
  if (fuse - dt > 0) {
    return { ...game, floor: { ...game.floor, fuseMs: fuse - dt } };
  }
  return {
    ...game,
    timeLeftMs: Math.max(game.timeLeftMs - TRAP_PENALTY_MS, 0),
    floorsCleared: game.floorsCleared + 1,
    sinceWeakMoveMs: 0,
    floor: makeFloor(game.floor.number + 1, random),
    events: [...game.events, { kind: 'trapExploded' }],
  };
}

function moveWeakPoint(game: Game, dt: number, random: Random): Game {
  if (game.floor.weakPoint === null) {
    return game;
  }
  const since = game.sinceWeakMoveMs + dt;
  if (since < WEAK_POINT_MOVE_MS) {
    return { ...game, sinceWeakMoveMs: since };
  }
  return { ...game, sinceWeakMoveMs: 0, floor: { ...game.floor, weakPoint: weakPointAt(random) } };
}

function driftCrystal(game: Game, dt: number, random: Random): Game {
  if (game.crystal !== null) {
    const ageMs = game.crystal.ageMs + dt;
    return { ...game, crystal: ageMs >= CRYSTAL_LIFETIME_MS ? null : { ...game.crystal, ageMs } };
  }
  const nextCrystalMs = game.nextCrystalMs - dt;
  if (nextCrystalMs > 0) {
    return { ...game, nextCrystalMs };
  }
  return {
    ...game,
    crystal: { x: between(0.15, 0.85, random), y: 0, ageMs: 0 },
    nextCrystalMs: between(CRYSTAL_SPAWN_MIN_MS, CRYSTAL_SPAWN_MAX_MS, random),
  };
}

function makeFloor(number: number, random: Random): Floor {
  const kind = floorKind(number, random());
  const hp = floorHp(number, kind);
  return {
    number,
    kind,
    hp,
    maxHp: hp,
    weakPoint: kind === 'crystal' ? weakPointAt(random) : null,
    fuseMs: kind === 'trap' ? TRAP_FUSE_MS : null,
  };
}

function weakPointAt(random: Random): Point {
  return { x: between(0.25, 0.75, random), y: between(0.3, 0.7, random) };
}

function between(min: number, max: number, random: Random): number {
  return min + (max - min) * random();
}
