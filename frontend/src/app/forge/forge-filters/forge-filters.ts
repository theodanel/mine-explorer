import { Component, computed, inject, output, signal } from '@angular/core';

import { holdUserDialog } from '../../shared/overlays';
import { SLOT_IDS, SLOTS, SlotId, STAT_IDS, STATS, StatId, TIER_IDS, TIER_LABELS, TierId } from '../../equipment/equipment.model';
import { materialIconUrl } from '../../loading/game-assets';
import { AutoForge } from '../auto-forge';
import { ForgeFilters, hasFilters, NO_FILTERS } from '../auto-forge-rules';

/** Icône de stat : celle de l'équipement qui la donne, comme dans le panneau de stats. */
const STAT_ICONS: Readonly<Record<StatId, string>> = {
  strikePower: SLOTS.pickaxe.iconUrl,
  miningSpeed: SLOTS.boots.iconUrl,
  critChance: SLOTS.gloves.iconUrl,
  critDamage: SLOTS.helmet.iconUrl,
  goldBonus: SLOTS.bag.iconUrl,
};

/** Réglage des filtres de la forge automatique. Les changements ne comptent qu'après « Valider ». */
@Component({
  selector: 'app-forge-filters',
  templateUrl: './forge-filters.html',
  styleUrl: './forge-filters.scss',
})
export class ForgeFiltersDialog {
  private readonly autoForge = inject(AutoForge);
  readonly closed = output<void>();

  protected readonly draft = signal<ForgeFilters>(this.autoForge.filters());
  protected readonly active = computed(() => hasFilters(this.draft()));

  protected readonly slots = computed(() =>
    SLOT_IDS.map((slot) => ({ id: slot, label: SLOTS[slot].label, icon: SLOTS[slot].iconUrl, on: this.draft().slots.includes(slot) })),
  );
  protected readonly stats = computed(() =>
    STAT_IDS.map((stat) => ({ id: stat, label: STATS[stat].label, icon: STAT_ICONS[stat], on: this.draft().stats.includes(stat) })),
  );
  protected readonly tiers = computed(() =>
    TIER_IDS.map((tier) => ({ id: tier, label: TIER_LABELS[tier], icon: materialIconUrl(tier), on: this.draft().minTier === tier })),
  );
  protected readonly keepTiers = computed(() =>
    TIER_IDS.map((tier) => ({ id: tier, label: TIER_LABELS[tier], icon: materialIconUrl(tier), on: this.draft().keepFromTier === tier })),
  );

  constructor() {
    // Ouverte par le joueur : les fenêtres automatiques attendent sa fermeture
    holdUserDialog();
  }

  protected toggleSlot(slot: SlotId): void {
    this.draft.update((filters) => ({ ...filters, slots: toggle(filters.slots, slot) }));
  }

  protected toggleStat(stat: StatId): void {
    this.draft.update((filters) => ({ ...filters, stats: toggle(filters.stats, stat) }));
  }

  /** Toucher le palier choisi le retire : plus de palier minimum. */
  protected chooseTier(tier: TierId): void {
    this.draft.update((filters) => ({ ...filters, minTier: filters.minTier === tier ? null : tier }));
  }

  /** Toucher la qualité choisie la retire : plus d'objet épargné d'office. */
  protected chooseKeepTier(tier: TierId): void {
    this.draft.update((filters) => ({ ...filters, keepFromTier: filters.keepFromTier === tier ? null : tier }));
  }

  protected toggleUpgrades(): void {
    this.draft.update((filters) => ({ ...filters, upgradesOnly: !filters.upgradesOnly }));
  }

  protected clear(): void {
    this.draft.set(NO_FILTERS);
  }

  protected save(): void {
    this.autoForge.setFilters(this.draft());
    this.closed.emit();
  }
}

function toggle<T>(values: readonly T[], value: T): readonly T[] {
  return values.includes(value) ? values.filter((candidate) => candidate !== value) : [...values, value];
}
