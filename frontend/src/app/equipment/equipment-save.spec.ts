import { EquipmentSave, parseEquipmentSave } from './equipment-save';

const pickaxe = { id: 'a', slot: 'pickaxe', tier: 'iron', level: 3, stats: { strikePower: 2, critChance: 0.01 } };

describe('parseEquipmentSave', () => {
  it('relit une sauvegarde valide', () => {
    const save: EquipmentSave = {
      equipped: { pickaxe: { id: 'a', slot: 'pickaxe', tier: 'iron', level: 3, stats: { strikePower: 2 } } },
      pending: null,
    };
    expect(parseEquipmentSave(JSON.stringify(save))).toEqual(save);
  });

  it("garde sans perte les objets forgés avant les builds libres, une stat par emplacement", () => {
    // Sauvegarde de la version en ligne : la pioche portait la Frappe, les gants le Critique, le sac l'or
    const before: EquipmentSave = {
      equipped: {
        pickaxe: { id: 'p', slot: 'pickaxe', tier: 'copper', level: 6, stats: { strikePower: 17 } },
        gloves: { id: 'g', slot: 'gloves', tier: 'iron', level: 8, stats: { critChance: 0.055, goldBonus: 0.04 } },
        bag: { id: 'b', slot: 'bag', tier: 'wood', level: 2, stats: { goldBonus: 0.081 } },
      },
      pending: { id: 'h', slot: 'helmet', tier: 'copper', level: 6, stats: { critDamage: 0.22 } },
    };
    expect(parseEquipmentSave(JSON.stringify(before))).toEqual(before);
  });

  it.each([
    ['du JSON cassé', '{'],
    ['un tableau', '[]'],
    ['sans equipped', JSON.stringify({ pending: null })],
    ['un emplacement inconnu', JSON.stringify({ equipped: { hat: pickaxe }, pending: null })],
    ['un objet rangé au mauvais emplacement', JSON.stringify({ equipped: { boots: pickaxe }, pending: null })],
    ['un palier inconnu', JSON.stringify({ equipped: {}, pending: { ...pickaxe, tier: 'adamantium' } })],
    ['une stat inconnue', JSON.stringify({ equipped: {}, pending: { ...pickaxe, stats: { power: 9 } } })],
    ['une stat négative', JSON.stringify({ equipped: {}, pending: { ...pickaxe, stats: { strikePower: -4 } } })],
    ['un pending absent', JSON.stringify({ equipped: {} })],
    ['un objet sans niveau', JSON.stringify({ equipped: {}, pending: { ...pickaxe, level: undefined } })],
    ['un niveau à 0', JSON.stringify({ equipped: {}, pending: { ...pickaxe, level: 0 } })],
  ])('rejette %s', (_label, raw) => {
    expect(parseEquipmentSave(raw)).toBeNull();
  });
});
