import { Component, computed, inject } from '@angular/core';

import { Sound } from '../../audio/sound';
import { tierZone, WORKSHOP_MAX_LEVEL, WORKSHOP_STEP, workshopMaterial } from '../../balance/workshop';
import { SLOT_IDS, SLOTS, STATS, SlotId, TIER_LABELS } from '../../equipment/equipment.model';
import { itemIconUrl, materialIconUrl } from '../../loading/game-assets';
import { Navigation } from '../../navigation/navigation';
import { Ores } from '../../ores/ores';
import { Progression } from '../../progression/progression';
import { Wallet } from '../../wallet/wallet';
import { UpgradeCheck, Workshop } from '../workshop';

const PERCENT = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });
const COMPACT = new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 });

const BLOCKED_TEXT: Readonly<Record<Exclude<UpgradeCheck, 'ok'>, string>> = {
  locked: 'Atelier fermé',
  empty: 'Aucune pièce portée',
  max: 'Niveau maximum',
  gold: 'Pas assez d\'or',
  ores: 'Pas assez de minerai',
};

/** Atelier : la pièce portée de chaque emplacement se renforce dans sa qualité, niveau par niveau jusqu'à 50. */
@Component({
  selector: 'app-workshop-page',
  templateUrl: './workshop-page.html',
  styleUrl: './workshop-page.scss',
})
export class WorkshopPage {
  protected readonly workshop = inject(Workshop);
  private readonly wallet = inject(Wallet);
  private readonly ores = inject(Ores);
  private readonly progression = inject(Progression);
  private readonly navigation = inject(Navigation);
  private readonly sound = inject(Sound);

  protected readonly maxLevel = WORKSHOP_MAX_LEVEL;
  protected readonly coins = computed(() => COMPACT.format(this.wallet.coins()));

  protected readonly rows = computed(() =>
    SLOT_IDS.map((slot) => {
      const tier = this.workshop.tier(slot);
      const level = this.workshop.level(slot);
      const cost = this.workshop.cost(slot);
      const check = this.workshop.check(slot);
      const stat = STATS[SLOTS[slot].workshopStat].label;
      const material = tier === null ? null : workshopMaterial(tier);
      return {
        slot,
        tier,
        label: tier === null ? SLOTS[slot].label : `${SLOTS[slot].label} · ${TIER_LABELS[tier]}`,
        icon: itemIconUrl(slot, tier, SLOTS[slot].iconUrl),
        level,
        effect: `+${PERCENT.format(level * WORKSHOP_STEP * 100)} % de ${stat}`,
        next: level < WORKSHOP_MAX_LEVEL ? `+${PERCENT.format((level + 1) * WORKSHOP_STEP * 100)} %` : null,
        gold: cost === null ? null : COMPACT.format(cost.gold),
        ore:
          cost === null || material === null
            ? null
            : {
                icon: materialIconUrl(material),
                need: cost.ores[material] ?? 0,
                stock: this.ores.stock()[material],
                // Zone où se mine ce minerai : on peut y revenir si elle est déjà terminée
                zone: tierZone(material),
                canFarm: tierZone(material) < this.progression.zone() && tierZone(material) !== this.progression.farmZone(),
              },
        check,
        blocked: check === 'ok' ? null : BLOCKED_TEXT[check],
      };
    }),
  );

  /** Revient miner le minerai qui manque, dans sa zone. */
  protected farm(zone: number): void {
    if (this.progression.startFarm(zone)) {
      this.navigation.open('mine');
    }
  }

  protected upgrade(slot: SlotId): void {
    if (this.workshop.upgrade(slot)) {
      this.sound.play('upgrade');
    }
  }

  protected close(): void {
    this.navigation.open('mine');
  }
}
