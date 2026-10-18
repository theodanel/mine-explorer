import { AFFINITY_WEIGHT, AFFIX_SHARE, expectedStatValue } from '../balance/balance';
import { affinityWeight, rollItem } from './equipment-rules';
import type { Item } from './equipment.model';
import { reforgeableAffixes, reforgeAffix, reforgeTargets } from './reforge-rules';

/** Gants d'acier au Critique, avec un affixe d'or tiré pile à sa valeur attendue. */
const GLOVES: Item = {
  id: 'g1',
  slot: 'gloves',
  tier: 'steel',
  level: 14,
  stats: { strikePower: 120, critChance: 0.04, goldBonus: expectedStatValue('goldBonus', 'steel', 14, AFFIX_SHARE.goldBonus) },
};

describe('affinités des emplacements', () => {
  it('fait sortir les deux stats d’affinité trois fois plus souvent', () => {
    expect(affinityWeight('gloves', 'critChance')).toBe(AFFINITY_WEIGHT);
    expect(affinityWeight('gloves', 'goldBonus')).toBe(1);
  });

  it('donne surtout la Vitesse et l’Or aux bottes', () => {
    let counter = 0;
    let seed = 1;
    const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    const firstAffixes = { favoured: 0, other: 0 };
    for (let index = 0; index < 400; index++) {
      const item = rollItem(random, () => `i${counter++}`, 20);
      if (item.slot !== 'boots') {
        continue;
      }
      const hasFavoured = item.stats.miningSpeed !== undefined || item.stats.goldBonus !== undefined;
      firstAffixes[hasFavoured ? 'favoured' : 'other']++;
    }
    expect(firstAffixes.favoured).toBeGreaterThan(firstAffixes.other * 2);
  });
});

describe('reforge', () => {
  it('ne relance que les affixes en pourcentage, vers une stat absente de la pièce', () => {
    expect(reforgeableAffixes(GLOVES)).toEqual(['critChance', 'goldBonus']);
    expect(reforgeTargets(GLOVES)).toEqual(['miningSpeed', 'critDamage']);
  });

  it('remplace l’affixe choisi en gardant la qualité du tirage', () => {
    const reforged = reforgeAffix(GLOVES, 'goldBonus', () => 0);
    expect(reforged?.stats.goldBonus).toBeUndefined();
    expect(reforged?.stats.miningSpeed).toBeCloseTo(expectedStatValue('miningSpeed', 'steel', 14, AFFIX_SHARE.miningSpeed), 3);
    expect(reforged?.stats.critChance).toBe(0.04);
    expect(reforged?.id).toBe(GLOVES.id);
  });

  it('refuse la Frappe et une stat absente', () => {
    expect(reforgeAffix(GLOVES, 'strikePower', () => 0)).toBeNull();
    expect(reforgeAffix(GLOVES, 'critDamage', () => 0)).toBeNull();
  });
});
