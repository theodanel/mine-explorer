import { Component, computed, inject } from '@angular/core';

import { Progression } from '../progression';

const PERCENT = 100;
const NUMBER_FORMAT = new Intl.NumberFormat('fr-FR');

@Component({
  selector: 'app-zone-banner',
  templateUrl: './zone-banner.html',
  styleUrl: './zone-banner.scss',
})
export class ZoneBanner {
  protected readonly progression = inject(Progression);
  protected readonly healthPercent = computed(() => Math.round(this.progression.health() * PERCENT));
  protected readonly remaining = computed(() => NUMBER_FORMAT.format(this.progression.remainingHp()));
}
