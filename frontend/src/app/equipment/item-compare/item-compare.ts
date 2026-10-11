import { Component, computed, inject } from '@angular/core';

import { Item, SLOTS, STATS, TIER_LABELS } from '../equipment.model';
import { formatStat, formatStatDelta } from '../equipment-format';
import { compareItems, powerDelta, sellPrice } from '../equipment-rules';
import { Inventory } from '../inventory';

type Trend = 'better' | 'worse' | 'same';

@Component({
  selector: 'app-item-compare',
  templateUrl: './item-compare.html',
  styleUrl: './item-compare.scss',
})
export class ItemCompare {
  protected readonly inventory = inject(Inventory);

  /** Tout ce que la fenêtre affiche, ou null quand aucun objet n'attend. */
  protected readonly view = computed(() => {
    const candidate = this.inventory.pending();
    if (candidate === null) {
      return null;
    }
    const equipped = this.inventory.equipped();
    const current = equipped[candidate.slot];
    const delta = powerDelta(equipped, candidate);
    return {
      power: this.inventory.power() + delta,
      powerDelta: delta,
      powerTrend: trendOf(delta),
      slot: SLOTS[candidate.slot],
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
      replacedSellPrice: current ? sellPrice(current) : null,
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
