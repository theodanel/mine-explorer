import { Injectable } from '@angular/core';

import { StoredCounter } from '../shared/stored-counter';

/** Pièces du joueur. Sauvegardées en local pour le MVP, le serveur prendra le relais plus tard. */
@Injectable({ providedIn: 'root' })
export class Wallet extends StoredCounter {
  readonly coins = this.amount;

  constructor() {
    super('mine-explorer.coins');
  }
}
