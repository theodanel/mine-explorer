import { Component, computed, inject } from '@angular/core';

import { damagePerSecond } from '../../balance/balance';

import { SLOTS, STAT_IDS, STATS, StatId } from '../equipment.model';
import { formatStat } from '../equipment-format';
import { Inventory } from '../inventory';

/** Chaque stat reprend l'icône de l'équipement qui la donne, pour relier les deux d'un coup d'œil. */
const STAT_ICONS: Readonly<Record<StatId, string>> = {
  strikePower: SLOTS.pickaxe.iconUrl,
  miningSpeed: SLOTS.boots.iconUrl,
  critChance: SLOTS.gloves.iconUrl,
  critDamage: SLOTS.helmet.iconUrl,
  goldBonus: SLOTS.bag.iconUrl,
};
const DPS_FORMAT = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });

@Component({
  selector: 'app-stats-panel',
  templateUrl: './stats-panel.html',
  styleUrl: './stats-panel.scss',
})
export class StatsPanel {
  private readonly inventory = inject(Inventory);

  protected readonly dps = computed(() => DPS_FORMAT.format(damagePerSecond(this.inventory.stats())));

  protected readonly stats = computed(() => {
    const stats = this.inventory.stats();
    return STAT_IDS.map((stat) => ({
      stat,
      label: STATS[stat].label,
      iconUrl: STAT_ICONS[stat],
      value: formatStat(stat, stats[stat]),
    }));
  });
}
