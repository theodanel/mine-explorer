import {
  OFFERING_EMBERS,
  offeringCost,
  REBIRTH_STRIKE_PER_LEVEL,
  REBIRTH_TREE,
  rebirthEmbers,
  rebirthHardness,
} from '../balance/rebirth';
import { stageHp } from '../progression/progression-rules';
import { buy, canBuy, canRebirth, EMPTY_REBIRTH, nextCost, offer, parseRebirth, rebirth, rebirthEffects } from './rebirth-rules';
import { auraCss, rebirthAura, romanNumeral } from './rebirth-visuals';

describe('Renaissance', () => {
  it("ne s'ouvre qu'à partir de la zone 20, et rapporte plus en allant plus loin", () => {
    expect(canRebirth(19)).toBe(false);
    expect(canRebirth(20)).toBe(true);
    expect(rebirthEmbers(19)).toBe(0);
    expect(rebirthEmbers(22)).toBeGreaterThan(rebirthEmbers(20));
    expect(rebirth(EMPTY_REBIRTH, 19, 280)).toBe(EMPTY_REBIRTH);
  });

  it('compte la vie, ses Braises et garde la meilleure profondeur', () => {
    const once = rebirth(EMPTY_REBIRTH, 21, 305);
    expect(once).toEqual({ count: 1, embers: rebirthEmbers(21), tree: {}, bestStages: 305, offerings: 0 });
    expect(rebirth(once, 20, 290).bestStages).toBe(305);
  });

  it("achète les paliers de l'arbre avec les Braises, jusqu'au maximum", () => {
    const rich = { ...EMPTY_REBIRTH, embers: 1000 };
    const bought = buy(rich, 'strike');
    expect(bought.tree.strike).toBe(1);
    expect(bought.embers).toBe(1000 - REBIRTH_TREE.strike.cost(0));
    expect(canBuy({ ...EMPTY_REBIRTH, embers: 0 }, 'strike')).toBe(false);
    const maxed = { ...rich, tree: { gold: REBIRTH_TREE.gold.maxLevel } };
    expect(nextCost(maxed, 'gold')).toBeNull();
    expect(buy(maxed, 'gold')).toBe(maxed);
  });

  it('donne de grosses hausses de Frappe, un meilleur départ, et durcit les filons à chaque vie', () => {
    const effects = rebirthEffects({ count: 2, embers: 0, tree: { strike: 3, shortcut: 2, pickaxe: 1 }, bestStages: 30 * 15, offerings: 0 });
    expect(effects.strikeMultiplier).toBeCloseTo((1 + REBIRTH_STRIKE_PER_LEVEL) ** 3);
    // Record en zone 30, raccourci au palier 2 : 8 zones avant
    expect(effects.startZone).toBe(22);
    expect(rebirthEffects({ count: 1, embers: 0, tree: {}, bestStages: 5, offerings: 0 }).startZone).toBe(1);
    expect(effects.startPickaxe).toBeGreaterThan(1);
    expect(effects.hardness).toBeCloseTo(rebirthHardness(2));
    expect(stageHp(20, 3, effects.hardness)).toBeGreaterThan(stageHp(20, 3));
  });

  it('relit une sauvegarde, et refuse un palier impossible', () => {
    const state = { count: 3, embers: 40, tree: { strike: 5 }, bestStages: 400, offerings: 0 };
    expect(parseRebirth(JSON.stringify(state))).toEqual(state);
    expect(parseRebirth(JSON.stringify({ ...state, tree: { gold: 99 } }))).toBeNull();
    expect(parseRebirth('{abîmé')).toBeNull();
  });

  it("montre sa puissance : emblème en chiffres romains, lueur qui change de couleur toutes les 3 vies", () => {
    expect(romanNumeral(0)).toBe('');
    expect(romanNumeral(4)).toBe('IV');
    expect(romanNumeral(14)).toBe('XIV');
    expect(rebirthAura(0)).toBeNull();
    expect(auraCss(rebirthAura(1))).toBe(auraCss(rebirthAura(3)));
    expect(auraCss(rebirthAura(4))).not.toBe(auraCss(rebirthAura(3)));
    expect(rebirthAura(10)?.textScale).toBeGreaterThan(rebirthAura(1)?.textScale ?? 0);
  });

  it('échange de l’or contre des Braises, et remet les offrandes à zéro en renaissant', () => {
    const gifted = offer(EMPTY_REBIRTH);
    expect(gifted).toEqual({ ...EMPTY_REBIRTH, embers: OFFERING_EMBERS, offerings: 1 });
    expect(rebirth(gifted, 20, 300).offerings).toBe(0);
    expect(offeringCost(100, 1)).toBe(1.5 * offeringCost(100, 0));
  });
});
