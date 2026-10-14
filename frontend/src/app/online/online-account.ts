import { computed, inject, Injectable, InjectionToken, signal } from '@angular/core';

import { OnlineApi } from './online-api';
import { ONLINE_CONFIG } from './online-config';
import { isProfile, Profile } from './online-rules';

/** Navigation vers une autre adresse (connexion Google), injectée pour les tests. */
export const NAVIGATE = new InjectionToken<(url: string) => void>('NAVIGATE', {
  providedIn: 'root',
  factory: () => (url: string) => window.location.assign(url),
});

/**
 * État du compte : `disabled` quand le jeu en ligne est éteint (build de production pour l'instant), `offline` quand
 * le serveur ne répond pas. Le jeu reste jouable dans tous les cas.
 */
export type AccountState =
  | { readonly kind: 'disabled' }
  | { readonly kind: 'loading' }
  | { readonly kind: 'offline' }
  | { readonly kind: 'signed-out' }
  | { readonly kind: 'signed-in'; readonly profile: Profile };

/** Messages des erreurs que le joueur peut corriger lui-même. */
const PSEUDO_ERRORS: Readonly<Record<string, string>> = {
  'pseudo-invalid': '3 à 20 lettres, chiffres, espaces, tirets ou soulignés.',
  'pseudo-taken': 'Ce pseudo est déjà pris.',
};

/** Compte du joueur : connexion Google, pseudo, déconnexion, export et suppression. */
@Injectable({ providedIn: 'root' })
export class OnlineAccount {
  private readonly config = inject(ONLINE_CONFIG);
  private readonly api = inject(OnlineApi);
  private readonly navigate = inject(NAVIGATE);
  private readonly current = signal<AccountState>(this.config.enabled ? { kind: 'loading' } : { kind: 'disabled' });

  readonly state = this.current.asReadonly();
  readonly enabled = this.config.enabled;
  readonly signedIn = computed(() => this.current().kind === 'signed-in');

  constructor() {
    if (this.config.enabled) {
      void this.refresh();
    }
  }

  async refresh(): Promise<void> {
    const result = await this.api.get('/api/me');
    if (result.ok && isProfile(result.body)) {
      this.current.set({ kind: 'signed-in', profile: result.body });
    } else if (!result.ok && result.status === 401) {
      this.current.set({ kind: 'signed-out' });
    } else {
      this.current.set({ kind: 'offline' });
    }
  }

  signIn(): void {
    this.navigate(this.api.signInUrl());
  }

  async signOut(): Promise<void> {
    await this.api.write('POST', '/api/logout');
    this.current.set({ kind: 'signed-out' });
  }

  async signOutEverywhere(): Promise<void> {
    await this.api.write('POST', '/api/me/logout-everywhere');
    this.current.set({ kind: 'signed-out' });
  }

  /** Renvoie un message d'erreur à afficher, ou null si le pseudo a changé. */
  async rename(pseudo: string): Promise<string | null> {
    const result = await this.api.write('PUT', '/api/me/pseudo', { pseudo });
    if (result.ok && isProfile(result.body)) {
      this.current.set({ kind: 'signed-in', profile: result.body });
      return null;
    }
    return (!result.ok && result.code !== null ? PSEUDO_ERRORS[result.code] : undefined) ?? 'Pseudo non enregistré, réessaie.';
  }

  /** Toutes les données gardées par le serveur, en JSON lisible. */
  async exportData(): Promise<string | null> {
    const result = await this.api.get('/api/me/export');
    return result.ok ? JSON.stringify(result.body, null, 2) : null;
  }

  /** Supprime le compte et la partie du cloud ; la partie de cet appareil reste. */
  async deleteAccount(): Promise<boolean> {
    const result = await this.api.write('DELETE', '/api/me');
    if (result.ok) {
      this.current.set({ kind: 'signed-out' });
    }
    return result.ok;
  }
}
