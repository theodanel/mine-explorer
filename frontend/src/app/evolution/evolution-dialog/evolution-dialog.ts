import { Component, computed, inject, output } from '@angular/core';

import { holdUserDialog } from '../../shared/overlays';
import { Sound } from '../../audio/sound';
import { TIER_IDS, TIER_LABELS } from '../../equipment/equipment.model';
import { EVOLUTION_VISUALS, materialIconUrl } from '../../loading/game-assets';
import { Ores } from '../../ores/ores';
import { Evolution } from '../evolution';

const NUMBER_FORMAT = new Intl.NumberFormat('fr-FR');
const PERCENT = 100;

/** Fenêtre d'évolution : forme actuelle, forme suivante, conditions et minerais en stock. */
@Component({
  selector: 'app-evolution-dialog',
  templateUrl: './evolution-dialog.html',
  styleUrl: './evolution-dialog.scss',
})
export class EvolutionDialog {
  protected readonly materialIcon = materialIconUrl;
  protected readonly evolution = inject(Evolution);
  private readonly ores = inject(Ores);
  private readonly sound = inject(Sound);
  readonly closed = output();

  constructor() {
    // Ouverte par le joueur : les fenêtres automatiques attendent sa fermeture
    holdUserDialog();
  }

  protected evolve(): void {
    if (this.evolution.evolve()) {
      this.sound.play('upgrade');
    }
  }

  protected readonly current = computed(() => {
    const form = this.evolution.form();
    return { label: form.label, portraitUrl: EVOLUTION_VISUALS[form.id].portraitUrl };
  });

  protected readonly next = computed(() => {
    const form = this.evolution.next();
    if (form === null) {
      return null;
    }
    return {
      label: form.label,
      portraitUrl: EVOLUTION_VISUALS[form.id].portraitUrl,
      bonus: Math.round(form.strikeBonus * PERCENT),
    };
  });

  protected readonly requirements = computed(() =>
    this.evolution.requirements().map((requirement) => ({
      ...requirement,
      have: NUMBER_FORMAT.format(requirement.have),
      need: NUMBER_FORMAT.format(requirement.need),
    })),
  );

  /** Minerais déjà récoltés, pour que le joueur sache où il en est même hors des conditions. */
  protected readonly stock = computed(() =>
    TIER_IDS.filter((tier) => this.ores.stock()[tier] > 0).map((tier) => ({
      tier,
      label: TIER_LABELS[tier],
      amount: NUMBER_FORMAT.format(this.ores.stock()[tier]),
    })),
  );
}
