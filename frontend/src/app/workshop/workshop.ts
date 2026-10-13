import { computed, inject, Injectable, signal } from '@angular/core';

import { EVOLUTION_FORMS } from '../balance/balance';
import { WORKSHOP_UNLOCK_FORM, WorkshopLevels, workshopMaterial } from '../balance/workshop';
import { SLOT_IDS, SlotId } from '../equipment/equipment.model';
import { Evolution } from '../evolution/evolution';
import { Ores } from '../ores/ores';
import { Progression } from '../progression/progression';
import { readStorage, writeStorage } from '../shared/local-storage';
import { Wallet } from '../wallet/wallet';
import { isValidLevels, reservedOres, slotLevel, upgradeCost, WorkshopCost } from './workshop-rules';

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
  /** Minerai utilisable : le stock, moins ce que les évolutions à venir demandent. */
  readonly spendableOres = computed(() => {
    const tier = this.material();
    return Math.max(this.ores.stock()[tier] - reservedOres(this.evolution.index(), tier), 0);
  });
  readonly reservedOres = computed(() => Math.min(reservedOres(this.evolution.index(), this.material()), this.ores.stock()[this.material()]));
  /** Minerai en stock, réservé compris. */
  readonly oreStock = computed(() => this.ores.stock()[this.material()]);
  /** Forme qui demande ce minerai (la première à venir), pour expliquer pourquoi il est gardé. */
  readonly reservedFor = computed(
    () => EVOLUTION_FORMS.slice(this.evolution.index() + 1).find((form) => (form.ores[this.material()] ?? 0) > 0)?.label ?? null,
  );
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
