import { COMPANIONS } from '../balance/companions';
import { NO_BUFFS } from '../miner/miner-rules';
import { abilityBlastMultiplier, abilityBuffs, abilityCooldownMs, abilityDurationMs, combineBuffs } from './companion-ability-rules';

describe('compétence du familier', () => {
  it('donne une compétence à chaque familier', () => {
    for (const companion of Object.values(COMPANIONS)) {
      expect(companion.ability.label.length).toBeGreaterThan(0);
      expect(companion.ability.cooldownMs).toBeGreaterThan(0);
    }
  });

  it('frappe plus fort avec les étoiles : ×1 à 1 étoile, ×3 à 5', () => {
    const golem = COMPANIONS.golem.ability;
    expect(abilityBlastMultiplier(golem, 1, 0)).toBe(15);
    expect(abilityBlastMultiplier(golem, 5, 0)).toBe(45);
    expect(abilityBlastMultiplier(golem, 1, 0.2)).toBeCloseTo(18);
    expect(abilityBlastMultiplier(COMPANIONS.canary.ability, 5, 0)).toBe(0);
  });

  it('dure une seconde de plus par étoile, et se recharge avec les bonus des sorts', () => {
    const canary = COMPANIONS.canary.ability;
    expect(abilityDurationMs(canary, 1, 0)).toBe(8000);
    expect(abilityDurationMs(canary, 3, 0)).toBe(10_000);
    expect(abilityDurationMs(COMPANIONS.mole.ability, 3, 0)).toBe(0);
    expect(abilityCooldownMs(canary, 0.1)).toBeCloseTo(54_000);
    // La recharge ne descend jamais sous 60 % de sa durée de base
    expect(abilityCooldownMs(canary, 0.9)).toBeCloseTo(36_000);
  });

  it('ajoute son effet à celui des sorts', () => {
    expect(abilityBuffs(COMPANIONS.canary.ability).goldMultiplier).toBe(2);
    expect(abilityBuffs(COMPANIONS.bat.ability).guaranteedCrit).toBe(true);
    expect(abilityBuffs(COMPANIONS.mole.ability)).toEqual(NO_BUFFS);
    const both = combineBuffs({ ...NO_BUFFS, goldMultiplier: 3, speed: 1 }, abilityBuffs(COMPANIONS.dragonling.ability));
    expect(both).toEqual({ ...NO_BUFFS, goldMultiplier: 3, speed: 2 });
  });
});
