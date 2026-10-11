import { TestBed } from '@angular/core/testing';

import { Wallet } from './wallet';

const STORAGE_KEY = 'mine-explorer.coins';

describe('Wallet', () => {
  beforeEach(() => localStorage.clear());

  function createWallet(): Wallet {
    return TestBed.inject(Wallet);
  }

  it('commence à zéro sans sauvegarde', () => {
    expect(createWallet().coins()).toBe(0);
  });

  it('reprend la sauvegarde existante', () => {
    localStorage.setItem(STORAGE_KEY, '42');
    expect(createWallet().coins()).toBe(42);
  });

  it.each(['abc', '-5', '1.5', ''])('ignore une sauvegarde invalide (%s)', (raw) => {
    localStorage.setItem(STORAGE_KEY, raw);
    expect(createWallet().coins()).toBe(0);
  });

  it('ajoute et sauvegarde les gains', () => {
    const wallet = createWallet();
    wallet.add(3);
    wallet.add(2);
    expect(wallet.coins()).toBe(5);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('5');
  });

  it.each([0, -1, 1.5, Number.NaN])('refuse un montant invalide (%s)', (amount) => {
    const wallet = createWallet();
    expect(() => wallet.add(amount)).toThrow(RangeError);
    expect(wallet.coins()).toBe(0);
  });

  it('dépense quand le solde suffit', () => {
    localStorage.setItem(STORAGE_KEY, '30');
    const wallet = createWallet();
    expect(wallet.spend(20)).toBe(true);
    expect(wallet.coins()).toBe(10);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('10');
  });

  it('refuse de dépenser plus que le solde', () => {
    localStorage.setItem(STORAGE_KEY, '19');
    const wallet = createWallet();
    expect(wallet.spend(20)).toBe(false);
    expect(wallet.coins()).toBe(19);
  });
});
