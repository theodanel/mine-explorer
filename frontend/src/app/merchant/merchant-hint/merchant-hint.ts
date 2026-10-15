import { Component, computed, DestroyRef, effect, inject, signal, untracked } from '@angular/core';

import { Sound } from '../../audio/sound';
import { MERCHANT_IMAGES } from '../../loading/game-assets';
import { Navigation } from '../../navigation/navigation';
import { Merchant } from '../merchant';

/** Temps d'affichage d'une bulle sur la mine. */
const HINT_VISIBLE_MS = 6000;

interface Hint {
  readonly key: string;
  readonly text: string;
  /** Le marchand est là : toucher la bulle ouvre son étal. */
  readonly open: boolean;
  readonly footprints: boolean;
}

/**
 * Indices du Marchand nain sur la mine, de plus en plus nets à l'approche : une rumeur, des traces de pas,
 * des clochettes, une lanterne, puis son arrivée et son départ. Chaque bulle ne passe que quelques secondes : la
 * carte des Aventures garde l'information, la mine n'a pas à l'afficher en permanence.
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
  protected readonly merchantImage = MERCHANT_IMAGES.merchant;
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
        ? { key: 'last', text: 'Le marchand remballe, dernier jour', open: true, footprints: false }
        : { key: 'here', text: 'Un marchand est de passage', open: true, footprints: false };
    }
    return hint !== null && hint.key !== this.dismissed() ? hint : null;
  });

  constructor() {
    // La bulle s'efface d'elle-même après quelques secondes
    let timer: ReturnType<typeof setTimeout> | null = null;
    effect(() => {
      const key = this.hint()?.key ?? null;
      if (timer !== null) {
        clearTimeout(timer);
      }
      timer = key === null ? null : setTimeout(() => this.dismissed.set(key), HINT_VISIBLE_MS);
    });
    inject(DestroyRef).onDestroy(() => {
      if (timer !== null) {
        clearTimeout(timer);
      }
    });
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
