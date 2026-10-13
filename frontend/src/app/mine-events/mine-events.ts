import { DestroyRef, DOCUMENT, inject, Injectable, signal } from '@angular/core';

import { zoneMaterial } from '../balance/balance';
import { Rarity } from '../balance/skill-tree';
import { CRYSTAL_RAIN_COUNT, EVENT_LIFETIME_MS, GEODE_TAPS, MineEventId } from '../balance/mine-events';
import { Companions } from '../companions/companions';
import { TierId } from '../equipment/equipment.model';
import { Miner } from '../miner/miner';
import { Navigation } from '../navigation/navigation';
import { Ores } from '../ores/ores';
import { Progression } from '../progression/progression';
import { CLOCK } from '../shared/clock';
import { RANDOM } from '../shared/random';
import { GeodeShards } from '../wallet/geode-shards';
import { Wallet } from '../wallet/wallet';
import { eventGain, nextEventDelayMs, rollEventId } from './mine-event-rules';

/** À gauche ou à droite du mineur, jamais devant lui : de 0,12 à 0,27 ou de 0,73 à 0,88. */
function sidePosition(roll: number): number {
  return roll < 0.5 ? 0.12 + roll * 0.3 : 0.58 + roll * 0.3;
}

/** Rythme du compte à rebours : assez fin pour un délai de quelques minutes, sans coûter quoi que ce soit. */
const TICK_MS = 500;

export interface ActiveEvent {
  /** Change à chaque événement, pour que l'affichage reparte de zéro. */
  readonly key: number;
  readonly id: MineEventId;
  readonly spawnedAt: number;
  readonly lifetimeMs: number;
  /** Touchers déjà donnés à la géode. */
  readonly taps: number;
  /** Cristaux de la pluie encore à attraper, par index. */
  readonly crystals: readonly boolean[];
  /** Position horizontale dans la galerie, de 0 (gauche) à 1 (droite). */
  readonly x: number;
}

export interface EventLoot {
  readonly key: number;
  readonly id: MineEventId;
  /** Œuf de compagnon trouvé dans le coffre, ou null. */
  readonly egg: Rarity | null;
  readonly gold: number;
  readonly shards: number;
  readonly ore: { readonly tier: TierId; readonly amount: number } | null;
}

/**
 * Événements de mine : toutes les 2 à 4 minutes de jeu actif, quelque chose apparaît dans la galerie.
 * Le compte à rebours ne tourne que quand la mine est affichée et l'onglet visible. Ignorer un événement
 * ne fait rien perdre : il disparaît simplement.
 */
@Injectable({ providedIn: 'root' })
export class MineEvents {
  private readonly document = inject(DOCUMENT);
  private readonly clock = inject(CLOCK);
  private readonly random = inject(RANDOM);
  private readonly navigation = inject(Navigation);
  private readonly miner = inject(Miner);
  private readonly wallet = inject(Wallet);
  private readonly shards = inject(GeodeShards);
  private readonly ores = inject(Ores);
  private readonly progression = inject(Progression);
  private readonly companions = inject(Companions);

  private readonly activeState = signal<ActiveEvent | null>(null);
  private readonly lootState = signal<EventLoot | null>(null);
  private activeMs = 0;
  private nextDelayMs: number;
  private lastTick: number;
  private count = 0;
  private lootCount = 0;

  readonly active = this.activeState.asReadonly();
  /** Dernier butin, pour l'afficher un instant au-dessus de la galerie. */
  readonly loot = this.lootState.asReadonly();

  constructor() {
    this.nextDelayMs = nextEventDelayMs(this.random);
    this.lastTick = this.clock();
    const timer = setInterval(() => this.tick(), TICK_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  /** Avance le compte à rebours. Public pour les tests, appelé par le minuteur en jeu. */
  tick(): void {
    const now = this.clock();
    const elapsed = now - this.lastTick;
    this.lastTick = now;
    const event = this.active();
    if (event !== null) {
      if (now - event.spawnedAt >= event.lifetimeMs) {
        this.activeState.set(null);
      }
      return;
    }
    if (this.document.hidden || this.navigation.page() !== 'mine') {
      return;
    }
    this.activeMs += elapsed;
    if (this.activeMs >= this.nextDelayMs) {
      this.spawn(rollEventId(this.random));
    }
  }

  /** Fait apparaître un événement tout de suite. */
  spawn(id: MineEventId): void {
    this.activeMs = 0;
    this.nextDelayMs = nextEventDelayMs(this.random);
    this.activeState.set({
      key: ++this.count,
      id,
      spawnedAt: this.clock(),
      lifetimeMs: EVENT_LIFETIME_MS[id],
      taps: 0,
      crystals: Array.from({ length: id === 'crystalRain' ? CRYSTAL_RAIN_COUNT : 0 }, () => true),
      x: sidePosition(this.random()),
    });
  }

  /** Touche l'événement. Renvoie vrai si ce toucher a rapporté quelque chose. */
  tap(crystalIndex = 0): boolean {
    const event = this.active();
    if (event === null) {
      return false;
    }
    switch (event.id) {
      case 'giantGeode': {
        const taps = event.taps + 1;
        if (taps < GEODE_TAPS) {
          this.activeState.set({ ...event, taps });
          return false;
        }
        return this.finish(event.id);
      }
      case 'crystalRain': {
        if (!event.crystals[crystalIndex]) {
          return false;
        }
        const crystals = event.crystals.map((left, index) => left && index !== crystalIndex);
        this.collect(event.id);
        this.activeState.set(crystals.some((left) => left) ? { ...event, crystals } : null);
        return true;
      }
      default:
        return this.finish(event.id);
    }
  }

  private finish(id: MineEventId): boolean {
    this.activeState.set(null);
    this.collect(id);
    return true;
  }

  private collect(id: MineEventId): void {
    const gain = eventGain(id, this.miner.permanent().stats);
    if (gain.gold > 0) {
      this.wallet.add(gain.gold);
    }
    if (gain.shards > 0) {
      this.shards.add(gain.shards);
    }
    const tier = zoneMaterial(this.progression.zone());
    const ore = tier !== null && gain.ores > 0 ? { tier, amount: gain.ores } : null;
    if (ore !== null) {
      this.ores.add(ore.tier, ore.amount);
    }
    const egg = id === 'buriedChest' ? this.companions.rollChestEgg() : null;
    this.lootState.set({ key: ++this.lootCount, id, egg, gold: gain.gold, shards: gain.shards, ore });
  }
}
