import { effect, inject, Injectable, untracked } from '@angular/core';

import { Achievements } from '../achievements/achievements';
import { CloudSync } from './cloud-sync';
import { OnlineAccount } from './online-account';
import { OnlineApi } from './online-api';

/**
 * Le titre porté part au serveur, qui l'affiche dans le classement et la discussion. Le serveur vérifie le succès
 * dans la sauvegarde cloud : un titre tout juste gagné peut être refusé tant que la partie n'est pas repartie,
 * alors on l'envoie d'abord, puis on réessaie une fois.
 */
@Injectable({ providedIn: 'root' })
export class TitleSync {
  private readonly api = inject(OnlineApi);
  private readonly account = inject(OnlineAccount);
  private readonly sync = inject(CloudSync);
  private readonly achievements = inject(Achievements);

  constructor() {
    if (!this.account.enabled) {
      return;
    }
    effect(() => {
      const title = this.achievements.title();
      if (this.account.signedIn()) {
        untracked(() => void this.send(title));
      }
    });
  }

  private async send(title: string | null): Promise<void> {
    const first = await this.api.write('PUT', '/api/me/title', { title });
    if (first.ok || first.code !== 'title-locked') {
      if (!first.ok) {
        console.warn('Titre refusé par le serveur', first.code);
      }
      return;
    }
    await this.sync.upload();
    const retry = await this.api.write('PUT', '/api/me/title', { title });
    if (!retry.ok) {
      console.warn('Titre refusé par le serveur', retry.code);
    }
  }
}
