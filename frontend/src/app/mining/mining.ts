import { inject, Injectable, signal } from '@angular/core';

import { ARTIFACT_FIND_CHANCE } from '../balance/artifacts';
import { ORE_PER_ROCK, ZONE_CLEAR_ORES, zoneMaterial } from '../balance/balance';
import { SpellId } from '../balance/skill-tree';
import { Artifacts } from '../artifacts/artifacts';
import { HitResult, resolveHit } from '../equipment/equipment-rules';
import { TierId } from '../equipment/equipment.model';
import { Galleries } from '../galleries/galleries';
import { scaleAmount } from '../galleries/gallery-rules';
import { Miner } from '../miner/miner';
import { MissionCounters } from '../missions/mission-counters';
import { Ores } from '../ores/ores';
import { Progression } from '../progression/progression';
import { RANDOM } from '../shared/random';
import { GeodeShards } from '../wallet/geode-shards';
import { Wallet } from '../wallet/wallet';
import { StrikeReward, strikeReward } from './mining-rules';

export interface StrikeOutcome extends HitResult {
  readonly reward: StrikeReward;
  /** Le filon a cédé sous ce coup. */
  readonly rockBroken: boolean;
  /** Zone terminée par ce coup, ou null. */
  readonly clearedZone: number | null;
  /** Minerai ramassé si le rocher a cassé, ou null. */
  readonly ore: { readonly tier: TierId; readonly amount: number } | null;
}

/** Explosion d'un sort, pour que la scène l'affiche. `id` change à chaque explosion, même identique. */
export interface BlastEvent {
  readonly id: number;
  readonly spell: SpellId;
  readonly outcome: StrikeOutcome;
}

/**
 * Un coup de pioche du point de vue des règles : la scène l'anime, ce service en applique les effets.
 * Garder ça hors de la scène permet de le tester sans canvas et de le déplacer côté serveur plus tard.
 */
@Injectable({ providedIn: 'root' })
export class Mining {
  private readonly miner = inject(Miner);
  private readonly progression = inject(Progression);
  private readonly wallet = inject(Wallet);
  private readonly shards = inject(GeodeShards);
  private readonly random = inject(RANDOM);
  private readonly missionCounters = inject(MissionCounters);
  private readonly ores = inject(Ores);
  private readonly artifacts = inject(Artifacts);
  private readonly galleries = inject(Galleries);
  private readonly lastBlast = signal<BlastEvent | null>(null);
  private blastCount = 0;

  readonly blasts = this.lastBlast.asReadonly();

  strike(): StrikeOutcome {
    const profile = this.miner.current();
    const hit = resolveHit(profile.stats, this.random);
    const foundShard = this.random() < profile.shardChance * this.galleries.modifiers().shards;
    if (this.random() < ARTIFACT_FIND_CHANCE) {
      this.artifacts.discover();
    }
    return this.dealDamage(hit, foundShard);
  }

  /** Explosion d'un sort : un multiple de la Frappe permanente, sans critique ni trouvaille au hasard. */
  blast(spell: SpellId, strikeMultiplier: number): StrikeOutcome {
    const damage = Math.round(this.miner.permanent().stats.strikePower * strikeMultiplier * this.galleries.modifiers().blast);
    const outcome = this.dealDamage({ damage, critical: false }, false);
    this.lastBlast.set({ id: ++this.blastCount, spell, outcome });
    return outcome;
  }

  private dealDamage(hit: HitResult, foundShard: boolean): StrikeOutcome {
    const { zone, stage } = this.progression.progress();
    const gallery = this.galleries.modifiers();
    // Une galerie plus dure encaisse moins de chaque coup ; l'or reste calculé sur les dégâts du coup
    const { rockBroken, clearedZone } = this.progression.hit(scaleAmount(hit.damage, 1 / gallery.hardness, this.random));
    let ore: StrikeOutcome['ore'] = null;
    if (rockBroken) {
      this.missionCounters.record('rocksBroken');
      // Le minerai est celui de la zone où le filon a été épuisé, même si ce coup fait passer à la suivante
      const tier = zoneMaterial(zone);
      if (tier !== null) {
        ore = { tier, amount: scaleAmount(ORE_PER_ROCK + (clearedZone !== null ? ZONE_CLEAR_ORES : 0), gallery.ores, this.random) };
        this.ores.add(ore.tier, ore.amount);
      }
    }
    if (clearedZone !== null) {
      // Chaque zone terminée livre un artefact : la découverte récompense le cap franchi
      this.artifacts.discover();
      this.galleries.offerFor(clearedZone + 1);
    }
    const baseReward = strikeReward(hit.damage, this.miner.current().stats.goldBonus, {
      zone,
      stage,
      stageCleared: rockBroken,
      zoneCleared: clearedZone !== null,
      foundShard,
    });
    const reward = { ...baseReward, gold: Math.round(baseReward.gold * gallery.gold) };
    if (reward.gold > 0) {
      this.wallet.add(reward.gold);
    }
    if (reward.shards > 0) {
      this.shards.add(reward.shards);
    }
    return { ...hit, reward, rockBroken, clearedZone, ore };
  }
}
