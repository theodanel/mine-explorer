import { AFFINITY_MULTIPLIER, ELEMENT_EFFECTS, gearSocketCount, RESONANCE_MULTIPLIER } from '../balance/gear-runes';
import {
  EMPTY_GEAR_RUNES,
  gearRuneBonuses,
  resonantType,
  sameOpenSockets,
  runeEffects,
} from './gear-runes-rules';
import {
  addEssences,
  canCreateGearRune,
  canGrowGearRune,
  createGearRune,
  EMPTY_HEART_FORGE,
  growGearRune,
  parseHeartForgeState,
  removeGearRune,
  Rune,
} from './heart-forge-rules';
import { RUNE_GROW_ESSENCES } from '../balance/heart-forge';

const FIRE_2: Rune = { type: 'fire', rank: 2 };
const FIRE_1: Rune = { type: 'fire', rank: 1 };
const ICE_1: Rune = { type: 'ice', rank: 1 };


describe('runes d’équipement', () => {
  it('ouvre une châsse par étoile, trois au plus', () => {
    expect([0, 1, 2, 3, 5].map(gearSocketCount)).toEqual([0, 1, 2, 3, 3]);
  });

  it("crée la rune d'un élément dans une châsse vide, puis la fait grandir avec ses ressources", () => {
    const start = addEssences(EMPTY_HEART_FORGE, { ember: 3 + RUNE_GROW_ESSENCES[2] });
    expect(canCreateGearRune(start, 'gloves', 1, 'fire', 1)).toBe(false);
    const created = createGearRune(start, 'gloves', 0, 'fire', 1);
    expect(created.gear.gloves[0]).toEqual(FIRE_1);
    expect(created.essences.ember).toBe(RUNE_GROW_ESSENCES[2]);
    expect(canGrowGearRune(created, 'gloves', 0)).toBe(true);
    const grown = growGearRune(created, 'gloves', 0);
    expect(grown.gear.gloves[0]).toEqual(FIRE_2);
    expect(grown.essences.ember).toBe(0);
  });

  it("refuse une châsse fermée ou occupée, et les alliances", () => {
    const rich = addEssences(EMPTY_HEART_FORGE, { ember: 50, sap: 50 });
    expect(canCreateGearRune(rich, 'pickaxe', 1, 'fire', 1)).toBe(false);
    expect(canCreateGearRune(rich, 'pickaxe', 0, 'magma', 1)).toBe(false);
    const taken = createGearRune(rich, 'pickaxe', 0, 'fire', 1);
    expect(canCreateGearRune(taken, 'pickaxe', 0, 'fire', 1)).toBe(false);
  });

  it('retire une rune et rend ce qu’elle a coûté', () => {
    const set = { ...EMPTY_HEART_FORGE, gear: { ...EMPTY_GEAR_RUNES, pickaxe: [FIRE_2, null, null, null, null] } };
    const removed = removeGearRune(set, 'pickaxe', 0);
    expect(removed.gear.pickaxe[0]).toBeNull();
    expect(removed.essences.ember).toBe(3 + RUNE_GROW_ESSENCES[2]);
    expect(removeGearRune(removed, 'pickaxe', 0)).toBe(removed);
  });

  it('renforce davantage la stat de l’esprit de la pièce (affinité)', () => {
    const [onPickaxe] = runeEffects(FIRE_2, 'pickaxe', false);
    const [onBag] = runeEffects(FIRE_2, 'bag', false);
    expect(onBag).toEqual({ bonus: 'strikePct', value: ELEMENT_EFFECTS.fire.values[1] });
    expect(onPickaxe.value).toBeCloseTo(onBag.value * AFFINITY_MULTIPLIER);
  });

  it('partage une rune d’alliance entre ses éléments', () => {
    const effects = runeEffects({ type: 'magma', rank: 1 }, 'bag', false);
    expect(effects.map((effect) => effect.bonus)).toEqual(['strikePct', 'speed']);
    expect(effects[0].value).toBeCloseTo(ELEMENT_EFFECTS.fire.values[0] * 0.6);
  });

  it('fait résonner trois runes du même type, seulement quand les trois châsses sont ouvertes', () => {
    const gear = { ...EMPTY_GEAR_RUNES, bag: [FIRE_2, FIRE_1, FIRE_2, null, null] };
    expect(resonantType(gear.bag)).toBe('fire');
    expect(resonantType([FIRE_2, ICE_1, FIRE_2])).toBeNull();
    const single = ELEMENT_EFFECTS.fire.values[1];
    const total = (2 * single + ELEMENT_EFFECTS.fire.values[0]) * RESONANCE_MULTIPLIER;
    expect(gearRuneBonuses(gear, sameOpenSockets(3)).strikePct).toBeCloseTo(total);
    // Deux châsses ouvertes : seules les deux premières comptent, sans résonance
    expect(gearRuneBonuses(gear, sameOpenSockets(2)).strikePct).toBeCloseTo(single + ELEMENT_EFFECTS.fire.values[0]);
  });

  it('fait résonner seulement les runes du type répété quand l’Éveil ouvre deux châsses de plus', () => {
    const gear = { ...EMPTY_GEAR_RUNES, bag: [FIRE_1, FIRE_1, ICE_1, FIRE_1, ICE_1] };
    const bonuses = gearRuneBonuses(gear, sameOpenSockets(5));
    expect(bonuses.strikePct).toBeCloseTo(3 * ELEMENT_EFFECTS.fire.values[0] * RESONANCE_MULTIPLIER);
    expect(bonuses.critChance).toBeCloseTo(2 * ELEMENT_EFFECTS.ice.values[0]);
  });

  it('agrandit une ancienne sauvegarde à trois châsses', () => {
    const old = { ...EMPTY_HEART_FORGE, gear: Object.fromEntries(Object.keys(EMPTY_GEAR_RUNES).map((slot) => [slot, [FIRE_1, null, null]])) };
    expect(parseHeartForgeState(old)?.gear.bag).toEqual([FIRE_1, null, null, null, null]);
  });

  it('additionne toutes les runes serties en une famille de bonus', () => {
    const gear = { ...EMPTY_GEAR_RUNES, bag: [ICE_1, null, null, null, null], boots: [ICE_1, null, null, null, null] };
    expect(gearRuneBonuses(gear, sameOpenSockets(1)).critChance).toBeCloseTo(2 * ELEMENT_EFFECTS.ice.values[0]);
    expect(gearRuneBonuses(gear, sameOpenSockets(0)).critChance).toBe(0);
  });

  it('lit une ancienne sauvegarde sans runes d’équipement, et refuse une rune inconnue', () => {
    const { gear, ...old } = EMPTY_HEART_FORGE;
    expect(gear).toBe(EMPTY_GEAR_RUNES);
    expect(parseHeartForgeState(old)?.gear).toEqual(EMPTY_GEAR_RUNES);
    const broken = { ...EMPTY_HEART_FORGE, gear: { ...EMPTY_GEAR_RUNES, bag: [{ type: 'gold', rank: 1 }, null, null, null, null] } };
    expect(parseHeartForgeState(broken)).toBeNull();
  });
});
