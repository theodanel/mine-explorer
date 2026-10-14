import { Component, computed, effect, inject, signal, untracked } from '@angular/core';

import { Sound } from '../../audio/sound';
import { MERCHANT_IMAGES } from '../../loading/game-assets';
import { Navigation } from '../../navigation/navigation';
import { Merchant } from '../merchant';

interface Hint {
  readonly key: string;
  readonly text: string;
  /** Le marchand est là : toucher la bulle ouvre son étal. */
  readonly open: boolean;
  readonly footprints: boolean;
}

/**
 * Indices du Marchand nain sur la mine, de plus en plus nets à l'approche : une rumeur, des traces de pas,
 * des clochettes, une lanterne, puis son arrivée et son départ. Une bulle par jour, qu'on peut fermer.
 */
@Component({
  selector: 'app-merchant-hint',
  templateUrl: './merchant-hint.html',
  styleUrl: './merchant-hint.scss',
})
export class MerchantHint {
  private readonly merchant = inject(Merchant);
  private readonly navigation = inject(Navigation);
  private readonly sound = inject(Sound);
  protected readonly footprintsImage = MERCHANT_IMAGES.footprints;
  private readonly dismissed = signal<string | null>(null);

  protected readonly hint = computed<Hint | null>(() => {
    if (!this.merchant.unlocked()) {
      return null;
    }
    const phase = this.merchant.phase();
    let hint: Hint | null = null;
    if (phase.kind === 'coming') {
      hint = comingHint(phase.daysLeft);
    } else if (phase.kind === 'here') {
      hint = phase.lastDay
        ? { key: 'last', text: 'Le marchand remballe ses affaires… dernière chance !', open: true, footprints: false }
        : { key: 'here', text: 'Le marchand nain est arrivé avec sa mule !', open: true, footprints: false };
    }
    return hint !== null && hint.key !== this.dismissed() ? hint : null;
  });

  constructor() {
    // Les clochettes, deux jours avant : un tintement discret au moment où l'indice apparaît
    effect(() => {
      if (this.hint()?.key === 'bells') {
        untracked(() => this.sound.play('shard'));
      }
    });
  }

  protected act(hint: Hint): void {
    if (hint.open) {
      this.navigation.open('merchant');
    } else {
      this.dismissed.set(hint.key);
    }
  }

  protected dismiss(hint: Hint, event: Event): void {
    event.stopPropagation();
    this.dismissed.set(hint.key);
  }
}

function comingHint(daysLeft: number): Hint {
  if (daysLeft >= 4) {
    return { key: 'rumour', text: 'Un vieux mineur parle d\'un marchand qui sillonne les galeries…', open: false, footprints: false };
  }
  if (daysLeft === 3) {
    return { key: 'footprints', text: 'Des traces de pas de nain, toutes fraîches dans la poussière…', open: false, footprints: true };
  }
  if (daysLeft === 2) {
    return { key: 'bells', text: 'Des clochettes de mule tintent au loin…', open: false, footprints: false };
  }
  return { key: 'lantern', text: 'Une lanterne vacille au fond de la galerie… quelqu\'un approche.', open: false, footprints: false };
}
