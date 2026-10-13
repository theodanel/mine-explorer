import { computed, inject, Injectable, signal } from '@angular/core';

import { EVOLUTION_FORMS } from '../balance/balance';
import { WORKSHOP_UNLOCK_FORM, WorkshopLevels, workshopMaterial } from '../balance/workshop';
import { SLOT_IDS, SlotId } from '../equipment/equipment.model';
import { Evolution } from '../evolution/evolution';
import { Ores } from '../ores/ores';
import { Progression } from '../progression/progression';
import { readStorage, writeStorage } from '../shared/local-storage';
import { Wallet } from '../wallet/wallet';
import { isValidLevels, slotLevel, upgradeCost, WorkshopCost } from './workshop-rules';

const STORAGE_KEY = 'mine-explorer.workshop';

export const WORKSHOP_UNLOCK_INDEX = EVOLUTION_FORMS.findIndex((form) => form.id === WORKSHOP_UNLOCK_FORM);

/** Ce qui empêche de renforcer un emplacement, ou 'ok'. */
export type UpgradeCheck = 'ok' | 'locked' | 'gold' | 'ores';

/** Atelier : renforcement des emplacements, payé en or et en minerai de la dernière zone terminée. */
@Injectable({ providedIn: 'root' })
export class Workshop {
  private readonly evolution = inject(Evolution);
  private readonly wallet = inject(Wallet);
  private readonly ores = inject(Ores);
  private readonly progression = inject(Progression);
  private readonly state = signal<WorkshopLevels>(loadLevels());

  readonly levels = this.state.asReadonly();
  readonly unlocked = computed(() => this.evolution.index() >= WORKSHOP_UNLOCK_INDEX);
  readonly unlockLabel = EVOLUTION_FORMS[WORKSHOP_UNLOCK_INDEX].label;
  readonly material = computed(() => workshopMaterial(this.progression.zone()));
  /** Minerai de la dernière zone terminée, en stock : les évolutions n'en demandent plus, tout est utilisable. */
  readonly spendableOres = computed(() => this.ores.stock()[this.material()]);
  /** Emplacements qu'on peut renforcer tout de suite : sert de pastille au menu. */
  readonly affordable = computed(() => SLOT_IDS.filter((slot) => this.check(slot) === 'ok').length);

  level(slot: SlotId): number {
    return slotLevel(this.levels(), slot);
  }

  cost(slot: SlotId): WorkshopCost {
    return upgradeCost(this.level(slot), this.progression.zone());
  }

  check(slot: SlotId): UpgradeCheck {
    if (!this.unlocked()) {
      return 'locked';
    }
    const cost = this.cost(slot);
    if (this.wallet.coins() < cost.gold) {
      return 'gold';
    }
    return (cost.ores[this.material()] ?? 0) > this.spendableOres() ? 'ores' : 'ok';
  }

  /** Paie or et minerai, puis monte l'emplacement d'un niveau. */
  upgrade(slot: SlotId): boolean {
    if (this.check(slot) !== 'ok') {
      return false;
    }
    const cost = this.cost(slot);
    // Conditions vérifiées juste au-dessus : les deux dépenses passent forcément
    this.ores.spend(cost.ores);
    this.wallet.spend(cost.gold);
    this.save({ ...this.levels(), [slot]: this.level(slot) + 1 });
    return true;
  }

  private save(next: WorkshopLevels): void {
    this.state.set(next);
    writeStorage(STORAGE_KEY, JSON.stringify(next));
  }
}

function loadLevels(): WorkshopLevels {
  const raw = readStorage(STORAGE_KEY);
  if (raw === null) {
    return {};
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (isValidLevels(value)) {
      return value;
    }
  } catch {
    // JSON illisible : traité comme une sauvegarde invalide juste en dessous
  }
  console.warn('Sauvegarde de l\'Atelier invalide ignorée');
  return {};
}
