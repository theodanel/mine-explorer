import { DUNGEON_MAX_KEYS, DUNGEON_STRIKES, dungeonHp, dungeonReward } from '../balance/dungeons';
import {
  EMPTY_DUNGEONS,
  isRunOver,
  isRunWon,
  isValidDungeonState,
  recordVictory,
  refillKeys,
  startRun,
  strikeRun,
} from './dungeon-rules';

describe('donjons', () => {
  it('donne 2 clés par jour et par donjon, jusqu’à 4', () => {
    const first = refillKeys(EMPTY_DUNGEONS, '2026-10-20');
    expect(first.keys).toEqual({ crystal: 2, forge: 2 });
    expect(refillKeys(first, '2026-10-20')).toBe(first);
    expect(refillKeys(first, '2026-10-21').keys.crystal).toBe(4);
    expect(refillKeys(first, '2026-10-25').keys.crystal).toBe(DUNGEON_MAX_KEYS);
  });

  it('se joue en un nombre de coups fixe, sans chrono', () => {
    let run = startRun('crystal', 3);
    expect(run).toMatchObject({ hp: dungeonHp(3), strikesLeft: DUNGEON_STRIKES });
    run = strikeRun(run, 1);
    expect(run.strikesLeft).toBe(DUNGEON_STRIKES - 1);
    expect(isRunOver(run)).toBe(false);
    run = strikeRun(run, Number.MAX_SAFE_INTEGER);
    expect(isRunWon(run)).toBe(true);
    // Une partie finie ne bouge plus
    expect(strikeRun(run, 1)).toBe(run);
  });

  it('perd la partie quand les coups sont épuisés', () => {
    let run = startRun('forge', 1);
    for (let strike = 0; strike < DUNGEON_STRIKES; strike++) {
      run = strikeRun(run, 0);
    }
    expect(isRunOver(run)).toBe(true);
    expect(isRunWon(run)).toBe(false);
  });

  it('dépense une clé à la victoire et garde le meilleur niveau', () => {
    const state = recordVictory({ ...EMPTY_DUNGEONS, keys: { crystal: 2, forge: 2 } }, 'crystal', 5);
    expect(state.keys.crystal).toBe(1);
    expect(state.best.crystal).toBe(5);
    expect(recordVictory(state, 'crystal', 3).best.crystal).toBe(5);
  });

  it('fait grandir rocher et récompense à chaque niveau, la récompense en ligne droite', () => {
    expect(dungeonHp(10)).toBeGreaterThan(dungeonHp(9));
    const step = dungeonReward('crystal', 11) - dungeonReward('crystal', 10);
    expect(dungeonReward('crystal', 21) - dungeonReward('crystal', 20)).toBe(step);
  });

  it('refuse une sauvegarde invalide', () => {
    expect(isValidDungeonState(EMPTY_DUNGEONS)).toBe(true);
    expect(isValidDungeonState({ ...EMPTY_DUNGEONS, keys: { crystal: 9, forge: 0 } })).toBe(false);
    expect(isValidDungeonState({ ...EMPTY_DUNGEONS, keysDay: 'demain' })).toBe(false);
  });
});
