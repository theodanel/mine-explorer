import { Component, computed, inject, signal } from '@angular/core';

import { SLOT_IDS, SLOTS, STATS } from '../equipment.model';
import { Artifacts } from '../../artifacts/artifacts';
import { WORKSHOP_STEP } from '../../balance/workshop';
import { Companions } from '../../companions/companions';
import { Galleries } from '../../galleries/galleries';
import { describeBonuses } from '../../miner/bonus-format';
import { holdUserDialog } from '../../shared/overlays';
import { Skills } from '../../skills/skills';
import { Workshop } from '../../workshop/workshop';
import { StatsPanel } from '../stats-panel/stats-panel';

const PERCENT = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });

/** Fenêtre « Détails des stats » : les stats du mineur, puis d'où viennent ses bonus. */
@Component({
  selector: 'app-stats-details',
  imports: [StatsPanel],
  templateUrl: './stats-details.html',
  styleUrl: './stats-button.scss',
})
export class StatsDetails {
  private readonly workshop = inject(Workshop);
  private readonly companions = inject(Companions);
  private readonly artifacts = inject(Artifacts);
  private readonly skills = inject(Skills);
  private readonly galleries = inject(Galleries);

  constructor() {
    // Ouverte par le joueur : les fenêtres automatiques attendent sa fermeture
    holdUserDialog();
  }

  /** Une section par source de bonus ; une source sans effet n'apparaît pas. */
  protected readonly sources = computed(() => {
    const workshopLines = SLOT_IDS.filter((slot) => this.workshop.level(slot) > 0).map(
      (slot) => `+${PERCENT.format(this.workshop.level(slot) * WORKSHOP_STEP * 100)} % de ${STATS[SLOTS[slot].mainStat].label}`,
    );
    const gallery = this.galleries.gallery();
    return [
      { label: 'Atelier', lines: workshopLines },
      { label: 'Compagnon', lines: describeBonuses(this.companions.bonuses()) },
      { label: 'Artefact', lines: describeBonuses(this.artifacts.bonuses()) },
      { label: 'Arbre de compétences', lines: describeBonuses(this.skills.bonuses()) },
      { label: gallery.label, lines: this.galleries.current() === 'neutral' ? [] : [...gallery.effects] },
    ].filter((source) => source.lines.length > 0);
  });
}

/** Petit bouton rond en bas à droite, comme le parchemin de Legend of Mushroom : il ouvre le détail des stats. */
@Component({
  selector: 'app-stats-button',
  imports: [StatsDetails],
  template: `
    <button type="button" class="stats-button" aria-label="Détails des stats" (click)="open.set(true)">Stats</button>
    @if (open()) {
      <div class="backdrop" (click)="open.set(false)">
        @defer (on immediate) {
          <app-stats-details (click)="$event.stopPropagation()" />
        }
        <button type="button" class="close" aria-label="Fermer" (click)="open.set(false)">×</button>
      </div>
    }
  `,
  styleUrl: './stats-button.scss',
})
export class StatsButton {
  protected readonly open = signal(false);
}
