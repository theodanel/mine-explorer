import { Component, computed, inject } from '@angular/core';

import { COMPANIONS } from '../../balance/companions';
import { COMPANION_ANIMATIONS, companionIconUrl } from '../../loading/game-assets';
import { Companions } from '../companions';

/** Le compagnon qui accompagne le mineur, à ses pieds : animé s'il a sa vidéo, sinon en image qui respire. */
@Component({
  selector: 'app-companion-buddy',
  template: `
    @if (buddy(); as buddy) {
      @if (buddy.animation; as animation) {
        <span
          class="sprite"
          role="img"
          [attr.aria-label]="buddy.label + ' est avec toi'"
          [style.background-image]="'url(' + animation.url + ')'"
          [style.background-size]="animation.frames * 100 + '% 100%'"
          [style.aspect-ratio]="animation.frameWidth + ' / ' + animation.frameHeight"
          [style.animation-duration]="animation.frames / 12 + 's'"
          [style.animation-timing-function]="'steps(' + (animation.frames - 1) + ')'"
        ></span>
      } @else {
        <img class="still" [src]="buddy.icon" [alt]="buddy.label + ' est avec toi'" width="200" height="200" />
      }
    }
  `,
  styleUrl: './companion-buddy.scss',
})
export class CompanionBuddy {
  private readonly companions = inject(Companions);

  protected readonly buddy = computed(() => {
    const id = this.companions.active();
    if (id === null) {
      return null;
    }
    return { label: COMPANIONS[id].label, icon: companionIconUrl(id), animation: COMPANION_ANIMATIONS[id] ?? null };
  });
}
