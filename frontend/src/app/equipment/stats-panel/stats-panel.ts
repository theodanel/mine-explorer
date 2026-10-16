import { Component, computed, inject } from '@angular/core';

import { damagePerSecond } from '../../balance/balance';

import { SLOTS, STAT_IDS, STATS, StatId } from '../equipment.model';
import { formatStat } from '../equipment-format';
import { Tooltip } from '../../shared/tooltip/tooltip';
import { Miner } from '../../miner/miner';

/** Chaque stat reprend l'icône de l'équipement qui la donne, pour relier les deux d'un coup d'œil. */
const STAT_ICONS: Readonly<Record<StatId, string>> = {
  strikePower: SLOTS.pickaxe.iconUrl,
  miningSpeed: SLOTS.boots.iconUrl,
  critChance: SLOTS.gloves.iconUrl,
  critDamage: SLOTS.helmet.iconUrl,
  goldBonus: SLOTS.bag.iconUrl,
};
const DPS_FORMAT = new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 });

@Component({
  selector: 'app-stats-panel',
  imports: [Tooltip],
  templateUrl: './stats-panel.html',
  styleUrl: './stats-panel.scss',
})
export class StatsPanel {
  private readonly miner = inject(Miner);

  protected readonly dps = computed(() => DPS_FORMAT.format(damagePerSecond(this.miner.current().stats)));
  /** Un sort en cours gonfle les dégâts : la ligne s'allume pour le montrer. */
  protected readonly dpsBoosted = computed(
    () => damagePerSecond(this.miner.current().stats) > damagePerSecond(this.miner.permanent().stats),
  );

  protected readonly stats = computed(() => {
    const stats = this.miner.current().stats;
    const permanent = this.miner.permanent().stats;
    return STAT_IDS.map((stat) => ({
      boosted: stats[stat] > permanent[stat],
      stat,
      label: STATS[stat].label,
      description: STATS[stat].description,
      iconUrl: STAT_ICONS[stat],
      value: formatStat(stat, stats[stat]),
    }));
  });
}
