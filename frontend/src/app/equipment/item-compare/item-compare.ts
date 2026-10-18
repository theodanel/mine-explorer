import { Component, computed, effect, inject } from '@angular/core';

import { Overlays } from '../../shared/overlays';
import { Sound } from '../../audio/sound';
import { itemIconUrl } from '../../loading/game-assets';
import { CLOCK } from '../../shared/clock';
import { EquippedItems, Item, SLOTS, STATS, TIER_LABELS } from '../equipment.model';
import { formatStat, formatStatDelta } from '../equipment-format';
import { compareItems, computePower, sellPrice } from '../equipment-rules';
import { reinforce } from '../../workshop/workshop-rules';
import { Workshop } from '../../workshop/workshop';
import { Inventory } from '../inventory';

type Trend = 'better' | 'worse' | 'same';

/**
 * Sur mobile, le joueur tape souvent la Forge deux fois de suite : le second appui tombait sur le fond
 * de la fenêtre qui venait de s'ouvrir et la refermait aussitôt. Le fond ignore les appuis juste après l'ouverture,
 * et ne ferme que sur un appui commencé sur lui : un clic fantôme, que certains navigateurs mobiles rejouent
 * après un toucher, n'a pas d'appui avant lui et ne ferme donc rien.
 */
const BACKDROP_GRACE_MS = 500;

@Component({
  selector: 'app-item-compare',
  templateUrl: './item-compare.html',
  styleUrl: './item-compare.scss',
})
export class ItemCompare {
  protected readonly inventory = inject(Inventory);
  private readonly clock = inject(CLOCK);
  private readonly sound = inject(Sound);
  private readonly overlays = inject(Overlays);
  private readonly workshop = inject(Workshop);
  /** Montrée seulement à son tour : sur la mine, sans autre fenêtre ouverte. */
  private readonly visible = this.overlays.isShown('itemCompare');
  private openedAt = 0;
  private backdropPressedAt: number | null = null;

  constructor() {
    this.overlays.register('itemCompare', this.inventory.reviewing);
    // Lire l'identifiant fait repartir le délai pour chaque nouvel objet, même si la fenêtre ne s'est pas fermée entre-temps
    effect(() => {
      const shownId = this.visible() ? this.inventory.pending()?.id : undefined;
      if (shownId !== undefined) {
        this.openedAt = this.clock();
      }
    });
  }

  protected sell(): void {
    this.inventory.sellPending();
    this.sound.play('sell');
  }

  protected pressBackdrop(event: PointerEvent): void {
    this.backdropPressedAt = event.target === event.currentTarget ? this.clock() : null;
  }

  protected closeFromBackdrop(event: MouseEvent): void {
    const pressedAt = this.backdropPressedAt;
    this.backdropPressedAt = null;
    if (event.target !== event.currentTarget || pressedAt === null || pressedAt - this.openedAt < BACKDROP_GRACE_MS) {
      return;
    }
    this.inventory.closeReview();
  }

  private gearPower(equipped: EquippedItems): number {
    return computePower(reinforce(this.inventory.statsOf(equipped), this.workshop.levels(), equipped));
  }

  /** Tout ce que la fenêtre affiche, ou null quand aucun objet n'attend. */
  protected readonly view = computed(() => {
    const candidate = this.inventory.pending();
    if (candidate === null || !this.visible()) {
      return null;
    }
    const equipped = this.inventory.equipped();
    const current = equipped[candidate.slot];
    // Puissance de l'équipement, Atelier compris : une pièce d'une autre qualité n'a pas les mêmes niveaux
    const powerBefore = this.gearPower(equipped);
    const power = this.gearPower({ ...equipped, [candidate.slot]: candidate });
    const delta = power - powerBefore;
    return {
      isPrevious: this.inventory.pendingWasEquipped(),
      powerBefore,
      power,
      powerDelta: delta,
      powerTrend: trendOf(delta),
      slot: SLOTS[candidate.slot],
      iconUrl: itemIconUrl(candidate.slot, candidate.tier, SLOTS[candidate.slot].iconUrl),
      current: current ? describeItem(current) : null,
      candidate: describeItem(candidate),
      rows: compareItems(current, candidate).map(({ stat, current: before, candidate: after }) => ({
        stat,
        label: STATS[stat].label,
        current: formatStat(stat, before),
        candidate: formatStat(stat, after),
        delta: formatStatDelta(stat, after - before),
        trend: trendOf(after - before),
      })),
      sellPrice: sellPrice(candidate),
    };
  });
}

function describeItem(item: Item): { tier: string; tierLabel: string; level: number } {
  return { tier: item.tier, tierLabel: TIER_LABELS[item.tier], level: item.level };
}

function trendOf(delta: number): Trend {
  if (delta > 0) {
    return 'better';
  }
  return delta < 0 ? 'worse' : 'same';
}
