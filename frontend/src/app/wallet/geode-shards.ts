import { inject, Injectable } from '@angular/core';

import { Rebirth } from '../rebirth/rebirth';
import { StoredCounter } from '../shared/stored-counter';

/** Éclats de géode : ressource rare qui paye la Forge, pour que l'or seul ne suffise pas à forger sans fin. */
@Injectable({ providedIn: 'root' })
export class GeodeShards extends StoredCounter {
  private readonly rebirth = inject(Rebirth);

  constructor() {
    super('mine-explorer.geode-shards');
  }

  /** Tout éclat gagné profite de la Forge vive de l'arbre des Braises (Renaissance). */
  override add(amount: number): void {
    super.add(Math.round(amount * (1 + this.rebirth.effects().shardBonus)));
  }
}
