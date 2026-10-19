import { Component, computed, inject } from '@angular/core';

import { Navigation } from '../../navigation/navigation';
import { ProgressPass } from '../progress-pass';

/**
 * Bandeau du passe sur la mine : la prochaine récompense et les filons qu'il reste, ou les récompenses à récupérer.
 * Il ouvre la page du passe.
 */
@Component({
  selector: 'app-pass-banner',
  template: `
    @if (label(); as text) {
      <button type="button" class="pass-banner game-button" [class.green]="ready()" (click)="open()">
        <img src="assets/ui/geode-shard.webp" alt="" width="128" height="128" />{{ text }}
      </button>
    }
  `,
  styles: `
    .pass-banner {
      display: inline-flex;
      align-items: center;
      gap: 1cqw;
      padding: 0.8cqw 2.6cqw 0.8cqw 1.2cqw;
      font-size: 2.8cqw;
      white-space: nowrap;

      img {
        width: 4.6cqw;
        height: 4.6cqw;
      }
    }
  `,
})
export class PassBanner {
  private readonly pass = inject(ProgressPass);
  private readonly navigation = inject(Navigation);

  protected readonly ready = computed(() => this.pass.claimable().length > 0);
  protected readonly label = computed(() => {
    const count = this.pass.claimable().length;
    if (count > 0) {
      return `Passe : ${count} récompense${count > 1 ? 's' : ''} !`;
    }
    const next = this.pass.next();
    return next === null ? null : `Passe : +${next.tier.shards} dans ${next.rocksLeft} filon${next.rocksLeft > 1 ? 's' : ''}`;
  });

  protected open(): void {
    this.navigation.open('pass');
  }
}
