import { Component, inject, signal } from '@angular/core';

import { LOTTERY_ICON } from '../../loading/game-assets';
import { Lottery } from '../lottery';
import { LotteryDialog } from '../lottery-dialog/lottery-dialog';

/** Icône de la loterie sur la mine, à droite du bandeau de zone : elle sautille tant que le tirage du jour attend. */
@Component({
  selector: 'app-lottery-button',
  imports: [LotteryDialog],
  templateUrl: './lottery-button.html',
  styleUrl: './lottery-button.scss',
})
export class LotteryButton {
  protected readonly lottery = inject(Lottery);
  protected readonly icon = LOTTERY_ICON;
  protected readonly open = signal(false);
}
