import { Injectable } from '@angular/core';

import { StoredCounter } from '../shared/stored-counter';

/** Éclats de géode : ressource rare qui paye la Forge, pour que l'or seul ne suffise pas à forger sans fin. */
@Injectable({ providedIn: 'root' })
export class GeodeShards extends StoredCounter {
  constructor() {
    super('mine-explorer.geode-shards');
  }
}
