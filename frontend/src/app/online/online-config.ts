import { InjectionToken } from '@angular/core';

import { environment } from '../../environments/environment';

export interface OnlineConfig {
  readonly enabled: boolean;
  readonly apiUrl: string;
}

/** Réglages du jeu en ligne, injectés pour que les tests allument ou éteignent les comptes sans changer de build. */
export const ONLINE_CONFIG = new InjectionToken<OnlineConfig>('ONLINE_CONFIG', {
  providedIn: 'root',
  factory: () => environment.online,
});
