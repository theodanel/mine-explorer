import { inject, Injectable, signal } from '@angular/core';

import { ARTIFACT_FIND_CHANCE, ARTIFACTS_UNLOCK_ZONE } from '../balance/artifacts';
import { ORE_FIND_CHANCE, ZONE_CLEAR_ORES, zoneMaterial } from '../balance/balance';
import { SpellId } from '../balance/skill-tree';
import { ASTRE_ECHO_BONUS_CHANCE, ASTRE_GUARDIAN_STRIKES, ASTRE_STRIKE_SHARE } from '../balance/astre';
import { Artifacts } from '../artifacts/artifacts';
import { Companions } from '../companions/companions';
import { HitResult, resolveHit } from '../equipment/equipment-rules';
import { TierId } from '../equipment/equipment.model';
import { Galleries } from '../galleries/galleries';
import { scaleAmount } from '../galleries/gallery-rules';
import { Miner } from '../miner/miner';
import { MissionCounters } from '../missions/mission-counters';
import { Ores } from '../ores/ores';
import { Progression } from '../progression/progression';
import { Rebirth } from '../rebirth/rebirth';
import { RANDOM } from '../shared/random';
import { GeodeShards } from '../wallet/geode-shards';
import { Wallet } from '../wallet/wallet';
import { HeartForge } from '../heart-forge/heart-forge';
import { StrikeReward, strikeReward } from './mining-rules';
import type { EssenceId } from '../balance/heart-forge';
import { echoEssence } from '../heart-forge/heart-forge-rules';
import { Echoes } from '../heart-forge/echoes';

export interface StrikeOutcome extends HitResult {
  readonly reward: StrikeReward;
  /** Le filon a cédé sous ce coup. */
  readonly rockBroken: boolean;
  /** Zone terminée par ce coup, ou null. */
  readonly clearedZone: number | null;
  /** Minerai ramassé si le rocher a cassé, ou null. */
  readonly ore: { readonly tier: TierId; readonly amount: number } | null;
  /** Ressource du Cœur ramassée sur un filon d'Écho épuisé, ou null. */
  readonly essence: EssenceId | null;
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
  private readonly companions = inject(Companions);
  private readonly heartForge = inject(HeartForge);
  private readonly rebirth = inject(Rebirth);

  constructor() {
    // Les Échos doivent veiller dès le lancement : une zone passée ouverte avant la Légende devient son Écho
    inject(Echoes);
  }
  private readonly lastBlast = signal<BlastEvent | null>(null);
  private blastCount = 0;

  readonly blasts = this.lastBlast.asReadonly();

  strike(): StrikeOutcome {
    const profile = this.miner.current();
    const hit = resolveHit(profile.stats, this.random);
    const foundShard = this.random() < profile.shardChance * this.galleries.modifiers().shards;
    const foundOre = this.random() < ORE_FIND_CHANCE * this.galleries.modifiers().ores;
    if (this.artifacts.unlocked() && this.random() < ARTIFACT_FIND_CHANCE) {
      this.artifacts.discover();
    }
    return this.dealDamage(hit, foundShard, foundOre);
  }

  /** Coup de l'Astre du Cœur, qui frappe avec le mineur : une part de sa Frappe selon son stade, ou null s'il dort. */
  astreStrike(): StrikeOutcome | null {
    const stage = this.heartForge.astreStage();
    if (stage === 0) {
      return null;
    }
    const damage = Math.round(this.miner.permanent().stats.strikePower * ASTRE_STRIKE_SHARE[stage - 1]);
    return damage > 0 ? this.dealDamage({ damage, critical: false }, false, false) : null;
  }

  /** Pluie d'étoiles de l'Astre (stades 4 et 5) au début d'un combat contre le gardien, ou null avant. */
  astreStarRain(): StrikeOutcome | null {
    const stage = this.heartForge.astreStage();
    const strikes = stage === 0 ? 0 : ASTRE_GUARDIAN_STRIKES[stage - 1];
    if (strikes === 0) {
      return null;
    }
    return this.dealDamage({ damage: Math.round(this.miner.permanent().stats.strikePower * strikes), critical: false }, false, false);
  }

  /** Explosion d'un sort : un multiple de la Frappe permanente, sans critique ni trouvaille au hasard. */
  blast(spell: SpellId, strikeMultiplier: number): StrikeOutcome {
    const damage = Math.round(this.miner.permanent().stats.strikePower * strikeMultiplier * this.galleries.modifiers().blast);
    const outcome = this.dealDamage({ damage, critical: false }, false, false);
    this.lastBlast.set({ id: ++this.blastCount, spell, outcome });
    return outcome;
  }

  private dealDamage(hit: HitResult, foundShard: boolean, foundOre: boolean): StrikeOutcome {
    const { zone: frontier, stage } = this.progression.progress();
    const zone = this.progression.playingZone();
    const gallery = this.galleries.modifiers();
    // Une galerie plus dure encaisse moins de chaque coup ; l'or reste calculé sur les dégâts du coup
    const struck = this.progression.hit(scaleAmount(hit.damage, 1 / gallery.hardness, this.random));
    const { rockBroken, clearedZone, farming } = struck;
    // Les filons sans fin d'une zone passée ne comptent pas pour les missions ni le Défi : trop faciles à enchaîner
    if (rockBroken && !farming) {
      this.missionCounters.record('rocksBroken');
    }
    // Un filon d'Écho donne sa ressource, sans tirage
    const essence = rockBroken && struck.echoZone !== null ? echoEssence(struck.echoZone) : null;
    if (essence !== null && struck.echoZone !== null) {
      // L'Astre (dès le stade 2) ramasse parfois une ressource de plus
      const stage = this.heartForge.astreStage();
      const astreBonus = stage > 0 && this.random() < ASTRE_ECHO_BONUS_CHANCE[stage - 1] ? 1 : 0;
      this.heartForge.onEchoRock(struck.echoZone, this.rebirth.effects().essencesPerRock + astreBonus);
    }
    // Minerai de la zone frappée (celle qu'on vient de finir si ce coup fait passer à la suivante) :
    // parfois un au coup de pioche, plus le lot de fin de zone
    let ore: StrikeOutcome['ore'] = null;
    const tier = zoneMaterial(zone);
    const amount = (foundOre ? 1 : 0) + (clearedZone !== null ? scaleAmount(ZONE_CLEAR_ORES, gallery.ores, this.random) : 0);
    if (tier !== null && amount > 0) {
      ore = { tier, amount };
      this.ores.add(tier, amount);
    }
    if (clearedZone !== null) {
      // Chaque zone terminée livre un artefact, dès celle qui ouvre l'onglet : la découverte récompense le cap franchi
      if (clearedZone + 1 >= ARTIFACTS_UNLOCK_ZONE) {
        this.artifacts.discover();
      }
      this.galleries.offerFor(clearedZone + 1);
      this.companions.grantZoneEggs(clearedZone);
    }
    // En zone passée, seuls les PV vraiment minés rapportent de l'or, et un filon épuisé ne donne pas d'éclats
    const baseReward = strikeReward(farming ? struck.mined : hit.damage, this.miner.current().stats.goldBonus, {
      zone: farming ? zone : frontier,
      stage,
      stageCleared: rockBroken && !farming,
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
    return { ...hit, reward, rockBroken, clearedZone, ore, essence };
  }
}
