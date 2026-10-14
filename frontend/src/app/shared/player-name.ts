import { computed, Injectable, signal } from '@angular/core';

import { readStorage, writeStorage } from './local-storage';

/** Pseudo du compte gardé sur l'appareil, pour l'afficher dès le chargement, avant la réponse du serveur. */
const STORAGE_KEY = 'mine-explorer-pseudo';
const DEFAULT_NAME = 'Petit mineur';

/** Nom affiché du joueur : son pseudo s'il est connecté, « Petit mineur » sinon. */
@Injectable({ providedIn: 'root' })
export class PlayerName {
  // Chaîne vide = pas de compte (déconnecté ou jamais connecté)
  private readonly pseudo = signal(readStorage(STORAGE_KEY) ?? '');

  readonly label = computed(() => this.pseudo() || DEFAULT_NAME);

  set(pseudo: string | null): void {
    this.pseudo.set(pseudo ?? '');
    writeStorage(STORAGE_KEY, pseudo ?? '');
  }
}
