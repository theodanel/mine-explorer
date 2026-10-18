import { RING_SOCKETS, RUNE_FORGE_SHARDS, STAR_RUNES } from '../balance/heart-forge';
import {
  addHeartShards,
  HeartForgeState,
  baseRunesFor,
  canForgeRune,
  canFuse,
  canSocket,
  EMPTY_HEART_FORGE,
  forgeRune,
  fuseRunes,
  fusionFailChance,
  parseHeartForgeState,
  runeCount,
  socketRune,
  socketRuneIn,
  starRunesSet,
} from './heart-forge-rules';

const always = (value: number) => () => value;

describe('Forge du Cœur', () => {
  it("forge une rune de rang 1 contre 3 éclats de cœur, pas moins", () => {
    expect(canForgeRune(addHeartShards(EMPTY_HEART_FORGE, RUNE_FORGE_SHARDS - 1))).toBe(false);
    const state = forgeRune(addHeartShards(EMPTY_HEART_FORGE, 4), 'fire');
    expect(state.shards).toBe(1);
    expect(runeCount(state, { element: 'fire', rank: 1 })).toBe(1);
  });

  it('fusionne 3 runes en une du rang suivant', () => {
    const state = { ...EMPTY_HEART_FORGE, runes: { 'ice:1': 4 } as const };
    const { state: fused, success } = fuseRunes(state, { element: 'ice', rank: 1 }, always(0));
    expect(success).toBe(true);
    expect(runeCount(fused, { element: 'ice', rank: 1 })).toBe(1);
    expect(runeCount(fused, { element: 'ice', rank: 2 })).toBe(1);
  });

  it('peut rater à partir du rang 3 : il ne reste alors qu’une rune', () => {
    expect(fusionFailChance(2)).toBe(0);
    expect(fusionFailChance(3)).toBeGreaterThan(0);
    expect(fusionFailChance(5)).toBeGreaterThan(fusionFailChance(4));
    const state = { ...EMPTY_HEART_FORGE, runes: { 'earth:2': 3 } as const };
    const { state: failed, success } = fuseRunes(state, { element: 'earth', rank: 2 }, always(0));
    expect(success).toBe(false);
    expect(runeCount(failed, { element: 'earth', rank: 2 })).toBe(1);
    expect(runeCount(failed, { element: 'earth', rank: 3 })).toBe(0);
  });

  it('ne fusionne pas au-delà du rang 5', () => {
    expect(canFuse({ ...EMPTY_HEART_FORGE, runes: { 'light:5': 9 } }, { element: 'light', rank: 5 })).toBe(false);
  });

  it("demande 2 runes par étoile, de plus en plus hautes, dans un anneau de 10", () => {
    expect(RING_SOCKETS).toBe(10);
    expect(STAR_RUNES.map((star) => star.rank)).toEqual([1, 2, 3, 4, 5]);
    expect(socketRune(0)).toEqual({ element: 'fire', rank: 1 });
    expect(socketRune(9)).toEqual({ element: 'light', rank: 5 });
    expect(baseRunesFor(5)).toBe(81);
  });

  it("sertit la rune attendue et éveille l'étoile quand ses deux runes sont serties", () => {
    let state: HeartForgeState = { ...EMPTY_HEART_FORGE, runes: { 'fire:1': 1, 'earth:1': 1 } };
    expect(canSocket(state, 2)).toBe(false);
    state = socketRuneIn(state, 0);
    expect(starRunesSet(state, 1)).toBe(false);
    state = socketRuneIn(state, 1);
    expect(starRunesSet(state, 1)).toBe(true);
    expect(runeCount(state, { element: 'fire', rank: 1 })).toBe(0);
    expect(canSocket(state, 0)).toBe(false);
  });

  it('relit une sauvegarde valide et refuse une rune inconnue', () => {
    const state = socketRuneIn({ ...EMPTY_HEART_FORGE, shards: 5, runes: { 'fire:1': 2 } }, 0);
    expect(parseHeartForgeState(JSON.parse(JSON.stringify(state)))).toEqual(state);
    expect(parseHeartForgeState({ ...state, runes: { 'water:1': 1 } })).toBeNull();
    expect(parseHeartForgeState({ ...state, sockets: [true] })).toBeNull();
  });
});
