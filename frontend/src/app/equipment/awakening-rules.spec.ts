import { awakeningCost, awakeningSockets, awakeningStatBonus, AWAKENING_SET_STRIKE_PER_LEVEL, MAX_AWAKENING } from '../balance/awakening';
import { SET_BONUSES } from '../balance/balance';
import { rebirthHardness } from '../balance/rebirth';
import {
  applyAwakening,
  awaken,
  awakeningBlocker,
  AwakeningState,
  EMPTY_AWAKENING,
  lowestAwakening,
  parseAwakening,
  recordDuplicate,
} from './awakening-rules';
import { computeStats, gearSet } from './equipment-rules';
import { EquippedItems, Item, SLOT_IDS, SlotId, TierId } from './equipment.model';

function item(slot: SlotId, tier: TierId = 'divine'): Item {
  return { id: `${slot}-${tier}`, slot, tier, level: 30, stats: { strikePower: 1000, critChance: 0.02 } };
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
    expect(awakeningBlocker(readyFor('pickaxe', 0), item('pickaxe', 'magma'), essences)).toBe('not-divine');
    expect(awakeningBlocker(EMPTY_AWAKENING, item('pickaxe'), essences)).toBe('duplicates');
    expect(awakeningBlocker(readyFor('pickaxe', 0), item('pickaxe'), essences - 1)).toBe('essences');
    expect(awakeningBlocker(readyFor('pickaxe', 0), item('pickaxe'), essences)).toBeNull();
    expect(awakeningBlocker({ levels: { pickaxe: MAX_AWAKENING }, duplicates: {} }, item('pickaxe'), essences)).toBe('max');
  });

  it("renforce toute pièce portée à l'emplacement : l'Éveil survit à la renaissance", () => {
    const equipped: EquippedItems = { pickaxe: item('pickaxe'), bag: item('bag', 'wood') };
    const awakened = applyAwakening(equipped, { pickaxe: 5, bag: 2 });
    expect(awakened.pickaxe?.stats.strikePower).toBeCloseTo(1000 * (1 + awakeningStatBonus(5)));
    expect(awakened.bag?.stats.strikePower).toBeCloseTo(1000 * (1 + awakeningStatBonus(2)));
    expect(applyAwakening({}, { pickaxe: 5 }).pickaxe).toBeUndefined();
    expect(computeStats(equipped, { pickaxe: 5 }).strikePower).toBeGreaterThan(computeStats(equipped).strikePower);
  });

  it('fait grandir le bonus avec les renaissances, comme la dureté des filons', () => {
    expect(awakeningStatBonus(5, 3)).toBeCloseTo(awakeningStatBonus(5) * rebirthHardness(3));
    const equipped: EquippedItems = { pickaxe: item('pickaxe') };
    expect(computeStats(equipped, { pickaxe: 5 }, 3).strikePower).toBeGreaterThan(computeStats(equipped, { pickaxe: 5 }).strikePower);
  });

  it('débloque chaque palier après le premier avec une renaissance de plus', () => {
    const state = readyFor('pickaxe', 1);
    const essences = awakeningCost('pickaxe', 1)?.essences ?? 0;
    expect(awakeningBlocker(state, item('pickaxe'), essences, 0)).toBe('rebirths');
    expect(awakeningBlocker(state, item('pickaxe'), essences, 1)).toBeNull();
    expect(awakeningCost('pickaxe', 4)?.rebirths).toBe(4);
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
