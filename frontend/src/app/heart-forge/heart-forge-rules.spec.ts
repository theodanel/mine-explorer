import { RUNE_GROW_ESSENCES } from '../balance/heart-forge';
import { EMPTY_ASTRE, stageOf, totalFed } from './astre-rules';
import {
  addEssences,
  createCost,
  echoEssence,
  EMPTY_HEART_FORGE,
  essencesFor,
  feedAstreWith,
  growCost,
  HeartForgeState,
  parseHeartForgeState,
  socketRune,
  spendEssences,
  starReady,
} from './heart-forge-rules';

describe('Échos', () => {
  it('donnent la ressource de leur zone, et rien hors des zones 1 à 11', () => {
    expect(echoEssence(1)).toBe('sap');
    expect(echoEssence(9)).toBe('ember');
    expect(echoEssence(8)).toBe('frost');
    expect(echoEssence(12)).toBeNull();
  });
});

describe('Ressources du Cœur', () => {
  it('paie une rune : 3 de son élément, 2 de plus pour une alliance, puis sa croissance', () => {
    expect(createCost('fire')).toEqual({ ember: 3 });
    expect(createCost('magma')).toEqual({ ember: 4, sap: 1 });
    expect(growCost({ type: 'ice', rank: 1 })).toEqual({ frost: RUNE_GROW_ESSENCES[2] });
    expect(growCost({ type: 'heart', rank: 5 })).toBeNull();
    expect(essencesFor(2)).toBe(3 + RUNE_GROW_ESSENCES[2]);
  });

  it("ne paie rien s'il manque une ressource", () => {
    expect(spendEssences(addEssences(EMPTY_HEART_FORGE, { ember: 2 }), { ember: 3 })).toBeNull();
  });
});

describe('Astre du Cœur', () => {
  it('se nourrit des ressources de la réserve, et ses stades sont les étoiles', () => {
    let state = addEssences(EMPTY_HEART_FORGE, { ember: 40 });
    expect(starReady(state, 1)).toBe(false);
    state = feedAstreWith(state, 'ember', 35);
    expect(state.essences.ember).toBe(5);
    expect(stageOf(state.astre)).toBe(2);
    expect(starReady(state, 2)).toBe(true);
    expect(starReady(state, 3)).toBe(false);
    expect(feedAstreWith(state, 'ember', 6)).toBe(state);
  });

  it("reprend une sauvegarde de l'anneau : les runes serties deviennent sa nourriture, la réserve est rendue", () => {
    const old = { ...EMPTY_HEART_FORGE, runes: { 'fire:2': 1 }, sockets: [true, true, ...Array<boolean>(8).fill(false)] };
    const { astre, ...withoutAstre } = old;
    expect(astre).toEqual(EMPTY_ASTRE);
    const migrated = parseHeartForgeState(withoutAstre) as HeartForgeState;
    const ring = essencesFor(socketRune(0).rank) + essencesFor(socketRune(1).rank);
    expect(totalFed(migrated.astre)).toBe(ring);
    expect(migrated.runes).toEqual({});
    expect(migrated.essences.ember).toBe(essencesFor(2));
  });

  it('relit une sauvegarde valide et refuse un Astre abîmé', () => {
    const state = feedAstreWith(addEssences(EMPTY_HEART_FORGE, { mist: 12 }), 'mist', 12);
    expect(parseHeartForgeState(JSON.parse(JSON.stringify(state)))).toEqual(state);
    expect(parseHeartForgeState({ ...state, astre: { ...state.astre, mist: -1 } })).toBeNull();
  });
});
