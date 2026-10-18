import { Injectable } from '@angular/core';

/** Ressources dont le compteur est en haut de l'écran : ce sont elles qui s'y envolent. */
export type FlightKind = 'coins' | 'shards';

export interface Point {
  readonly x: number;
  readonly y: number;
}

/** Gains d'une récompense, par ressource. */
export type Gains = Partial<Readonly<Record<FlightKind, number>>>;

export type FlightHandler = (kind: FlightKind, origin: Point, amount: number) => void;

const MIN_PIECES = 3;
const MAX_PIECES = 8;
const PIECES_PER_DIGIT = 2;

/** Nombre de pièces qui volent : plus le gain a de chiffres, plus il y en a, dans une limite qui reste lisible. */
export function pieceCount(amount: number): number {
  const digits = Math.ceil(Math.log10(Math.max(amount, 0) + 1));
  return Math.min(Math.max(digits * PIECES_PER_DIGIT, MIN_PIECES), MAX_PIECES);
}

/**
 * Pièces et éclats qui s'envolent d'un bouton de récompense jusqu'aux compteurs du haut, comme dans les jeux du
 * genre : le gain se voit arriver. Le service ne fait que relayer ; la couche d'affichage s'y branche.
 */
@Injectable({ providedIn: 'root' })
export class RewardFlight {
  private handler: FlightHandler | null = null;

  /** Branche la couche d'affichage ; elle se débranche en passant null. */
  attach(handler: FlightHandler | null): void {
    this.handler = handler;
  }

  launch(origin: Point, gains: Gains): void {
    for (const kind of ['coins', 'shards'] as const) {
      const amount = gains[kind] ?? 0;
      if (amount > 0) {
        this.handler?.(kind, origin, amount);
      }
    }
  }
}
