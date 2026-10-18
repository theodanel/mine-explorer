import { RING_SOCKETS, STAR_RUNES } from '../balance/heart-forge';
import {
  addEssences,
  brew,
  canBrew,
  canFuse,
  canSocket,
  echoEssence,
  EMPTY_HEART_FORGE,
  essencesFor,
  fuseRunes,
  fusionFailChance,
  HeartForgeState,
  parseHeartForgeState,
  recipeResult,
  runeCount,
  socketRune,
  socketRuneIn,
  starRunesSet,
} from './heart-forge-rules';

const always = (value: number) => () => value;

describe('Échos', () => {
  it('donnent la ressource de leur zone, et rien hors des zones 1 à 11', () => {
    expect(echoEssence(1)).toBe('sap');
    expect(echoEssence(9)).toBe('ember');
    expect(echoEssence(8)).toBe('frost');
    expect(echoEssence(12)).toBeNull();
  });
});

describe('Creuset du Cœur', () => {
  it("donne la rune de l'élément pour 3 ressources identiques", () => {
    expect(recipeResult(['ember', 'ember', 'ember'])).toBe('fire');
    expect(recipeResult(['frost', 'frost', 'frost'])).toBe('ice');
  });

  it("trouve les alliances quel que soit l'ordre des ressources", () => {
    expect(recipeResult(['sap', 'ember', 'ember'])).toBe('magma');
    expect(recipeResult(['dawn', 'frost', 'ember'])).toBe('heart');
  });

  it("donne sinon l'élément le plus présent, ou celui de la 1re ressource", () => {
    expect(recipeResult(['mist', 'sap', 'mist'])).toBe('shadow');
    expect(recipeResult(['sap', 'mist', 'frost'])).toBe('earth');
  });

  it('consomme les ressources, donne une rune de rang 1 et inscrit la recette', () => {
    const stocked = addEssences(EMPTY_HEART_FORGE, { ember: 2, sap: 1 });
    expect(canBrew(stocked, ['ember', 'ember', 'ember'])).toBe(false);
    const { state, rune } = brew(stocked, ['ember', 'ember', 'sap']);
    expect(rune).toBe('magma');
    expect(state.essences.ember).toBe(0);
    expect(runeCount(state, { type: 'magma', rank: 1 })).toBe(1);
    expect(state.recipes).toEqual(['magma']);
  });
});

describe('Fusion et anneau', () => {
  it('fusionne 3 runes en une du rang suivant', () => {
    const state: HeartForgeState = { ...EMPTY_HEART_FORGE, runes: { 'ice:1': 4 } };
    const { state: fused, success } = fuseRunes(state, { type: 'ice', rank: 1 }, always(0));
    expect(success).toBe(true);
    expect(runeCount(fused, { type: 'ice', rank: 2 })).toBe(1);
  });

  it('peut rater à partir du rang 3 : il ne reste alors qu’une rune', () => {
    expect(fusionFailChance(2)).toBe(0);
    expect(fusionFailChance(5)).toBeGreaterThan(fusionFailChance(4));
    const state: HeartForgeState = { ...EMPTY_HEART_FORGE, runes: { 'storm:2': 3 } };
    const { state: failed, success } = fuseRunes(state, { type: 'storm', rank: 2 }, always(0));
    expect(success).toBe(false);
    expect(runeCount(failed, { type: 'storm', rank: 2 })).toBe(1);
  });

  it('ne fusionne pas au-delà du rang 5', () => {
    expect(canFuse({ ...EMPTY_HEART_FORGE, runes: { 'heart:5': 9 } }, { type: 'heart', rank: 5 })).toBe(false);
  });

  it('demande des étoiles de plus en plus complexes, dans un anneau de 10', () => {
    expect(RING_SOCKETS).toBe(10);
    const essences = STAR_RUNES.map(([first, second]) => essencesFor(first.rank) + essencesFor(second.rank));
    essences.slice(1).forEach((count, index) => expect(count).toBeGreaterThanOrEqual(essences[index]));
    expect(socketRune(3)).toEqual({ type: 'magma', rank: 1 });
  });

  it("sertit la rune attendue et éveille l'étoile quand ses deux runes sont serties", () => {
    let state: HeartForgeState = { ...EMPTY_HEART_FORGE, runes: { 'fire:1': 1, 'earth:1': 1 } };
    expect(canSocket(state, 2)).toBe(false);
    state = socketRuneIn(socketRuneIn(state, 0), 1);
    expect(starRunesSet(state, 1)).toBe(true);
    expect(runeCount(state, { type: 'fire', rank: 1 })).toBe(0);
  });

  it('relit une sauvegarde valide et refuse une rune inconnue', () => {
    const state = brew(addEssences(EMPTY_HEART_FORGE, { mist: 1, dawn: 2 }), ['mist', 'dawn', 'dawn']).state;
    expect(parseHeartForgeState(JSON.parse(JSON.stringify(state)))).toEqual(state);
    expect(parseHeartForgeState({ ...state, runes: { 'water:1': 1 } })).toBeNull();
    expect(parseHeartForgeState({ ...state, sockets: [true] })).toBeNull();
  });
});
