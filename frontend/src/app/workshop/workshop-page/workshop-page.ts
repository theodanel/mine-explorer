import { Component, computed, inject } from '@angular/core';

import { Sound } from '../../audio/sound';
import { WORKSHOP_STEP } from '../../balance/workshop';
import { SLOT_IDS, SLOTS, STATS, SlotId, TIER_LABELS } from '../../equipment/equipment.model';
import { materialIconUrl } from '../../loading/game-assets';
import { Navigation } from '../../navigation/navigation';
import { Wallet } from '../../wallet/wallet';
import { UpgradeCheck, Workshop } from '../workshop';

const PERCENT = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });
const COMPACT = new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 });

const BLOCKED_TEXT: Readonly<Record<Exclude<UpgradeCheck, 'ok'>, string>> = {
  locked: 'Atelier fermé',
  gold: 'Pas assez d\'or',
  ores: 'Pas assez de minerai',
};

/** Atelier : chaque emplacement se renforce niveau par niveau, et le bonus reste quand on change d'objet. */
@Component({
  selector: 'app-workshop-page',
  templateUrl: './workshop-page.html',
  styleUrl: './workshop-page.scss',
})
export class WorkshopPage {
  protected readonly workshop = inject(Workshop);
  private readonly wallet = inject(Wallet);
  private readonly navigation = inject(Navigation);
  private readonly sound = inject(Sound);

  protected readonly coins = computed(() => COMPACT.format(this.wallet.coins()));
  protected readonly material = computed(() => {
    const tier = this.workshop.material();
    return { tier, label: TIER_LABELS[tier], icon: materialIconUrl(tier) };
  });

  protected readonly rows = computed(() =>
    SLOT_IDS.map((slot) => {
      const level = this.workshop.level(slot);
      const cost = this.workshop.cost(slot);
      const check = this.workshop.check(slot);
      const stat = STATS[SLOTS[slot].workshopStat].label;
      return {
        slot,
        label: SLOTS[slot].label,
        icon: SLOTS[slot].iconUrl,
        level,
        effect: `+${PERCENT.format(level * WORKSHOP_STEP * 100)} % de ${stat}`,
        next: `+${PERCENT.format((level + 1) * WORKSHOP_STEP * 100)} %`,
        gold: COMPACT.format(cost.gold),
        ores: cost.ores[this.workshop.material()] ?? 0,
        check,
        blocked: check === 'ok' ? null : BLOCKED_TEXT[check],
      };
    }),
  );

  protected upgrade(slot: SlotId): void {
    if (this.workshop.upgrade(slot)) {
      this.sound.play('upgrade');
    }
  }

  protected close(): void {
    this.navigation.open('mine');
  }
}
