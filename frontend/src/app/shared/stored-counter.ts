import { Signal, signal, WritableSignal } from '@angular/core';

import { readStorage, writeStorage } from './local-storage';

/**
 * Quantité entière positive sauvegardée en local (pièces, éclats…).
 * Les services de ressources héritent de cette classe pour partager la validation et la sauvegarde.
 */
export class StoredCounter {
  private readonly amountState: WritableSignal<number>;
  readonly amount: Signal<number>;

  constructor(private readonly storageKey: string) {
    this.amountState = signal(loadAmount(storageKey));
    this.amount = this.amountState.asReadonly();
  }

  add(amount: number): void {
    assertValidAmount(amount);
    this.amountState.update((current) => current + amount);
    this.persist();
  }

  /** Dépense si le solde suffit, et renvoie false sinon : manquer de ressources est un cas normal du jeu. */
  spend(amount: number): boolean {
    assertValidAmount(amount);
    if (this.amountState() < amount) {
      return false;
    }
    this.amountState.update((current) => current - amount);
    this.persist();
    return true;
  }

  private persist(): void {
    writeStorage(this.storageKey, String(this.amountState()));
  }
}

function assertValidAmount(amount: number): void {
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new RangeError(`Montant invalide : ${amount}`);
  }
}

function loadAmount(storageKey: string): number {
  const raw = readStorage(storageKey);
  if (raw === null) {
    return 0;
  }
  const amount = Number(raw);
  if (raw.trim() === '' || !Number.isSafeInteger(amount) || amount < 0) {
    console.warn(`Sauvegarde "${storageKey}" invalide ignorée : "${raw}"`);
    return 0;
  }
  return amount;
}
