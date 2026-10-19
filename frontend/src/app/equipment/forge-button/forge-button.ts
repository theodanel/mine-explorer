import { Component, computed, effect, inject, signal } from '@angular/core';

import { forgeSound } from '../../audio/sound-catalog';
import { Sound } from '../../audio/sound';

import { JACKPOT_CHANCE, jackpotTier, MAX_PICKAXE_LEVEL, tierChances } from '../../balance/balance';
import { AutoForge } from '../../forge/auto-forge';
import { Forge } from '../../forge/forge';
import { itemIconUrl, materialIconUrl } from '../../loading/game-assets';
import { ForgeFiltersDialog } from '../../forge/forge-filters/forge-filters';
import { Missions } from '../../missions/missions';
import { RevealDirective } from '../../onboarding/reveal.directive';
import { Overlays } from '../../shared/overlays';
import { MissionsDialog } from '../../missions/missions-dialog/missions-dialog';
import { formatDuration } from '../../shared/format-duration';
import { GeodeShards } from '../../wallet/geode-shards';
import { Wallet } from '../../wallet/wallet';
import { SLOTS, TIER_IDS, TIER_LABELS } from '../equipment.model';
import { Inventory } from '../inventory';
import { JackpotBurst } from '../jackpot-burst/jackpot-burst';
import { compactNumber } from '../../shared/format-number';

const PERCENT_FORMAT = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });

/**
 * Barre du bas : la pioche à taper pour forger, et l'accès à son amélioration.
 * La fenêtre d'amélioration reprend l'écran « Probabilités de forge » de Forge Master.
 */
@Component({
  selector: 'app-forge-button',
  imports: [MissionsDialog, ForgeFiltersDialog, RevealDirective, JackpotBurst],
  templateUrl: './forge-button.html',
  styleUrl: './forge-button.scss',
})
export class ForgeButton {
  protected readonly materialIcon = materialIconUrl;
  protected readonly inventory = inject(Inventory);
  protected readonly forge = inject(Forge);
  protected readonly wallet = inject(Wallet);
  protected readonly shards = inject(GeodeShards);
  protected readonly upgradeOpen = signal(false);
  protected readonly missionsOpen = signal(false);
  protected readonly missions = inject(Missions);
  protected readonly autoForge = inject(AutoForge);
  protected readonly filtersOpen = signal(false);
  private readonly sound = inject(Sound);
  private readonly overlays = inject(Overlays);

  /**
   * Animation de forge : la pioche frappe, des étincelles de la couleur du palier jaillissent et l'objet monte
   * au-dessus de la forge. La liste à un élément rejoue l'animation à chaque tirage.
   */
  protected readonly forgedPop = computed(() => {
    const forged = this.inventory.lastForged();
    if (forged === null) {
      return [];
    }
    const { item } = forged;
    const sold = this.autoForge.lastSold();
    return [
      {
        key: forged.key,
        tier: item.tier,
        icon: itemIconUrl(item.slot, item.tier, SLOTS[item.slot].iconUrl),
        sold: sold !== null && sold.id === item.id ? sold.price : null,
        jackpot: forged.jackpot,
      },
    ];
  });

  constructor() {
    // La fenêtre d'amélioration de la pioche est ouverte par le joueur : les fenêtres automatiques attendent
    effect((onCleanup) => {
      if (this.upgradeOpen()) {
        onCleanup(this.overlays.openUserDialog());
      }
    });
    effect(() => {
      const forged = this.inventory.lastForged();
      if (forged !== null) {
        this.sound.play(forged.jackpot ? 'jackpot' : forgeSound(forged.item.tier));
      }
    });
  }

  protected readonly forgeLabel = computed(() =>
    this.inventory.pending()
      ? 'Revoir l\'objet forgé en attente'
      : `Forger un objet pour ${this.inventory.forgeCost} éclats de géode`,
  );

  /** Tant qu'un objet attend un choix, la Forge le remontre au lieu d'en forger un autre. */
  /** Montants d'or en format court : un nombre à 7 chiffres devient illisible dans la fenêtre. */
  protected compact(value: number): string {
    return compactNumber(value);
  }

  protected onForgeClick(): void {
    if (this.inventory.pending()) {
      this.inventory.reopenReview();
    } else {
      this.inventory.forge();
    }
  }

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

  protected readonly shortcutPop = computed(() => {
    const cut = this.forge.lastShortcut();
    return cut === null ? [] : [{ key: cut.key, text: formatDuration(cut.savedMs) }];
  });

  protected readonly segments = computed(() =>
    Array.from({ length: this.forge.segmentsPerLevel }, (_, index) => index < this.forge.segments()),
  );

  protected readonly jackpotChance = formatPercent(JACKPOT_CHANCE);

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
        jackpot: tier === jackpotTier(level),
      })),
    };
  });
}

function formatPercent(value: number): string {
  return PERCENT_FORMAT.format(value) + ' %';
}
