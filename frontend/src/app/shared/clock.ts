import { InjectionToken } from '@angular/core';

/** Heure courante en ms, injectée pour figer le temps dans les tests (minuteur de pioche, absence). */
export const CLOCK = new InjectionToken<() => number>('CLOCK', {
  providedIn: 'root',
  factory: () => () => Date.now(),
});
