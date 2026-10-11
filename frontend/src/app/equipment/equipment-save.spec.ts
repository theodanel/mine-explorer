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
