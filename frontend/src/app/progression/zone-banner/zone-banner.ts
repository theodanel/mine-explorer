import { Component, computed, inject } from '@angular/core';

import { STAGES_PER_ZONE } from '../../balance/balance';
import { Galleries } from '../../galleries/galleries';
import { galleryIconUrl } from '../../loading/game-assets';
import { Tooltip } from '../../shared/tooltip/tooltip';
import { Progression } from '../progression';

const PERCENT = 100;
const NUMBER_FORMAT = new Intl.NumberFormat('fr-FR');

@Component({
  selector: 'app-zone-banner',
  imports: [Tooltip],
  templateUrl: './zone-banner.html',
  styleUrl: './zone-banner.scss',
})
export class ZoneBanner {
  protected readonly progression = inject(Progression);
  protected readonly galleries = inject(Galleries);
  protected readonly galleryIcon = computed(() => galleryIconUrl(this.galleries.current()));
  protected readonly galleryTooltip = computed(() => `${this.galleries.gallery().label} pour toute la zone : ${this.galleries.gallery().effects.join(', ')}.`);
  protected readonly stagesPerZone = STAGES_PER_ZONE;
  protected readonly healthPercent = computed(() => Math.round(this.progression.health() * PERCENT));
  protected readonly remaining = computed(() => NUMBER_FORMAT.format(this.progression.remainingHp()));
}
