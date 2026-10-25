import { RING_SOCKETS, RUNE_GROW_ESSENCES, STAR_RUNES } from '../balance/heart-forge';
import {
  addEssences,
  canCreate,
  canGrow,
  canSocket,
  createCost,
  createRune,
  echoEssence,
  EMPTY_HEART_FORGE,
  essencesFor,
  growCost,
  growRune,
  HeartForgeState,
  parseHeartForgeState,
  revealedRecipes,
  runeCount,
  socketOpen,
  socketRune,
  socketRuneIn,
  starRunesSet,
} from './heart-forge-rules';

describe('Échos', () => {
  it('donnent la ressource de leur zone, et rien hors des zones 1 à 11', () => {
    expect(echoEssence(1)).toBe('sap');
    expect(echoEssence(9)).toBe('ember');
    expect(echoEssence(8)).toBe('frost');
    expect(echoEssence(12)).toBeNull();
  });
});

describe('Création et croissance des runes', () => {
  it("crée une rune d'élément pour 3 ressources de son élément", () => {
    expect(createCost('fire')).toEqual({ ember: 3 });
    const state = createRune(addEssences(EMPTY_HEART_FORGE, { ember: 3 }), 'fire', 0);
    expect(runeCount(state, { type: 'fire', rank: 1 })).toBe(1);
    expect(state.essences.ember).toBe(0);
    expect(state.recipes).toEqual(['fire']);
  });

  it("ne crée une alliance que si une étoile a révélé sa recette, pour 2 ressources de plus", () => {
    const stocked = addEssences(EMPTY_HEART_FORGE, { ember: 4, sap: 1 });
    expect(createCost('magma')).toEqual({ ember: 4, sap: 1 });
    expect(canCreate(stocked, 'magma', 0)).toBe(false);
    expect(canCreate(stocked, 'magma', 1)).toBe(true);
    expect(canCreate(addEssences(EMPTY_HEART_FORGE, { ember: 3, sap: 1 }), 'magma', 1)).toBe(false);
  });

  it('fait grandir une rune de ses ressources, réparties comme sa recette, sans hasard', () => {
    expect(growCost({ type: 'ice', rank: 1 })).toEqual({ frost: RUNE_GROW_ESSENCES[2] });
    expect(growCost({ type: 'magma', rank: 1 })).toEqual({ ember: 4, sap: 2 });
    const state: HeartForgeState = { ...addEssences(EMPTY_HEART_FORGE, { frost: 6 }), runes: { 'ice:1': 2 } };
    const grown = growRune(state, { type: 'ice', rank: 1 });
    expect(runeCount(grown, { type: 'ice', rank: 1 })).toBe(1);
    expect(runeCount(grown, { type: 'ice', rank: 2 })).toBe(1);
    expect(grown.essences.frost).toBe(0);
    expect(canGrow(grown, { type: 'ice', rank: 1 })).toBe(false);
  });

  it('ne fait pas grandir au-delà du rang 5', () => {
    expect(growCost({ type: 'heart', rank: 5 })).toBeNull();
    expect(canGrow({ ...EMPTY_HEART_FORGE, runes: { 'heart:5': 1 } }, { type: 'heart', rank: 5 })).toBe(false);
  });
});

describe('Anneau', () => {
  it('demande des étoiles de plus en plus complexes, dans un anneau de 10', () => {
    expect(RING_SOCKETS).toBe(10);
    const essences = STAR_RUNES.map(([first, second]) => essencesFor(first.rank) + essencesFor(second.rank));
    essences.slice(1).forEach((count, index) => expect(count).toBeGreaterThanOrEqual(essences[index]));
    expect(socketRune(3)).toEqual({ type: 'magma', rank: 1 });
  });

  it("sertit la rune attendue et éveille l'étoile quand ses deux runes sont serties", () => {
    let state: HeartForgeState = { ...EMPTY_HEART_FORGE, runes: { 'fire:1': 1, 'earth:1': 1 } };
    expect(canSocket(state, 2, 0)).toBe(false);
    state = socketRuneIn(socketRuneIn(state, 0, 0), 1, 0);
    expect(starRunesSet(state, 1)).toBe(true);
    expect(runeCount(state, { type: 'fire', rank: 1 })).toBe(0);
  });

  it("n'ouvre les emplacements d'une étoile qu'une fois la précédente obtenue", () => {
    const state: HeartForgeState = { ...EMPTY_HEART_FORGE, runes: { 'ice:2': 1 } };
    expect(socketOpen(2, 0)).toBe(false);
    expect(canSocket(state, 2, 0)).toBe(false);
    expect(socketRuneIn(state, 2, 0)).toBe(state);
    expect(canSocket(state, 2, 1)).toBe(true);
  });

  it("révèle les recettes d'alliance des étoiles obtenues et de la suivante", () => {
    expect(revealedRecipes(0)).toEqual([]);
    expect(revealedRecipes(1)).toEqual(['magma']);
    expect(revealedRecipes(4)).toEqual(['magma', 'storm', 'grove', 'eclipse', 'heart']);
  });

  it('relit une sauvegarde valide et refuse une rune inconnue', () => {
    const state = createRune(addEssences(EMPTY_HEART_FORGE, { mist: 2, dawn: 3 }), 'eclipse', 3);
    expect(parseHeartForgeState(JSON.parse(JSON.stringify(state)))).toEqual(state);
    expect(parseHeartForgeState({ ...state, runes: { 'water:1': 1 } })).toBeNull();
    expect(parseHeartForgeState({ ...state, sockets: [true] })).toBeNull();
  });
});
