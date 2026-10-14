import {
  ABYSS_RUN_MS,
  FLOOR_SHARDS,
  COMBO_WINDOW_MS,
  CRYSTAL_BONUS_MS,
  firstFloorHp,
  floorHp,
  floorKind,
  GUARDIAN_EVERY,
  TRAP_FUSE_MS,
  TRAP_PENALTY_MS,
  WEAK_POINT_MULTIPLIER,
} from '../balance/abyss';
import { SPELLS } from '../balance/skill-tree';
import { cast, comboMultiplier, Fighter, Game, isOver, startGame, tap, tick } from './abyss-game';

const FIGHTER: Fighter = { strike: 10, critChance: 0, critDamage: 0.5, hitsPerSecond: 0, zone: 6 };
/** Tirages fixes : 0,9 donne un étage normal et jamais de critique. */
const steady = (): number => 0.9;

function withFloor(game: Game, kind: Game['floor']['kind'], hp = 1000): Game {
  return {
    ...game,
    floor: {
      ...game.floor,
      kind,
      hp,
      maxHp: hp,
      weakPoint: kind === 'crystal' ? { x: 0.5, y: 0.5 } : null,
      fuseMs: kind === 'trap' ? TRAP_FUSE_MS : null,
    },
  };
}

describe('abyss-game : étages', () => {
  it('place un gardien tous les 10 étages et les pièges après les premiers', () => {
    expect(floorKind(GUARDIAN_EVERY, 0.9)).toBe('guardian');
    expect(floorKind(1, 0.4)).toBe('normal');
    expect(floorKind(3, 0.4)).toBe('trap');
    expect(floorKind(5, 0.1)).toBe('crystal');
  });

  it('durcit les étages de 15 % à chaque fois, le gardien quatre fois plus', () => {
    expect(floorHp(2, 100, 'normal') / floorHp(1, 100, 'normal')).toBeCloseTo(1.15, 1);
    expect(floorHp(10, 100, 'guardian')).toBeGreaterThan(floorHp(10, 100, 'normal') * 3.9);
  });

  it("laisse descendre un joueur en retard sur sa zone, et plus bas un joueur en avance", () => {
    const behind = firstFloorHp(8, 100);
    const ahead = firstFloorHp(8, 100_000);
    // Le joueur 1 000 fois plus fort ne trouve des étages que 32 fois plus durs
    expect(ahead / behind).toBeCloseTo(Math.sqrt(1000), 0);
  });
});

describe('abyss-game : jouer', () => {
  it('commence avec 30 s et le premier étage', () => {
    const game = startGame(FIGHTER, steady);
    expect(game.timeLeftMs).toBe(ABYSS_RUN_MS);
    expect(game.floor.number).toBe(1);
  });

  it('enchaîne un combo en tapant vite, et le perd en tapant lentement', () => {
    let game = withFloor(startGame(FIGHTER, steady), 'normal');
    game = tap(game, 'rock', FIGHTER, steady);
    game = tick(game, 100, FIGHTER, steady);
    game = tap(game, 'rock', FIGHTER, steady);
    expect(game.combo).toBe(2);
    expect(game.floor.hp).toBeCloseTo(1000 - 10 - 10 * comboMultiplier(2));
    game = tick(game, COMBO_WINDOW_MS + 100, FIGHTER, steady);
    game = tap(game, 'rock', FIGHTER, steady);
    expect(game.combo).toBe(1);
  });

  it('frappe trois fois plus fort sur le point faible', () => {
    const game = tap(withFloor(startGame(FIGHTER, steady), 'crystal'), 'weak', FIGHTER, steady);
    expect(game.floor.hp).toBe(1000 - 10 * WEAK_POINT_MULTIPLIER);
  });

  it('fait exploser un piège pas cassé à temps : 3 s de moins, étage passé sans éclat', () => {
    const start = withFloor(startGame(FIGHTER, steady), 'trap');
    const game = tick(start, TRAP_FUSE_MS, FIGHTER, steady);
    expect(game.timeLeftMs).toBe(ABYSS_RUN_MS - TRAP_FUSE_MS - TRAP_PENALTY_MS);
    expect(game.floorsCleared).toBe(1);
    expect(game.shards).toBe(0);
    expect(game.events).toContainEqual({ kind: 'trapExploded' });
  });

  it('donne un éclat par étage cassé', () => {
    const game = tap(withFloor(startGame(FIGHTER, steady), 'normal', 5), 'rock', FIGHTER, steady);
    expect(game.floorsCleared).toBe(1);
    expect(game.shards).toBe(FLOOR_SHARDS);
    expect(game.floor.number).toBe(2);
  });

  it('ajoute 2 s quand on attrape le cristal de temps', () => {
    const game = { ...startGame(FIGHTER, steady), crystal: { x: 0.5, y: 0, ageMs: 0 } };
    expect(tap(game, 'crystal', FIGHTER, steady).timeLeftMs).toBe(ABYSS_RUN_MS + CRYSTAL_BONUS_MS);
  });

  it('lance chaque sort une seule fois : la dynamite frappe fort', () => {
    let game = withFloor(startGame(FIGHTER, steady), 'normal', 10_000);
    game = cast(game, SPELLS.dynamite, 1, FIGHTER, steady);
    expect(game.floor.hp).toBe(10_000 - 10 * 6);
    const again = cast(game, SPELLS.dynamite, 1, FIGHTER, steady);
    expect(again.floor.hp).toBe(game.floor.hp);
  });

  it("rend tous les coups critiques sous l'Œil du géologue", () => {
    let game = withFloor(startGame(FIGHTER, steady), 'normal');
    game = cast(game, SPELLS.geologistEye, 1, FIGHTER, steady);
    game = tap(game, 'rock', FIGHTER, steady);
    expect(game.floor.hp).toBe(1000 - 15);
  });

  it('se termine quand le temps est écoulé, et le mineur frappe seul pendant ce temps', () => {
    const fighter = { ...FIGHTER, hitsPerSecond: 2 };
    const game = tick(withFloor(startGame(fighter, steady), 'normal', 10_000), ABYSS_RUN_MS, fighter, steady);
    expect(isOver(game)).toBe(true);
    expect(game.floor.hp).toBe(10_000 - 60 * 10);
  });
});
