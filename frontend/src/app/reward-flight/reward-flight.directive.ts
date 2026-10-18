import { Directive, ElementRef, inject, input } from '@angular/core';

import { GeodeShards } from '../wallet/geode-shards';
import { Wallet } from '../wallet/wallet';
import { Gains, RewardFlight } from './reward-flight';

interface Balances {
  readonly coins: number;
  readonly shards: number;
}

/**
 * Sur un bouton de récompense : après le clic, ce qui a été gagné s'envole jusqu'aux compteurs. Sans
 * `rewardGains`, le gain est mesuré sur les soldes (avant l'appui, après le clic) : aucun bouton n'a à savoir ce
 * que sa récompense contient, et un clic qui ne donne rien ne fait rien voler.
 */
@Directive({
  selector: '[appRewardFlight]',
  host: {
    '(pointerdown)': 'remember()',
    '(keydown)': 'remember()',
    '(click)': 'fly()',
  },
})
export class RewardFlightDirective {
  /** Gains connus d'avance, quand ils sont déjà crédités avant le clic (rapport d'absence). */
  readonly rewardGains = input<Gains | null>(null);

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly flight = inject(RewardFlight);
  private readonly wallet = inject(Wallet);
  private readonly shards = inject(GeodeShards);
  private before: Balances | null = null;

  protected remember(): void {
    this.before = this.balances();
  }

  protected fly(): void {
    // Le bouton peut disparaître juste après (mission touchée, fenêtre fermée) : sa place est lue tout de suite
    const box = this.element.nativeElement.getBoundingClientRect();
    const origin = { x: box.left + box.width / 2, y: box.top + box.height / 2 };
    const known = this.rewardGains();
    if (known !== null) {
      this.flight.launch(origin, known);
      return;
    }
    const before = this.before;
    this.before = null;
    if (before === null) {
      return;
    }
    // Après tous les gestionnaires du clic, quel que soit leur ordre : la récompense est alors créditée
    setTimeout(() => {
      const after = this.balances();
      this.flight.launch(origin, { coins: after.coins - before.coins, shards: after.shards - before.shards });
    });
  }

  private balances(): Balances {
    return { coins: this.wallet.coins(), shards: this.shards.amount() };
  }
}
