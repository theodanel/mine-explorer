import { Component, computed, inject } from '@angular/core';

import { Sound } from '../../audio/sound';
import { CRYSTAL_RAIN_COUNT, GEODE_TAPS, MineEventId } from '../../balance/mine-events';
import { TIER_LABELS } from '../../equipment/equipment.model';
import { EVENT_IMAGES } from '../../loading/game-assets';
import { MineEvents } from '../mine-events';
import { compactNumber } from '../../shared/format-number';


/** Écart entre la chute de deux cristaux de la pluie. */
const CRYSTAL_STAGGER_MS = 900;

/** Image montrée avec le butin : ce que l'événement est devenu une fois réussi. */
const LOOT_ICONS: Readonly<Record<MineEventId, string>> = {
  giantGeode: EVENT_IMAGES.geode[3],
  buriedChest: EVENT_IMAGES.chestOpen,
  thiefRat: EVENT_IMAGES.coinSack,
  crystalRain: EVENT_IMAGES.crystal,
};

/** Géode fermée, fissurée, très fissurée : elle se fend un peu plus à chaque coup. */
function geodeImage(taps: number): string {
  const stage = Math.min(Math.floor((taps / GEODE_TAPS) * 3), 2);
  return EVENT_IMAGES.geode[stage];
}

/** Les événements de mine par-dessus la galerie, avec les visuels de la planche 6 et le rat voleur. */
@Component({
  selector: 'app-mine-event-layer',
  templateUrl: './mine-event-layer.html',
  styleUrl: './mine-event-layer.scss',
})
export class MineEventLayer {
  private readonly events = inject(MineEvents);
  private readonly sound = inject(Sound);
  protected readonly images = EVENT_IMAGES;

  protected readonly event = computed(() => {
    const event = this.events.active();
    if (event === null) {
      return null;
    }
    return {
      ...event,
      left: `${Math.round(event.x * 100)}%`,
      duration: `${event.lifetimeMs}ms`,
      tapsLeft: GEODE_TAPS - event.taps,
      geodeImage: geodeImage(event.taps),
      crystals: event.crystals.map((left, index) => ({
        index,
        left,
        x: `${Math.round(((index + 1) / (CRYSTAL_RAIN_COUNT + 1)) * 100)}%`,
        delay: `${index * CRYSTAL_STAGGER_MS}ms`,
      })),
    };
  });

  /** Le butin s'affiche un instant ; la liste à un élément rejoue l'animation à chaque nouveau butin. */
  protected readonly loot = computed(() => {
    const loot = this.events.loot();
    if (loot === null) {
      return [];
    }
    const parts: string[] = [];
    if (loot.gold > 0) {
      parts.push(`+${compactNumber(loot.gold)} or`);
    }
    if (loot.shards > 0) {
      parts.push(`+${loot.shards} éclat${loot.shards > 1 ? 's' : ''}`);
    }
    if (loot.ore !== null) {
      parts.push(`+${loot.ore.amount} ${TIER_LABELS[loot.ore.tier]}`);
    }
    return [{ key: loot.key, icon: LOOT_ICONS[loot.id], text: parts.join(' · ') }];
  });

  protected tap(crystalIndex = 0): void {
    if (!this.events.tap(crystalIndex)) {
      this.sound.play('strike');
      return;
    }
    const loot = this.events.loot();
    this.sound.play(loot !== null && loot.shards > 0 ? 'shard' : 'sell');
  }
}
