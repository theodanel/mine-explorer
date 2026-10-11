import { Injectable, signal } from '@angular/core';

import { TIER_IDS, TierId } from '../equipment/equipment.model';
import { readStorage, writeStorage } from '../shared/local-storage';

const STORAGE_KEY = 'mine-explorer.ores';

export type OreStock = Readonly<Record<TierId, number>>;
export type OreCost = Readonly<Partial<Record<TierId, number>>>;

const EMPTY_STOCK: OreStock = Object.fromEntries(TIER_IDS.map((tier) => [tier, 0])) as Record<TierId, number>;

/** Vrai si le stock couvre tout le coût. */
export function canAfford(stock: OreStock, cost: OreCost): boolean {
  return TIER_IDS.every((tier) => stock[tier] >= (cost[tier] ?? 0));
}

/** Minerais récoltés dans les zones : un par matériau, ils servent à faire évoluer le mineur. */
@Injectable({ providedIn: 'root' })
export class Ores {
  private readonly state = signal<OreStock>(loadStock());
  readonly stock = this.state.asReadonly();

  add(tier: TierId, amount: number): void {
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      throw new RangeError(`Quantité de minerai invalide : ${amount}`);
    }
    this.save({ ...this.state(), [tier]: this.state()[tier] + amount });
  }

  /** Dépense tout le coût d'un coup, ou rien si un minerai manque. */
  spend(cost: OreCost): boolean {
    if (!canAfford(this.state(), cost)) {
      return false;
    }
    const next = { ...this.state() };
    for (const tier of TIER_IDS) {
      next[tier] -= cost[tier] ?? 0;
    }
    this.save(next);
    return true;
  }

  private save(next: OreStock): void {
    this.state.set(next);
    writeStorage(STORAGE_KEY, JSON.stringify(next));
  }
}

function loadStock(): OreStock {
  const raw = readStorage(STORAGE_KEY);
  if (raw === null) {
    return EMPTY_STOCK;
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (isValidStock(value)) {
      return value;
    }
  } catch {
    // JSON illisible : traité comme une sauvegarde invalide juste en dessous
  }
  console.warn('Sauvegarde des minerais invalide ignorée');
  return EMPTY_STOCK;
}

function isValidStock(value: unknown): value is OreStock {
  return (
    typeof value === 'object' &&
    value !== null &&
    TIER_IDS.every((tier) => {
      const amount = (value as Record<string, unknown>)[tier];
      return Number.isSafeInteger(amount) && (amount as number) >= 0;
    })
  );
}
