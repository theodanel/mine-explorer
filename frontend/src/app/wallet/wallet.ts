import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'mine-explorer.coins';

/** Argent du joueur. Sauvegardé en local pour le MVP, le serveur prendra le relais plus tard. */
@Injectable({ providedIn: 'root' })
export class Wallet {
  private readonly coinsState = signal(loadCoins());
  readonly coins = this.coinsState.asReadonly();

  add(amount: number): void {
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      throw new RangeError(`Montant invalide : ${amount}`);
    }
    this.coinsState.update((coins) => coins + amount);
    saveCoins(this.coinsState());
  }
}

function loadCoins(): number {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    // Stockage bloqué (navigation privée, WebView restreinte) : on joue sans sauvegarde
    console.warn('Sauvegarde indisponible, la partie repart de zéro', error);
    return 0;
  }
  if (raw === null) {
    return 0;
  }
  const coins = Number(raw);
  if (!Number.isSafeInteger(coins) || coins < 0) {
    console.warn(`Sauvegarde invalide ignorée : "${raw}"`);
    return 0;
  }
  return coins;
}

function saveCoins(coins: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(coins));
  } catch (error) {
    console.warn('Impossible de sauvegarder l\'argent', error);
  }
}
