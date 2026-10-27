import { BASE_STATS, OFFLINE_EFFICIENCY, SHARD_FIND_CHANCE } from '../balance/balance';
import { Bonuses, NO_BONUSES } from '../balance/skill-tree';
import { combineFamilies, minerProfile, NO_BUFFS } from './miner-rules';

function bonuses(values: Partial<Bonuses>): Bonuses {
  return { ...NO_BONUSES, ...values };
}

describe('cumul des bonus', () => {
  it('multiplie la Frappe et l\'or entre familles', () => {
    const total = combineFamilies([bonuses({ strikePct: 0.1, goldPct: 0.2 }), bonuses({ strikePct: 0.1, goldPct: 0.5 })]);
    expect(total.strikePct).toBeCloseTo(0.21);
    expect(total.goldPct).toBeCloseTo(0.8);
  });

  it('additionne les points de Critique, de Vitesse et d\'éclat', () => {
    const total = combineFamilies([bonuses({ critChance: 0.02, speed: 0.1 }), bonuses({ critChance: 0.03, shardChance: 0.005 })]);
    expect(total.critChance).toBeCloseTo(0.05);
    expect(total.speed).toBeCloseTo(0.1);
    expect(total.shardChance).toBeCloseTo(0.005);
  });
});

describe('profil du mineur', () => {
  it('sans bonus, garde les stats de l\'équipement et les valeurs de base', () => {
    const profile = minerProfile(BASE_STATS, [NO_BONUSES], NO_BUFFS);
    expect(profile.stats).toEqual(BASE_STATS);
    expect(profile.shardChance).toBe(SHARD_FIND_CHANCE);
    expect(profile.offlineEfficiency).toBe(OFFLINE_EFFICIENCY);
  });

  it('applique les bonus permanents', () => {
    const profile = minerProfile(BASE_STATS, [bonuses({ strikePct: 0.2, critChance: 0.05, offlineEfficiency: 0.1 })], NO_BUFFS);
    expect(profile.stats.strikePower).toBeCloseTo(6);
    expect(profile.stats.critChance).toBeCloseTo(0.1);
    expect(profile.offlineEfficiency).toBeCloseTo(0.45);
  });

  it('plafonne le Critique permanent, mais un sort peut garantir les critiques', () => {
    expect(minerProfile(BASE_STATS, [bonuses({ critChance: 3 })], NO_BUFFS).stats.critChance).toBe(1);
    expect(minerProfile(BASE_STATS, [NO_BONUSES], { ...NO_BUFFS, guaranteedCrit: true }).stats.critChance).toBe(1);
  });

  it('ajoute la Vitesse d\'un sort au-dessus du plafond permanent', () => {
    const gear = { ...BASE_STATS, miningSpeed: 2 };
    expect(minerProfile(gear, [bonuses({ speed: 1 })], { ...NO_BUFFS, speed: 1 }).stats.miningSpeed).toBe(3);
  });

  it('multiplie l\'or par le sort Filon doré', () => {
    const profile = minerProfile({ ...BASE_STATS, goldBonus: 0.5 }, [NO_BONUSES], { ...NO_BUFFS, goldMultiplier: 3 });
    expect(profile.stats.goldBonus).toBeCloseTo(3.5);
  });
});

describe('plafonds convertis', () => {
  it('change la vitesse en trop en Frappe et le critique en trop en dégâts critiques', () => {
    const gear = { ...BASE_STATS, strikePower: 100, miningSpeed: 2.5, critChance: 1.2, critDamage: 1 };
    const profile = minerProfile(gear, [], NO_BUFFS);
    expect(profile.stats.miningSpeed).toBe(2);
    expect(profile.stats.critChance).toBe(1);
    expect(profile.stats.strikePower).toBeCloseTo(150);
    expect(profile.stats.critDamage).toBeCloseTo(1.4);
  });
});
