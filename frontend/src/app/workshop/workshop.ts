import { computed, inject, Injectable, signal } from '@angular/core';

import { EVOLUTION_FORMS } from '../balance/balance';
import { REFORGE_ORES, reforgeGoldCost, WORKSHOP_UNLOCK_FORM, WorkshopLevels, workshopMaterial } from '../balance/workshop';
import { reforgeAffix, reforgeTargets } from '../equipment/reforge-rules';
import { RANDOM } from '../shared/random';
import { EquippedItems, SLOT_IDS, SlotId, StatId, TierId } from '../equipment/equipment.model';
import { Inventory } from '../equipment/inventory';
import { Evolution } from '../evolution/evolution';
import { Ores } from '../ores/ores';
import { Progression } from '../progression/progression';
import { readStorage, writeStorage } from '../shared/local-storage';
import { Wallet } from '../wallet/wallet';
import { isValidLevels, migrateSlotLevels, pieceLevel, upgradeCost, withLevel, WorkshopCost } from './workshop-rules';
import { MissionCounters } from '../missions/mission-counters';

const STORAGE_KEY = 'mine-explorer.workshop';

export const WORKSHOP_UNLOCK_INDEX = EVOLUTION_FORMS.findIndex((form) => form.id === WORKSHOP_UNLOCK_FORM);

/** Ce qui empêche de renforcer une pièce, ou 'ok'. */
export type UpgradeCheck = 'ok' | 'locked' | 'empty' | 'max' | 'gold' | 'ores';

/**
 * Atelier : chaque pièce se renforce dans sa qualité (casque d'acier, casque de mithril…), contre de l'or et le
 * minerai de cette qualité. On renforce la pièce portée ; le niveau reste acquis pour toutes les pièces de même
 * emplacement et de même qualité.
 */
@Injectable({ providedIn: 'root' })
export class Workshop {
  private readonly evolution = inject(Evolution);
  private readonly wallet = inject(Wallet);
  private readonly ores = inject(Ores);
  private readonly inventory = inject(Inventory);
  private readonly missionCounters = inject(MissionCounters);
  private readonly random = inject(RANDOM);
  private readonly progression = inject(Progression);
  private readonly state = signal<WorkshopLevels>(loadLevels(this.inventory.equipped()));

  readonly levels = this.state.asReadonly();
  readonly unlocked = computed(() => this.evolution.index() >= WORKSHOP_UNLOCK_INDEX);
  readonly unlockLabel = EVOLUTION_FORMS[WORKSHOP_UNLOCK_INDEX].label;
  /** Pièces qu'on peut renforcer tout de suite : sert de pastille au menu. */
  readonly affordable = computed(() => SLOT_IDS.filter((slot) => this.check(slot) === 'ok').length);

  /** Qualité de la pièce portée dans cet emplacement, ou null s'il est vide. */
  tier(slot: SlotId): TierId | null {
    return this.inventory.equipped()[slot]?.tier ?? null;
  }

  level(slot: SlotId): number {
    const tier = this.tier(slot);
    return tier === null ? 0 : pieceLevel(this.levels(), slot, tier);
  }

  cost(slot: SlotId): WorkshopCost | null {
    const tier = this.tier(slot);
    const cost = tier === null ? null : upgradeCost(tier, this.level(slot));
    return cost === null ? null : { ...cost, gold: Math.round(cost.gold * this.progression.goldPriceScale()) };
  }

  check(slot: SlotId): UpgradeCheck {
    if (!this.unlocked()) {
      return 'locked';
    }
    if (this.tier(slot) === null) {
      return 'empty';
    }
    const cost = this.cost(slot);
    if (cost === null) {
      return 'max';
    }
    if (this.wallet.coins() < cost.gold) {
      return 'gold';
    }
    const stock = this.ores.stock();
    return Object.entries(cost.ores).every(([tier, need]) => stock[tier as TierId] >= (need ?? 0)) ? 'ok' : 'ores';
  }

  /** Paie or et minerai, puis monte la pièce portée d'un niveau dans sa qualité. */
  upgrade(slot: SlotId): boolean {
    const tier = this.tier(slot);
    const cost = this.cost(slot);
    if (this.check(slot) !== 'ok' || tier === null || cost === null) {
      return false;
    }
    // Conditions vérifiées juste au-dessus : les deux dépenses passent forcément
    this.ores.spend(cost.ores);
    this.wallet.spend(cost.gold);
    this.save(withLevel(this.levels(), slot, tier, this.level(slot) + 1));
    this.missionCounters.record('workshopUpgrades');
    return true;
  }

  /** Prix d'une reforge sur la pièce portée, ou null s'il n'y a pas de pièce. */
  reforgeCost(slot: SlotId): WorkshopCost | null {
    const tier = this.tier(slot);
    if (tier === null) {
      return null;
    }
    const material = workshopMaterial(tier);
    return { gold: Math.round(reforgeGoldCost(tier) * this.progression.goldPriceScale()), ores: material === null ? {} : { [material]: REFORGE_ORES } };
  }

  /** Ce qui empêche de reforger la pièce portée, ou 'ok'. */
  reforgeCheck(slot: SlotId): UpgradeCheck {
    if (!this.unlocked()) {
      return 'locked';
    }
    const item = this.inventory.equipped()[slot];
    const cost = this.reforgeCost(slot);
    if (item === undefined || cost === null) {
      return 'empty';
    }
    if (reforgeTargets(item).length === 0) {
      return 'max';
    }
    return this.canPay(cost);
  }

  /** Paie, puis relance l'affixe choisi de la pièce portée vers une autre stat. Renvoie la nouvelle stat. */
  reforge(slot: SlotId, stat: StatId): StatId | null {
    const item = this.inventory.equipped()[slot];
    const cost = this.reforgeCost(slot);
    if (this.reforgeCheck(slot) !== 'ok' || item === undefined || cost === null) {
      return null;
    }
    const reforged = reforgeAffix(item, stat, this.random);
    if (reforged === null) {
      return null;
    }
    this.ores.spend(cost.ores);
    this.wallet.spend(cost.gold);
    this.inventory.replaceEquipped(reforged);
    return reforgeTargets(item).find((target) => reforged.stats[target] !== undefined) ?? null;
  }

  private canPay(cost: WorkshopCost): UpgradeCheck {
    if (this.wallet.coins() < cost.gold) {
      return 'gold';
    }
    const stock = this.ores.stock();
    return Object.entries(cost.ores).every(([tier, need]) => stock[tier as TierId] >= (need ?? 0)) ? 'ok' : 'ores';
  }

  private save(next: WorkshopLevels): void {
    this.state.set(next);
    writeStorage(STORAGE_KEY, JSON.stringify(next));
  }
}

function loadLevels(equipped: EquippedItems): WorkshopLevels {
  const raw = readStorage(STORAGE_KEY);
  if (raw === null) {
    return {};
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (isValidLevels(value)) {
      return value;
    }
    // Sauvegarde d'avant les niveaux par qualité : convertie une fois, puis réécrite au nouveau format
    const migrated = migrateSlotLevels(value, equipped);
    if (migrated !== null) {
      writeStorage(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
  } catch {
    // JSON illisible : traité comme une sauvegarde invalide juste en dessous
  }
  console.warn('Sauvegarde de l\'Atelier invalide ignorée');
  return {};
}
