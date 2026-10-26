import { Signal, signal, WritableSignal } from '@angular/core';

import { readStorage, writeStorage } from './local-storage';

/**
 * Quantité positive sauvegardée en local (pièces, éclats…), arrondie à l'unité.
 * Les services de ressources héritent de cette classe pour partager la validation et la sauvegarde.
 * Avec les zones sans fin de la Renaissance (25/10/2026), l'or dépasse les entiers exacts de JavaScript (9 × 10¹⁵) :
 * au-delà, un nombre à virgule flottante garde la bonne grandeur, ce qui suffit à un compteur de jeu idle.
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
    // Plafonné au plus grand nombre fini : au-delà, la sauvegarde serait rejetée au rechargement
    this.amountState.update((current) => Math.min(current + Math.round(amount), Number.MAX_VALUE));
    this.persist();
  }

  /** Dépense si le solde suffit, et renvoie false sinon : manquer de ressources est un cas normal du jeu. */
  spend(amount: number): boolean {
    assertValidAmount(amount);
    if (this.amountState() < amount) {
      return false;
    }
    this.amountState.update((current) => current - Math.round(amount));
    this.persist();
    return true;
  }

  private persist(): void {
    writeStorage(this.storageKey, String(this.amountState()));
  }
}

/** Un montant entier, fini et positif (au-delà de 9 × 10¹⁵, tout nombre à virgule flottante est entier). */
function isAmount(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && Number.isInteger(value);
}

function assertValidAmount(amount: number): void {
  if (!isAmount(amount) || amount <= 0) {
    throw new RangeError(`Montant invalide : ${amount}`);
  }
}

function loadAmount(storageKey: string): number {
  const raw = readStorage(storageKey);
  if (raw === null) {
    return 0;
  }
  const amount = Number(raw);
  if (raw.trim() === '' || !isAmount(amount)) {
    console.warn(`Sauvegarde "${storageKey}" invalide ignorée : "${raw}"`);
    return 0;
  }
  return amount;
}
