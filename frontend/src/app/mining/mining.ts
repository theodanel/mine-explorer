import { inject, Injectable } from '@angular/core';

import { HitResult, resolveHit } from '../equipment/equipment-rules';
import { Inventory } from '../equipment/inventory';
import { Progression } from '../progression/progression';
import { readStorage, writeStorage } from '../shared/local-storage';
import { RANDOM } from '../shared/random';
import { GeodeShards } from '../wallet/geode-shards';
import { Wallet } from '../wallet/wallet';
import { mineForShards, StrikeReward, strikeReward } from './mining-rules';

const SHARD_TIMER_KEY = 'mine-explorer.shard-timer';

export interface StrikeOutcome extends HitResult {
  readonly reward: StrikeReward;
  /** Zone terminée par ce coup, ou null. */
  readonly clearedZone: number | null;
}

/**
 * Un coup de pioche du point de vue des règles : la scène l'anime, ce service en applique les effets.
 * Garder ça hors de la scène permet de le tester sans canvas et de le déplacer côté serveur plus tard.
 */
@Injectable({ providedIn: 'root' })
export class Mining {
  private readonly inventory = inject(Inventory);
  private readonly progression = inject(Progression);
  private readonly wallet = inject(Wallet);
  private readonly shards = inject(GeodeShards);
  private readonly random = inject(RANDOM);
  private shardCarryMs = loadShardCarry();

  strike(): StrikeOutcome {
    const stats = this.inventory.stats();
    const hit = resolveHit(stats, this.random);
    const { clearedZone } = this.progression.hit(hit.damage);
    const reward = strikeReward(hit.damage, stats.goldBonus, clearedZone !== null);
    if (reward.gold > 0) {
      this.wallet.add(reward.gold);
    }
    if (reward.shards > 0) {
      this.shards.add(reward.shards);
    }
    return { ...hit, reward, clearedZone };
  }

  /** Compte le temps de minage actif. Renvoie les éclats trouvés dans les filons pendant ce temps. */
  mineFor(elapsedMs: number): number {
    const { shards, carryMs } = mineForShards(this.shardCarryMs, elapsedMs);
    this.shardCarryMs = carryMs;
    if (shards > 0) {
      this.shards.add(shards);
      writeStorage(SHARD_TIMER_KEY, String(Math.round(carryMs)));
    }
    return shards;
  }
}

function loadShardCarry(): number {
  const value = Number(readStorage(SHARD_TIMER_KEY) ?? 0);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}
