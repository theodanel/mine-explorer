import { computed, inject, Injectable, signal } from '@angular/core';

import { EVOLUTION_FORMS } from '../balance/balance';
import { WORKSHOP_UNLOCK_FORM, WorkshopLevels } from '../balance/workshop';
import { EquippedItems, SLOT_IDS, SlotId, TierId } from '../equipment/equipment.model';
import { Inventory } from '../equipment/inventory';
import { Evolution } from '../evolution/evolution';
import { Ores } from '../ores/ores';
import { readStorage, writeStorage } from '../shared/local-storage';
import { Wallet } from '../wallet/wallet';
import { isValidLevels, migrateSlotLevels, pieceLevel, upgradeCost, withLevel, WorkshopCost } from './workshop-rules';

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
    return tier === null ? null : upgradeCost(tier, this.level(slot));
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
    return true;
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
