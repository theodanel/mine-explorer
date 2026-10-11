import { computed, inject, Injectable, signal } from '@angular/core';

import { EVOLUTION_FORMS, evolutionStrikeMultiplier } from '../balance/balance';
import { TIER_LABELS } from '../equipment/equipment.model';
import { Ores } from '../ores/ores';
import { Progression } from '../progression/progression';
import { readStorage, writeStorage } from '../shared/local-storage';
import { Wallet } from '../wallet/wallet';
import { canEvolve, nextForm, requirementsFor } from './evolution-rules';

const STORAGE_KEY = 'mine-explorer.evolution';

/** Forme actuelle du mineur et passage à la suivante. */
@Injectable({ providedIn: 'root' })
export class Evolution {
  private readonly progression = inject(Progression);
  private readonly ores = inject(Ores);
  private readonly wallet = inject(Wallet);
  private readonly formIndex = signal(loadFormIndex());

  readonly index = this.formIndex.asReadonly();
  readonly form = computed(() => EVOLUTION_FORMS[this.formIndex()]);
  readonly next = computed(() => nextForm(this.formIndex()));
  /** Multiplicateur de Frappe cumulé de toutes les formes atteintes. */
  readonly strikeMultiplier = computed(() => evolutionStrikeMultiplier(this.formIndex()));

  readonly requirements = computed(() => {
    const form = this.next();
    if (form === null) {
      return [];
    }
    return requirementsFor(form, this.progression.zone(), this.ores.stock(), this.wallet.coins(), (tier) => TIER_LABELS[tier]);
  });
  readonly ready = computed(() => this.next() !== null && canEvolve(this.requirements()));

  /** Paie minerais et or, puis passe à la forme suivante. */
  evolve(): boolean {
    const form = this.next();
    if (form === null || !this.ready()) {
      return false;
    }
    // Les conditions viennent d'être vérifiées : les deux dépenses passent forcément
    this.ores.spend(form.ores);
    if (form.gold > 0) {
      this.wallet.spend(form.gold);
    }
    this.formIndex.update((index) => index + 1);
    writeStorage(STORAGE_KEY, String(this.formIndex()));
    return true;
  }
}

function loadFormIndex(): number {
  const raw = readStorage(STORAGE_KEY);
  if (raw === null) {
    return 0;
  }
  const index = Number(raw);
  if (!Number.isSafeInteger(index) || index < 0 || index >= EVOLUTION_FORMS.length) {
    console.warn(`Forme d'évolution invalide ignorée : "${raw}"`);
    return 0;
  }
  return index;
}
