import { Component, computed, effect, inject } from '@angular/core';

import { Sound } from '../../audio/sound';
import { GUARDIAN_EVERY, RECORD_STEP } from '../../balance/abyss';
import { ADVENTURE_IMAGES, pageBackground } from '../../loading/game-assets';
import { Navigation } from '../../navigation/navigation';
import { Abyss } from '../abyss';

const SECONDS = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1, minimumFractionDigits: 1 });
const PERCENT = 100;
const MS_PER_SECOND = 1000;

/** Puits sans fond : lancer une descente, la regarder défiler, puis voir son bilan. */
@Component({
  selector: 'app-abyss-page',
  templateUrl: './abyss-page.html',
  styleUrls: ['../../workshop/workshop-page/workshop-page.scss', './abyss-page.scss'],
})
export class AbyssPage {
  protected readonly abyss = inject(Abyss);
  private readonly navigation = inject(Navigation);
  private readonly sound = inject(Sound);

  protected readonly recordStep = RECORD_STEP;
  protected readonly images = ADVENTURE_IMAGES;
  protected readonly background = pageBackground(ADVENTURE_IMAGES.abyssBackground);
  /** Étage en train d'être cassé (un de plus que les étages franchis). */
  protected readonly floor = computed(() => (this.abyss.descent()?.floors ?? 0) + 1);
  protected readonly guardian = computed(() => this.floor() % GUARDIAN_EVERY === 0);
  protected readonly floorPercent = computed(() => Math.round((this.abyss.descent()?.progress ?? 0) * PERCENT));
  protected readonly timeLeft = computed(() => SECONDS.format(this.abyss.timeLeftMs() / MS_PER_SECOND));

  constructor() {
    // Un son par étage franchi : la descente se sent même sans regarder les chiffres
    let lastFloors = 0;
    effect(() => {
      const floors = this.abyss.descent()?.floors ?? 0;
      if (floors > lastFloors) {
        this.sound.play('rockBreak');
      }
      lastFloors = floors;
    });
  }

  protected start(): void {
    if (this.abyss.start()) {
      this.sound.play('blast');
    }
  }

  protected back(): void {
    this.navigation.open('adventures');
  }
}
