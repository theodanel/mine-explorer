import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';

import { CompanionAbility, CompanionId, COMPANIONS } from '../balance/companions';
import { SpellDef, spellCooldownMs, spellDurationMs, SPELLS } from '../balance/skill-tree';
import { abilityBuffs, abilityCooldownMs, abilityDurationMs, combineBuffs } from '../companions/companion-ability-rules';
import { Artifacts } from '../artifacts/artifacts';
import { Companions } from '../companions/companions';
import { combineFamilies } from '../miner/miner-rules';
import { CLOCK } from '../shared/clock';
import { Skills } from '../skills/skills';
import { activeBuffs, ActiveSpell, isActive, isReady, SpellTimer, SpellTimers } from './spell-rules';

/** Assez fin pour que la jauge de recharge et la fin d'un effet se voient sans à-coup. */
const TICK_MS = 200;

/** Compétence du familier qui accompagne le mineur, dans la barre de sorts. */
export interface CompanionSlotView {
  readonly id: CompanionId;
  readonly ability: CompanionAbility;
  readonly stars: number;
  readonly ready: boolean;
  readonly active: boolean;
  readonly cooldownLeft: number;
  readonly cooldownLeftMs: number;
}

export interface SpellSlotView {
  readonly spell: SpellDef;
  readonly rank: number;
  readonly ready: boolean;
  readonly active: boolean;
  /** Part de la recharge restante, de 1 (vient d'être lancé) à 0 (prêt). */
  readonly cooldownLeft: number;
  readonly cooldownLeftMs: number;
}

/**
 * Minuteurs et effets des sorts équipés. Ce service ne frappe pas lui-même : une explosion est appliquée
 * par SpellCaster, qui connaît la mine. Les minuteurs ne sont pas sauvegardés : un rechargement rend les sorts prêts.
 */
@Injectable({ providedIn: 'root' })
export class Spells {
  private readonly skills = inject(Skills);
  private readonly artifacts = inject(Artifacts);
  private readonly companions = inject(Companions);
  private readonly clock = inject(CLOCK);
  private readonly timers = signal<SpellTimers>({});
  /** Minuteurs des compétences de familiers, un par familier : changer de familier ne remet pas à zéro. */
  private readonly companionTimers = signal<Readonly<Partial<Record<CompanionId, SpellTimer>>>>({});
  private readonly now = signal(this.clock());

  /** Recharge, durée et explosions : les bonus de l'arbre et de l'artefact réunis. */
  readonly modifiers = computed(() => combineFamilies([this.skills.bonuses(), this.artifacts.bonuses(), this.companions.bonuses()]));

  private readonly equippedSpells = computed<readonly (ActiveSpell | null)[]>(() =>
    this.skills.equipped().map((id) => (id === null ? null : { spell: SPELLS[id], rank: this.skills.spellRank(id) })),
  );

  readonly slots = computed<readonly (SpellSlotView | null)[]>(() => {
    const now = this.now();
    const timers = this.timers();
    return this.equippedSpells().map((equipped) => {
      if (equipped === null) {
        return null;
      }
      const cooldownMs = spellCooldownMs(equipped.spell, this.modifiers().cooldownPct);
      const cooldownLeftMs = Math.max((timers[equipped.spell.id]?.readyAt ?? 0) - now, 0);
      return {
        ...equipped,
        ready: isReady(timers, equipped.spell.id, now),
        active: isActive(timers, equipped.spell.id, now),
        cooldownLeft: Math.min(cooldownLeftMs / cooldownMs, 1),
        cooldownLeftMs,
      };
    });
  });

  /** Familier actif et son nombre d'étoiles, ou null. */
  private readonly companion = computed(() => {
    const id = this.companions.active();
    const owned = id === null ? undefined : this.companions.owned()[id];
    return id === null || owned === undefined ? null : { id, stars: owned.stars };
  });

  readonly companionSlot = computed<CompanionSlotView | null>(() => {
    const companion = this.companion();
    if (companion === null) {
      return null;
    }
    const ability = COMPANIONS[companion.id].ability;
    const timer = this.companionTimers()[companion.id];
    const now = this.now();
    const cooldownMs = abilityCooldownMs(ability, this.modifiers().cooldownPct);
    const cooldownLeftMs = Math.max((timer?.readyAt ?? 0) - now, 0);
    return {
      ...companion,
      ability,
      ready: cooldownLeftMs === 0,
      active: (timer?.activeUntil ?? 0) > now,
      cooldownLeft: Math.min(cooldownLeftMs / cooldownMs, 1),
      cooldownLeftMs,
    };
  });

  readonly buffs = computed(() => {
    const spells = activeBuffs(
      this.equippedSpells().filter((spell): spell is ActiveSpell => spell !== null),
      this.timers(),
      this.now(),
    );
    const slot = this.companionSlot();
    return slot?.active ? combineBuffs(spells, abilityBuffs(slot.ability)) : spells;
  });

  constructor() {
    const timer = setInterval(() => this.now.set(this.clock()), TICK_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  /** Lance la compétence du familier si elle est prête, et la renvoie avec ses étoiles (null sinon). */
  triggerCompanion(): { readonly ability: CompanionAbility; readonly stars: number } | null {
    const companion = this.companion();
    const now = this.clock();
    if (companion === null || (this.companionTimers()[companion.id]?.readyAt ?? 0) > now) {
      return null;
    }
    const ability = COMPANIONS[companion.id].ability;
    const { cooldownPct, durationPct } = this.modifiers();
    const readyAt = now + abilityCooldownMs(ability, cooldownPct);
    const duration = abilityDurationMs(ability, companion.stars, durationPct);
    this.companionTimers.update((timers) => ({ ...timers, [companion.id]: { readyAt, activeUntil: duration > 0 ? now + duration : 0 } }));
    this.now.set(now);
    return { ability, stars: companion.stars };
  }

  /** Lance le sort de l'emplacement s'il est prêt, et renvoie ce qui a été lancé (null sinon). */
  trigger(slot: number): ActiveSpell | null {
    const equipped = this.equippedSpells()[slot] ?? null;
    const now = this.clock();
    if (equipped === null || !isReady(this.timers(), equipped.spell.id, now)) {
      return null;
    }
    const { cooldownPct, durationPct } = this.modifiers();
    const readyAt = now + spellCooldownMs(equipped.spell, cooldownPct);
    const activeUntil = equipped.spell.durationMs > 0 ? now + spellDurationMs(equipped.spell, equipped.rank, durationPct) : 0;
    this.timers.update((timers) => ({ ...timers, [equipped.spell.id]: { readyAt, activeUntil } }));
    this.now.set(now);
    return equipped;
  }
}
