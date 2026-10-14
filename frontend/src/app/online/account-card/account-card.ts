import { Component, computed, inject, output, signal } from '@angular/core';

import { CloudSync } from '../cloud-sync';
import { OnlineAccount } from '../online-account';

/** Carte « Compte » de la page Profil : connexion, synchronisation de la partie, pseudo et gestion du compte. */
@Component({
  selector: 'app-account-card',
  templateUrl: './account-card.html',
  styleUrl: './account-card.scss',
})
export class AccountCard {
  protected readonly account = inject(OnlineAccount);
  protected readonly sync = inject(CloudSync);

  /** Le joueur ouvre le classement (affiché par la page Profil). */
  readonly leaderboard = output();

  protected readonly editing = signal(false);
  protected readonly pseudoError = signal<string | null>(null);
  protected readonly confirmingDelete = signal(false);
  protected readonly exported = signal<string | null>(null);
  protected readonly profile = computed(() => {
    const state = this.account.state();
    return state.kind === 'signed-in' ? state.profile : null;
  });

  protected async rename(pseudo: string): Promise<void> {
    const error = await this.account.rename(pseudo);
    this.pseudoError.set(error);
    if (error === null) {
      this.editing.set(false);
    }
  }

  protected async signOut(everywhere: boolean): Promise<void> {
    // Un autre compte pourrait se connecter ensuite sur cet appareil : la version du cloud connue ne vaut plus
    this.sync.forget();
    await (everywhere ? this.account.signOutEverywhere() : this.account.signOut());
  }

  protected async exportData(): Promise<void> {
    this.exported.set(await this.account.exportData());
  }

  protected async deleteAccount(): Promise<void> {
    if (await this.account.deleteAccount()) {
      this.sync.forget();
      this.confirmingDelete.set(false);
    }
  }
}
