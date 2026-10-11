import { Component, inject } from '@angular/core';

import { MineScene } from './mine-scene/mine-scene';
import { Wallet } from './wallet/wallet';

@Component({
  selector: 'app-root',
  imports: [MineScene],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly wallet = inject(Wallet);
}
