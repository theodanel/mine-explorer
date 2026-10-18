import { DestroyRef, DOCUMENT, inject, Injectable } from '@angular/core';

import { blastStrikeMultiplier } from '../balance/skill-tree';
import { abilityBlastMultiplier } from '../companions/companion-ability-rules';
import { Mining } from '../mining/mining';
import { Skills } from '../skills/skills';
import { Spells } from './spells';

/** Vérifie souvent si un sort est prêt en mode automatique : un retard d'un quart de seconde ne se voit pas. */
const AUTO_CHECK_MS = 250;

/**
 * Lance les sorts, à la main ou en automatique, et applique les explosions à la mine.
 * Séparé de Spells pour éviter une dépendance circulaire : la mine lit les effets des sorts en cours.
 */
@Injectable({ providedIn: 'root' })
export class SpellCaster {
  private readonly spells = inject(Spells);
  private readonly skills = inject(Skills);
  private readonly mining = inject(Mining);
  private readonly document = inject(DOCUMENT);

  constructor() {
    const timer = setInterval(() => this.autoCast(), AUTO_CHECK_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  cast(slot: number): boolean {
    const launched = this.spells.trigger(slot);
    if (launched === null) {
      return false;
    }
    if (launched.spell.effect.kind === 'blast') {
      const multiplier = blastStrikeMultiplier(launched.spell, launched.rank, this.spells.modifiers().blastPct);
      this.mining.blast(launched.spell.id, multiplier);
    }
    return true;
  }

  /** Lance la compétence du familier : une explosion frappe tout de suite, un effet dure quelques secondes. */
  castCompanion(): boolean {
    const launched = this.spells.triggerCompanion();
    if (launched === null) {
      return false;
    }
    if (launched.ability.effect.kind === 'blast') {
      // La scène montre l'explosion de la dynamite : la compétence n'a pas encore d'effet visuel à elle
      this.mining.blast('dynamite', abilityBlastMultiplier(launched.ability, launched.stars, this.spells.modifiers().blastPct));
    }
    return true;
  }

  private autoCast(): void {
    // Onglet caché : la mine est arrêtée et l'absence prend le relais, les sorts ne doivent pas tourner en double
    if (!this.skills.auto() || this.document.hidden) {
      return;
    }
    this.spells.slots().forEach((slot, index) => {
      if (slot?.ready) {
        this.cast(index);
      }
    });
    if (this.spells.companionSlot()?.ready) {
      this.castCompanion();
    }
  }
}
