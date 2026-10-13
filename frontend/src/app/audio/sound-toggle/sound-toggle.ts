import { Component, computed, inject } from '@angular/core';

import { Sound } from '../sound';

const VOLUME_LABELS: Readonly<Record<string, string>> = { '1': 'fort', '0.5': 'moyen', '0': 'coupé' };

/** Bouton du son : fort, moyen, coupé. Le réglage est gardé d'une partie à l'autre. */
@Component({
  selector: 'app-sound-toggle',
  template: `
    <button
      type="button"
      class="sound-toggle"
      [class.muted]="sound.volume() === 0"
      [attr.aria-label]="'Son ' + label() + ', touche pour changer'"
      (click)="sound.cycleVolume()"
    >
      Son {{ label() }}
    </button>
  `,
  styleUrl: './sound-toggle.scss',
})
export class SoundToggle {
  protected readonly sound = inject(Sound);
  protected readonly label = computed(() => VOLUME_LABELS[String(this.sound.volume())] ?? 'fort');
}
