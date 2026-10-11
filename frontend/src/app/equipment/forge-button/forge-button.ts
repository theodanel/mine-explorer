import { Component, computed, inject, signal } from '@angular/core';

import { MAX_PICKAXE_LEVEL, tierChances } from '../../balance/balance';
import { Forge } from '../../forge/forge';
import { formatDuration } from '../../shared/format-duration';
import { GeodeShards } from '../../wallet/geode-shards';
import { Wallet } from '../../wallet/wallet';
import { TIER_IDS, TIER_LABELS } from '../equipment.model';
import { Inventory } from '../inventory';

const PERCENT_FORMAT = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });

/**
 * Barre du bas : la pioche à taper pour forger, et l'accès à son amélioration.
 * La fenêtre d'amélioration reprend l'écran « Probabilités de forge » de Forge Master.
 */
@Component({
  selector: 'app-forge-button',
  templateUrl: './forge-button.html',
  styleUrl: './forge-button.scss',
})
export class ForgeButton {
  protected readonly inventory = inject(Inventory);
  protected readonly forge = inject(Forge);
  protected readonly wallet = inject(Wallet);
  protected readonly shards = inject(GeodeShards);
  protected readonly upgradeOpen = signal(false);

  /** Compte à rebours de l'amélioration en cours, ou null. */
  protected readonly upgradeTimeLeft = computed(() => {
    const ms = this.forge.upgradeTimeLeftMs();
    return ms === null ? null : formatDuration(ms);
  });
  /** Durée annoncée avant de payer : le joueur sait ce qui l'attend après le dixième segment. */
  protected readonly nextUpgradeDuration = computed(() => {
    const ms = this.forge.nextUpgradeDurationMs();
    return ms === null ? null : formatDuration(ms);
  });

  protected readonly segments = computed(() =>
    Array.from({ length: this.forge.segmentsPerLevel }, (_, index) => index < this.forge.segments()),
  );

  /** Table des chances : niveau actuel et niveau suivant côte à côte, un palier par ligne. */
  protected readonly odds = computed(() => {
    const level = this.forge.level();
    const nextLevel = level < MAX_PICKAXE_LEVEL ? level + 1 : null;
    const current = tierChances(level);
    const next = nextLevel === null ? null : tierChances(nextLevel);
    return {
      level,
      nextLevel,
      rows: TIER_IDS.map((tier) => ({
        tier,
        label: TIER_LABELS[tier],
        current: formatPercent(current[tier]),
        next: next === null ? null : formatPercent(next[tier]),
        // Les paliers hors de portée aux deux niveaux sont atténués, comme dans la référence
        reachable: current[tier] > 0 || (next !== null && next[tier] > 0),
      })),
    };
  });
}

function formatPercent(value: number): string {
  return PERCENT_FORMAT.format(value) + ' %';
}
