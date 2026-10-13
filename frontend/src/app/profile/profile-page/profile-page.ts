import { Component, computed, inject } from '@angular/core';

import { Sound } from '../../audio/sound';
import { Evolution } from '../../evolution/evolution';
import { EVOLUTION_VISUALS } from '../../loading/game-assets';
import { Navigation } from '../../navigation/navigation';
import { Progression } from '../../progression/progression';

/** Volumes proposés, du plus fort au coupé. */
const VOLUME_OPTIONS = [
  { value: 1, label: 'Fort' },
  { value: 0.5, label: 'Moyen' },
  { value: 0, label: 'Coupé' },
] as const;

/** Page Profil : le mineur, son évolution, et les paramètres du jeu. */
@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.scss',
})
export class ProfilePage {
  protected readonly evolution = inject(Evolution);
  protected readonly progression = inject(Progression);
  protected readonly sound = inject(Sound);
  private readonly navigation = inject(Navigation);

  protected readonly volumes = VOLUME_OPTIONS;
  protected readonly portraitUrl = computed(() => EVOLUTION_VISUALS[this.evolution.form().id].portraitUrl);

  protected openEvolution(): void {
    this.navigation.open('evolution');
  }

  protected close(): void {
    this.navigation.open('mine');
  }
}
