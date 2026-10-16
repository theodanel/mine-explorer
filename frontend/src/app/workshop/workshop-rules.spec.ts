import { BASE_STATS } from '../balance/balance';
import { WORKSHOP_MAX_LEVEL, WORKSHOP_STEP, workshopGoldCost, workshopMaterial, workshopOreCost } from '../balance/workshop';
import { EquippedItems, Item, SlotId, TierId } from '../equipment/equipment.model';
import { isValidLevels, migrateSlotLevels, pieceLevel, reinforce, upgradeCost, withLevel } from './workshop-rules';

function item(slot: SlotId, tier: TierId, stats: Item['stats'] = {}): Item {
  return { id: `${slot}-${tier}`, slot, tier, level: 1, stats };
}

describe('workshop-rules', () => {
  const pickaxe = item('pickaxe', 'steel', { strikePower: 100, critDamage: 0.2 });
  const gloves = item('gloves', 'iron', { strikePower: 10, critChance: 0.05 });
  const steelPickaxe: EquippedItems = { pickaxe, gloves };
  // Stats d'équipement sans Atelier : la base du mineur plus ce que portent les deux pièces
  const gear = {
    ...BASE_STATS,
    strikePower: BASE_STATS.strikePower + 110,
    critChance: BASE_STATS.critChance + 0.05,
    critDamage: BASE_STATS.critDamage + 0.2,
  };

  it('renforce toutes les stats de la pièce portée, selon le niveau de SA qualité', () => {
    const levels = { pickaxe: { steel: 24, mithril: 3 }, gloves: { iron: 1 } };
    const stats = reinforce(gear, levels, steelPickaxe);
    expect(stats.strikePower).toBeCloseTo(gear.strikePower + 100 * 24 * WORKSHOP_STEP + 10 * WORKSHOP_STEP);
    expect(stats.critDamage).toBeCloseTo(gear.critDamage + 0.2 * 24 * WORKSHOP_STEP);
    expect(stats.critChance).toBeCloseTo(gear.critChance + 0.05 * WORKSHOP_STEP);
    expect(stats.miningSpeed).toBe(gear.miningSpeed);
  });

  it("applique le bonus d'évolution à la Frappe ajoutée", () => {
    const evolved = { ...gear, strikePower: gear.strikePower * 2 };
    const stats = reinforce(evolved, { pickaxe: { steel: 10 } }, steelPickaxe);
    expect(stats.strikePower).toBeCloseTo(evolved.strikePower + 2 * 100 * 10 * WORKSHOP_STEP);
  });

  it('une qualité au-dessus repart de ses propres niveaux', () => {
    const levels = { pickaxe: { steel: 24 } };
    const mithril = reinforce(gear, levels, { pickaxe: item('pickaxe', 'mithril', { strikePower: 100 }) });
    expect(mithril.strikePower).toBe(gear.strikePower);
  });

  it('ne change rien sans niveau ni pièce', () => {
    expect(reinforce(BASE_STATS, {}, steelPickaxe)).toEqual(BASE_STATS);
    expect(reinforce(BASE_STATS, { boots: { steel: 5 } }, {})).toEqual(BASE_STATS);
  });

  it('coûte peu au début, plus cher pour une qualité plus haute, et monte doucement', () => {
    expect(workshopGoldCost('copper', 0)).toBeLessThan(1000);
    expect(workshopGoldCost('steel', 0)).toBeGreaterThan(workshopGoldCost('iron', 0));
    expect(workshopGoldCost('steel', 1) / workshopGoldCost('steel', 0)).toBeCloseTo(1.1, 2);
    expect(workshopOreCost(0)).toBe(6);
    expect(workshopOreCost(49)).toBe(18);
  });

  it('demande le minerai de la qualité, sauf pour le bois', () => {
    expect(workshopMaterial('wood')).toBeNull();
    expect(upgradeCost('wood', 0)?.ores).toEqual({});
    expect(upgradeCost('mithril', 12)?.ores).toEqual({ mithril: workshopOreCost(12) });
  });

  it('s\'arrête au niveau 50', () => {
    expect(upgradeCost('steel', WORKSHOP_MAX_LEVEL - 1)).not.toBeNull();
    expect(upgradeCost('steel', WORKSHOP_MAX_LEVEL)).toBeNull();
  });

  it('range les niveaux par emplacement puis par qualité', () => {
    const levels = withLevel({ pickaxe: { steel: 2 } }, 'pickaxe', 'gold', 1);
    expect(pieceLevel(levels, 'pickaxe', 'steel')).toBe(2);
    expect(pieceLevel(levels, 'pickaxe', 'gold')).toBe(1);
    expect(pieceLevel(levels, 'helmet', 'gold')).toBe(0);
  });

  it('refuse une sauvegarde invalide', () => {
    expect(isValidLevels({ pickaxe: { steel: 3 } })).toBe(true);
    expect(isValidLevels({ pickaxe: { steel: -1 } })).toBe(false);
    expect(isValidLevels({ pickaxe: { steel: 51 } })).toBe(false);
    expect(isValidLevels({ pickaxe: { plastic: 1 } })).toBe(false);
    expect(isValidLevels({ hat: {} })).toBe(false);
    expect(isValidLevels({ pickaxe: 3 })).toBe(false);
    expect(isValidLevels([1])).toBe(false);
  });

  it('convertit l\'ancienne sauvegarde vers la qualité de la pièce portée', () => {
    expect(migrateSlotLevels({ pickaxe: 7, gloves: 60, boots: 2 }, steelPickaxe)).toEqual({
      pickaxe: { steel: 7 },
      gloves: { iron: 50 },
    });
    expect(migrateSlotLevels({ pickaxe: { steel: 1 } }, steelPickaxe)).toBeNull();
  });
});
