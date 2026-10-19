import { Component, computed, inject, signal } from '@angular/core';

import { Sound } from '../../audio/sound';
import { PASS_TIERS, PASS_TIERS_PER_ZONE, PASS_ZONES } from '../../balance/progress-pass';
import { TIER_LABELS } from '../../equipment/equipment.model';
import { materialIconUrl } from '../../loading/game-assets';
import { Navigation } from '../../navigation/navigation';
import { ProgressPass } from '../progress-pass';

/** Durée de l'annonce de ce qui vient d'être récupéré. */
const CLAIM_MESSAGE_MS = 2500;

/** Passe de progression : les 60 paliers, zone par zone, et « Tout récupérer ». */
@Component({
  selector: 'app-pass-page',
  templateUrl: './pass-page.html',
  styleUrl: './pass-page.scss',
})
export class PassPage {
  protected readonly pass = inject(ProgressPass);
  private readonly navigation = inject(Navigation);
  private readonly sound = inject(Sound);
  protected readonly message = signal<string | null>(null);
  private timer: ReturnType<typeof setTimeout> | null = null;

  protected readonly zones = computed(() => {
    const claimed = this.pass.claimed();
    const reached = this.pass.reached();
    return Array.from({ length: PASS_ZONES }, (_, zoneIndex) => {
      const zone = zoneIndex + 1;
      const tiers = PASS_TIERS.slice(zoneIndex * PASS_TIERS_PER_ZONE, zone * PASS_TIERS_PER_ZONE).map((tier) => ({
        ...tier,
        state: tier.index <= claimed ? ('claimed' as const) : tier.index <= reached ? ('ready' as const) : ('locked' as const),
        oreIcon: tier.ore === null ? null : materialIconUrl(tier.ore.tier),
        oreLabel: tier.ore === null ? null : `${tier.ore.amount} ${TIER_LABELS[tier.ore.tier]}`,
      }));
      return { zone, tiers, current: tiers.some((tier) => tier.state !== 'claimed') && tiers.some((tier) => tier.state !== 'locked') };
    });
  });

  protected claimAll(): void {
    const claim = this.pass.claimAll();
    if (claim === null) {
      return;
    }
    this.sound.play('upgrade');
    this.message.set(`${claim.tiers} palier${claim.tiers > 1 ? 's' : ''} : +${claim.shards} éclats et du minerai`);
    if (this.timer !== null) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => this.message.set(null), CLAIM_MESSAGE_MS);
  }

  protected close(): void {
    this.navigation.open('mine');
  }
}
