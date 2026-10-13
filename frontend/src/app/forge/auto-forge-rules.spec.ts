import { Item } from '../equipment/equipment.model';
import { hasFilters, isValidFilters, NO_FILTERS, passesFilters } from './auto-forge-rules';

function item(overrides: Partial<Item>): Item {
  return { id: 'x', slot: 'bag', tier: 'copper', level: 5, stats: { goldBonus: 0.1 }, ...overrides };
}

describe('filtres de forge automatique', () => {
  it('ne filtrent rien quand ils sont vides', () => {
    expect(hasFilters(NO_FILTERS)).toBe(false);
    expect(passesFilters(item({}), NO_FILTERS, {})).toBe(true);
  });

  it('gardent seulement les emplacements choisis', () => {
    const filters = { ...NO_FILTERS, slots: ['pickaxe' as const] };
    expect(hasFilters(filters)).toBe(true);
    expect(passesFilters(item({ slot: 'bag' }), filters, {})).toBe(false);
    expect(passesFilters(item({ slot: 'pickaxe', stats: { strikePower: 10 } }), filters, {})).toBe(true);
  });

  it('écartent les paliers sous le minimum', () => {
    const filters = { ...NO_FILTERS, minTier: 'iron' as const };
    expect(passesFilters(item({ tier: 'copper' }), filters, {})).toBe(false);
    expect(passesFilters(item({ tier: 'iron' }), filters, {})).toBe(true);
    expect(passesFilters(item({ tier: 'divine' }), filters, {})).toBe(true);
  });

  it('demandent au moins une des stats voulues, principale ou secondaire', () => {
    const filters = { ...NO_FILTERS, stats: ['critChance' as const, 'miningSpeed' as const] };
    expect(passesFilters(item({ stats: { goldBonus: 0.1 } }), filters, {})).toBe(false);
    expect(passesFilters(item({ stats: { goldBonus: 0.1, critChance: 0.02 } }), filters, {})).toBe(true);
  });

  it('peuvent ne garder que les objets meilleurs que celui porté', () => {
    const filters = { ...NO_FILTERS, upgradesOnly: true };
    const worn = { pickaxe: item({ slot: 'pickaxe', stats: { strikePower: 10 } }) };
    expect(passesFilters(item({ slot: 'pickaxe', stats: { strikePower: 5 } }), filters, worn)).toBe(false);
    expect(passesFilters(item({ slot: 'pickaxe', stats: { strikePower: 20 } }), filters, worn)).toBe(true);
  });

  it('refusent une sauvegarde invalide', () => {
    expect(isValidFilters(NO_FILTERS)).toBe(true);
    expect(isValidFilters({ ...NO_FILTERS, slots: ['épée'] })).toBe(false);
    expect(isValidFilters({ ...NO_FILTERS, minTier: 'bronze' })).toBe(false);
  });
});
