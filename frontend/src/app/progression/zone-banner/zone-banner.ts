import { Component, computed, inject } from '@angular/core';

import { recommendedPower, secondsToMine } from '../../balance/balance';
import { Inventory } from '../../equipment/inventory';
import { formatDuration } from '../../shared/format-duration';
import { Progression } from '../progression';

const PERCENT = 100;
const MS_PER_SECOND = 1000;
const NUMBER_FORMAT = new Intl.NumberFormat('fr-FR');

@Component({
  selector: 'app-zone-banner',
  templateUrl: './zone-banner.html',
  styleUrl: './zone-banner.scss',
})
export class ZoneBanner {
  protected readonly progression = inject(Progression);
  private readonly inventory = inject(Inventory);

  /** Puissance conseillée pour miner la zone dans le temps visé : le joueur voit pourquoi ça traîne. */
  protected readonly recommended = computed(() => recommendedPower(this.progression.zone()));
  protected readonly strongEnough = computed(() => this.inventory.power() >= this.recommended());
  protected readonly healthPercent = computed(() => Math.round(this.progression.health() * PERCENT));
  protected readonly remaining = computed(() => NUMBER_FORMAT.format(this.progression.remainingHp()));

  /** Temps restant à la Puissance actuelle : c'est lui qui rend le mur visible. */
  protected readonly timeLeft = computed(() =>
    formatDuration(secondsToMine(this.progression.remainingHp(), this.inventory.power()) * MS_PER_SECOND),
  );
}
