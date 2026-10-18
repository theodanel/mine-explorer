import { Component, computed, inject } from '@angular/core';

import { COMPANIONS } from '../../balance/companions';
import { RARITY_LABELS, SPELL_MAX_RANK } from '../../balance/skill-tree';
import { companionIconUrl, spellIconUrl } from '../../loading/game-assets';
import { Tooltip, TooltipContent } from '../../shared/tooltip/tooltip';
import { Skills } from '../../skills/skills';
import { SpellCaster } from '../spell-caster';
import { CompanionSlotView, SpellSlotView, Spells } from '../spells';

const SECONDS = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

/** Les 3 sorts équipés, au-dessus des stats : un appui lance le sort, « Auto » les lance dès qu'ils sont prêts. */
@Component({
  selector: 'app-spell-bar',
  imports: [Tooltip],
  templateUrl: './spell-bar.html',
  styleUrl: './spell-bar.scss',
})
export class SpellBar {
  private readonly spells = inject(Spells);
  private readonly caster = inject(SpellCaster);
  protected readonly skills = inject(Skills);

  protected readonly slots = computed(() =>
    this.spells.slots().map((slot, index) => (slot === null ? { index, empty: true as const } : { index, empty: false as const, ...view(slot) })),
  );
  /** Rien n'est appris : les cases de sorts restent cachées plutôt que d'afficher trois cases inutiles. */
  protected readonly hasSpells = computed(() => this.spells.slots().some((slot) => slot !== null));
  /** Compétence du familier qui accompagne le mineur, à côté des sorts. */
  protected readonly companion = computed(() => {
    const slot = this.spells.companionSlot();
    return slot === null ? null : companionView(slot);
  });

  protected cast(index: number): void {
    this.caster.cast(index);
  }

  protected castCompanion(): void {
    this.caster.castCompanion();
  }
}

function view(slot: SpellSlotView) {
  const tooltip: TooltipContent = {
    title: slot.spell.label,
    badge: { label: `${RARITY_LABELS[slot.spell.rarity]} · Rang ${slot.rank}/${SPELL_MAX_RANK}`, tier: '' },
    lines: [slot.spell.summary, slot.ready ? 'Prêt : touche pour le lancer.' : `Recharge : ${SECONDS.format(slot.cooldownLeftMs / 1000)} s`],
  };
  return {
    label: slot.spell.label,
    icon: spellIconUrl(slot.spell.id),
    rarity: slot.spell.rarity,
    ready: slot.ready,
    active: slot.active,
    cooldownLeft: slot.cooldownLeft,
    secondsLeft: SECONDS.format(Math.ceil(slot.cooldownLeftMs / 1000)),
    tooltip,
  };
}

function companionView(slot: CompanionSlotView) {
  const companion = COMPANIONS[slot.id];
  const tooltip: TooltipContent = {
    title: slot.ability.label,
    badge: { label: `${companion.label} · ${slot.stars} étoile${slot.stars > 1 ? 's' : ''}`, tier: '' },
    lines: [slot.ability.summary, slot.ready ? 'Prête : touche pour la lancer.' : `Recharge : ${SECONDS.format(slot.cooldownLeftMs / 1000)} s`],
  };
  return {
    label: slot.ability.label,
    icon: companionIconUrl(slot.id),
    rarity: companion.rarity,
    ready: slot.ready,
    active: slot.active,
    cooldownLeft: slot.cooldownLeft,
    secondsLeft: SECONDS.format(Math.ceil(slot.cooldownLeftMs / 1000)),
    tooltip,
  };
}
