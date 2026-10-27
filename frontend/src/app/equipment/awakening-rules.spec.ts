import { awakeningCost, awakeningSockets, awakeningStatBonus, AWAKENING_SET_STRIKE_PER_LEVEL, MAX_AWAKENING } from '../balance/awakening';
import { SET_BONUSES } from '../balance/balance';
import {
  applyAwakening,
  awaken,
  awakeningBlocker,
  corruptionPhase,
  AwakeningState,
  EMPTY_AWAKENING,
  lowestAwakening,
  parseAwakening,
  recordDuplicate,
} from './awakening-rules';
import { computeStats, gearSet } from './equipment-rules';
import { EquippedItems, Item, SLOT_IDS, SlotId, TierId } from './equipment.model';

function item(slot: SlotId, tier: TierId = 'divine', family = 0): Item {
  return { id: `${slot}-${tier}-${family}`, slot, tier, level: 30, family, stats: { strikePower: 1000, critChance: 0.02 } };
}

const ALL_DIVINE: EquippedItems = Object.fromEntries(SLOT_IDS.map((slot) => [slot, item(slot)]));
const FULL_COST = awakeningCost('pickaxe', 0);

function readyFor(slot: SlotId, level: number): AwakeningState {
  const cost = awakeningCost(slot, level);
  return { levels: { [slot]: level }, duplicates: { [slot]: cost?.duplicates ?? 0 } };
}

describe('Éveil des pièces Divin', () => {
  it('met de côté un doublon par pièce Divin vendue, rien pour les autres', () => {
    const state = recordDuplicate(recordDuplicate(EMPTY_AWAKENING, item('bag')), item('bag', 'magma'));
    expect(state.duplicates).toEqual({ bag: 1 });
  });

  it('éveille la pièce en payant ses doublons, jusqu’au palier 5', () => {
    const state = awaken(readyFor('pickaxe', 0), 'pickaxe');
    expect(state.levels.pickaxe).toBe(1);
    expect(state.duplicates.pickaxe).toBe(0);
    expect(awaken({ levels: { pickaxe: MAX_AWAKENING }, duplicates: {} }, 'pickaxe').levels.pickaxe).toBe(MAX_AWAKENING);
  });

  it('dit ce qui manque : pièce non Divin, doublons, ressources du Cœur, maximum', () => {
    const essences = FULL_COST?.essences ?? 0;
    expect(awakeningBlocker(readyFor('pickaxe', 0), item('pickaxe', 'magma'), essences, 5)).toBe('not-divine');
    expect(awakeningBlocker(EMPTY_AWAKENING, item('pickaxe'), essences, 5)).toBe('duplicates');
    expect(awakeningBlocker(readyFor('pickaxe', 0), item('pickaxe'), essences - 1, 5)).toBe('essences');
    expect(awakeningBlocker(readyFor('pickaxe', 0), item('pickaxe'), essences, 5)).toBeNull();
    expect(awakeningBlocker({ levels: { pickaxe: MAX_AWAKENING }, duplicates: {} }, item('pickaxe'), essences, 5)).toBe('max');
  });

  it("renforce toute pièce portée à l'emplacement : l'Éveil survit à la renaissance", () => {
    const equipped: EquippedItems = { pickaxe: item('pickaxe'), bag: item('bag', 'wood') };
    const awakened = applyAwakening(equipped, { pickaxe: 5, bag: 2 });
    expect(awakened.pickaxe?.stats.strikePower).toBeCloseTo(1000 * (1 + awakeningStatBonus(5)));
    expect(awakened.bag?.stats.strikePower).toBeCloseTo(1000 * (1 + awakeningStatBonus(2)));
    expect(applyAwakening({}, { pickaxe: 5 }).pickaxe).toBeUndefined();
    expect(computeStats(equipped, { pickaxe: 5 }).strikePower).toBeGreaterThan(computeStats(equipped).strikePower);
  });

  it('fait chaque phase avec le Divin de sa famille : la phase 2 demande un Divin corrompu I', () => {
    const state = readyFor('pickaxe', 1);
    const essences = awakeningCost('pickaxe', 1)?.essences ?? 0;
    expect(awakeningBlocker(state, item('pickaxe', 'divine', 0), essences, 5)).toBe('family');
    expect(awakeningBlocker(state, item('pickaxe', 'divine', 1), essences, 5)).toBeNull();
    expect(awakeningCost('pickaxe', 0)?.duplicates).toBe(3000);
  });

  it('demande le sceau de la phase, appris dans les compétences', () => {
    const essences = FULL_COST?.essences ?? 0;
    expect(awakeningBlocker(readyFor('pickaxe', 0), item('pickaxe'), essences, 0)).toBe('seal');
    expect(awakeningBlocker(readyFor('pickaxe', 0), item('pickaxe'), essences, 1)).toBeNull();
  });

  it('ne compte comme doublons que les Divin de la famille de la phase à venir', () => {
    const atPhase1 = { levels: { bag: 1 }, duplicates: {} };
    expect(recordDuplicate(atPhase1, item('bag', 'divine', 0)).duplicates).toEqual({});
    expect(recordDuplicate(atPhase1, item('bag', 'divine', 1)).duplicates).toEqual({ bag: 1 });
  });

  it('a pour phase le palier le plus bas des cinq emplacements', () => {
    expect(corruptionPhase({})).toBe(0);
    expect(corruptionPhase(Object.fromEntries(SLOT_IDS.map((slot) => [slot, 2])))).toBe(2);
    expect(corruptionPhase({ ...Object.fromEntries(SLOT_IDS.map((slot) => [slot, 2])), boots: 1 })).toBe(1);
  });

  it('ouvre une châsse de rune de plus aux paliers 2 et 4', () => {
    expect([0, 1, 2, 3, 4, 5].map(awakeningSockets)).toEqual([0, 0, 1, 1, 2, 2]);
  });

  it('fait suivre au bonus de panoplie Divin l’Éveil de la pièce la moins éveillée', () => {
    const levels = Object.fromEntries(SLOT_IDS.map((slot) => [slot, 4]));
    const uneven = { ...levels, boots: 2 };
    expect(lowestAwakening(ALL_DIVINE, uneven)).toBe(2);
    const full = SET_BONUSES[0].strikePct;
    expect(gearSet(ALL_DIVINE, uneven)?.strikePct).toBeCloseTo(full + 2 * AWAKENING_SET_STRIKE_PER_LEVEL);
    expect(gearSet(ALL_DIVINE)?.strikePct).toBeCloseTo(full);
  });

  it('relit une sauvegarde, et refuse un palier impossible', () => {
    const state: AwakeningState = { levels: { bag: 2 }, duplicates: { bag: 12 } };
    expect(parseAwakening(JSON.stringify(state))).toEqual(state);
    expect(parseAwakening(JSON.stringify({ levels: { bag: 9 }, duplicates: {} }))).toBeNull();
    expect(parseAwakening('{abîmé')).toBeNull();
  });
});
