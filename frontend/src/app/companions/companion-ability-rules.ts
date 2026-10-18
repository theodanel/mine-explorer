// Règles pures de la compétence du familier : recharge, durée, puissance selon les étoiles, et effets en cours.
import { ABILITY_SECONDS_PER_STAR, CompanionAbility, companionEffectMultiplier } from '../balance/companions';
import { MAX_COOLDOWN_REDUCTION } from '../balance/skill-tree';
import { NO_BUFFS, SpellBuffs } from '../miner/miner-rules';

const SECOND = 1000;

/** Recharge, réduite par les mêmes bonus que les sorts (Mèche courte, artefacts). */
export function abilityCooldownMs(ability: CompanionAbility, cooldownPct: number): number {
  return ability.cooldownMs * (1 - Math.min(cooldownPct, MAX_COOLDOWN_REDUCTION));
}

/** Durée d'effet : une seconde de plus par étoile au-delà de la première, puis les bonus de durée des sorts. */
export function abilityDurationMs(ability: CompanionAbility, stars: number, durationPct: number): number {
  if (ability.durationMs <= 0) {
    return 0;
  }
  return (ability.durationMs + ABILITY_SECONDS_PER_STAR * SECOND * (stars - 1)) * (1 + durationPct);
}

/** Multiple de la Frappe d'une compétence explosive : ×1 à 1 étoile, ×3 à 5, puis le bonus d'explosion. */
export function abilityBlastMultiplier(ability: CompanionAbility, stars: number, blastPct: number): number {
  return ability.effect.kind === 'blast' ? ability.effect.strike * companionEffectMultiplier(stars) * (1 + blastPct) : 0;
}

/** Effet d'une compétence en cours, au même format que celui des sorts. */
export function abilityBuffs(ability: CompanionAbility): SpellBuffs {
  const effect = ability.effect;
  switch (effect.kind) {
    case 'speed':
      return { ...NO_BUFFS, speed: effect.amount };
    case 'crit':
      return { ...NO_BUFFS, guaranteedCrit: true };
    case 'gold':
      return { ...NO_BUFFS, goldMultiplier: effect.multiplier };
    case 'shard':
      return { ...NO_BUFFS, shardChance: effect.chance };
    default:
      return NO_BUFFS;
  }
}

/** Cumule deux effets : les vitesses et chances s'ajoutent, les multiplicateurs d'or se multiplient. */
export function combineBuffs(first: SpellBuffs, second: SpellBuffs): SpellBuffs {
  return {
    speed: first.speed + second.speed,
    guaranteedCrit: first.guaranteedCrit || second.guaranteedCrit,
    goldMultiplier: first.goldMultiplier * second.goldMultiplier,
    shardChance: first.shardChance + second.shardChance,
  };
}
