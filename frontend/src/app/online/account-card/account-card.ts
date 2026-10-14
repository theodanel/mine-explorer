import { Component, computed, DOCUMENT, inject, output, signal } from '@angular/core';

import { CloudSync } from '../cloud-sync';
import { GoogleButton } from '../google-button/google-button';
import { OnlineAccount } from '../online-account';

/** Carte « Compte » de la page Profil : connexion, synchronisation de la partie, pseudo et gestion du compte. */
@Component({
  selector: 'app-account-card',
  templateUrl: './account-card.html',
  styleUrl: './account-card.scss',
  imports: [GoogleButton],
})
export class AccountCard {
  protected readonly account = inject(OnlineAccount);
  protected readonly sync = inject(CloudSync);
  private readonly document = inject(DOCUMENT);

  /** Le joueur ouvre le classement (affiché par la page Profil). */
  readonly leaderboard = output();

  protected readonly editing = signal(false);
  protected readonly pseudoError = signal<string | null>(null);
  protected readonly confirmingDelete = signal(false);
  /** Heure de la dernière sauvegarde réussie, à l'heure du joueur. */
  protected readonly lastSave = computed(() => {
    const state = this.sync.state();
    return state.kind === 'synced'
      ? new Date(state.at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      : '';
  });
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

  /** Télécharge un fichier JSON avec tout ce que le serveur garde sur le joueur (droit d'accès RGPD). */
  protected async exportData(): Promise<void> {
    const data = await this.account.exportData();
    if (data === null) {
      return;
    }
    const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    const link = this.document.createElement('a');
    link.href = url;
    link.download = 'mine-explorer-mes-donnees.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  protected async deleteAccount(): Promise<void> {
    if (await this.account.deleteAccount()) {
      this.sync.forget();
      this.confirmingDelete.set(false);
    }
  }
}
