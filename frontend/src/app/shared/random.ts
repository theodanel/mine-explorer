import { InjectionToken } from '@angular/core';

/** Renvoie un nombre dans [0, 1), comme Math.random. */
export type Random = () => number;

/** Injecté plutôt qu'appelé en dur pour rendre les tirages reproductibles en test. */
export const RANDOM = new InjectionToken<Random>('RANDOM', {
  providedIn: 'root',
  factory: () => Math.random,
});

export const ID_FACTORY = new InjectionToken<() => string>('ID_FACTORY', {
  providedIn: 'root',
  factory: () => () => crypto.randomUUID(),
});
