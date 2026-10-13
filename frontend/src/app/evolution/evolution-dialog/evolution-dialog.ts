import { Component, computed, inject, output } from '@angular/core';

import { holdUserDialog } from '../../shared/overlays';
import { Sound } from '../../audio/sound';
import { EVOLUTION_VISUALS } from '../../loading/game-assets';
import { Evolution } from '../evolution';

const NUMBER_FORMAT = new Intl.NumberFormat('fr-FR');
const PERCENT = 100;

/** Fenêtre d'évolution, façon « Adventure Rank » : forme actuelle, suivante, objectifs et promotion. */
@Component({
  selector: 'app-evolution-dialog',
  templateUrl: './evolution-dialog.html',
  styleUrl: './evolution-dialog.scss',
})
export class EvolutionDialog {
  protected readonly evolution = inject(Evolution);
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

  protected readonly objectives = computed(() =>
    this.evolution.objectives().map((objective) => ({
      ...objective,
      haveRaw: objective.have,
      needRaw: objective.need,
      have: NUMBER_FORMAT.format(objective.have),
      need: NUMBER_FORMAT.format(objective.need),
      percent: Math.round((objective.have / objective.need) * PERCENT),
    })),
  );

  protected claim(index: number): void {
    if (this.evolution.claim(index)) {
      this.sound.play('shard');
    }
  }
}
