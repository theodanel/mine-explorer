import { Component, computed, inject } from '@angular/core';

import { STAGES_PER_ZONE } from '../../balance/balance';
import { Sound } from '../../audio/sound';
import { Galleries } from '../../galleries/galleries';
import { galleryIconUrl } from '../../loading/game-assets';
import { Navigation } from '../../navigation/navigation';
import { Tooltip } from '../../shared/tooltip/tooltip';
import { Progression } from '../progression';

const COMPACT = new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 });

@Component({
  selector: 'app-zone-banner',
  imports: [Tooltip],
  templateUrl: './zone-banner.html',
  styleUrl: './zone-banner.scss',
})
export class ZoneBanner {
  protected readonly progression = inject(Progression);
  protected readonly galleries = inject(Galleries);
  private readonly navigation = inject(Navigation);
  private readonly sound = inject(Sound);
  protected readonly galleryIcon = computed(() => galleryIconUrl(this.galleries.current()));
  protected readonly galleryTooltip = computed(() => `${this.galleries.gallery().label} pour toute la zone : ${this.galleries.gallery().effects.join(', ')}.`);
  protected readonly stagesPerZone = STAGES_PER_ZONE;
  /** Puissance qui casse le gardien raté à temps, en notation courte. */
  protected readonly guardianPower = computed(() => COMPACT.format(this.progression.guardianPower()));

  protected challengeGuardian(): void {
    if (this.progression.challengeGuardian()) {
      this.sound.play('upgrade');
    }
  }

  protected openMap(): void {
    this.navigation.open('zones');
  }
}
