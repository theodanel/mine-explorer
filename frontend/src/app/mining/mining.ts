import { inject, Injectable } from '@angular/core';

import { ORE_PER_ROCK, ZONE_CLEAR_ORES, zoneMaterial } from '../balance/balance';
import { HitResult, resolveHit } from '../equipment/equipment-rules';
import { TierId } from '../equipment/equipment.model';
import { Inventory } from '../equipment/inventory';
import { MissionCounters } from '../missions/mission-counters';
import { Ores } from '../ores/ores';
import { Progression } from '../progression/progression';
import { RANDOM } from '../shared/random';
import { GeodeShards } from '../wallet/geode-shards';
import { Wallet } from '../wallet/wallet';
import { StrikeReward, strikeReward } from './mining-rules';

export interface StrikeOutcome extends HitResult {
  readonly reward: StrikeReward;
  /** Zone terminée par ce coup, ou null. */
  readonly clearedZone: number | null;
  /** Minerai ramassé si le rocher a cassé, ou null. */
  readonly ore: { readonly tier: TierId; readonly amount: number } | null;
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
  private readonly missionCounters = inject(MissionCounters);
  private readonly ores = inject(Ores);

  strike(): StrikeOutcome {
    const stats = this.inventory.stats();
    const hit = resolveHit(stats, this.random);
    const zone = this.progression.zone();
    const { rockBroken, clearedZone } = this.progression.hit(hit.damage);
    let ore: StrikeOutcome['ore'] = null;
    if (rockBroken) {
      this.missionCounters.record('rocksBroken');
      // Le minerai est celui de la zone où le rocher a cassé, même si ce coup fait passer à la suivante
      ore = { tier: zoneMaterial(zone), amount: ORE_PER_ROCK + (clearedZone !== null ? ZONE_CLEAR_ORES : 0) };
      this.ores.add(ore.tier, ore.amount);
    }
    const reward = strikeReward(hit.damage, stats.goldBonus, clearedZone !== null);
    if (reward.gold > 0) {
      this.wallet.add(reward.gold);
    }
    if (reward.shards > 0) {
      this.shards.add(reward.shards);
    }
    return { ...hit, reward, clearedZone, ore };
  }
}
