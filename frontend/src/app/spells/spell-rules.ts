// Règles pures des sorts actifs : minuteurs et effets en cours.
import { shardEchoChance, SpellDef, SPELLS, SpellId } from '../balance/skill-tree';
import { NO_BUFFS, SpellBuffs } from '../miner/miner-rules';

export interface SpellTimer {
  /** Instant à partir duquel le sort peut être relancé. */
  readonly readyAt: number;
  /** Fin de l'effet en cours (0 pour une explosion, qui agit d'un coup). */
  readonly activeUntil: number;
}

export type SpellTimers = Readonly<Partial<Record<SpellId, SpellTimer>>>;

export interface ActiveSpell {
  readonly spell: SpellDef;
  readonly rank: number;
}

export function isReady(timers: SpellTimers, spell: SpellId, now: number): boolean {
  return (timers[spell]?.readyAt ?? 0) <= now;
}

export function isActive(timers: SpellTimers, spell: SpellId, now: number): boolean {
  return (timers[spell]?.activeUntil ?? 0) > now;
}

/** Effets cumulés des sorts équipés dont l'effet dure encore. */
export function activeBuffs(equipped: readonly ActiveSpell[], timers: SpellTimers, now: number): SpellBuffs {
  let buffs = NO_BUFFS;
  for (const { spell, rank } of equipped) {
    if (!isActive(timers, spell.id, now)) {
      continue;
    }
    const effect = spell.effect;
    if (effect.kind === 'speed') {
      buffs = { ...buffs, speed: buffs.speed + effect.amount };
    } else if (effect.kind === 'crit') {
      buffs = { ...buffs, guaranteedCrit: true };
    } else if (effect.kind === 'gold') {
      buffs = { ...buffs, goldMultiplier: buffs.goldMultiplier * effect.multiplier };
    } else if (effect.kind === 'shard') {
      buffs = { ...buffs, shardChance: buffs.shardChance + shardEchoChance(SPELLS[spell.id], rank) };
    }
  }
  return buffs;
}
