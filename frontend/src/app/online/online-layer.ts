import { Component, inject } from '@angular/core';

import { AccountPrompt } from './account-prompt/account-prompt';
import { CloudSync } from './cloud-sync';

/**
 * Partie toujours présente du jeu en ligne, chargée après le démarrage avec les autres fenêtres différées :
 * la synchronisation de la partie et la bulle qui propose de relier un compte. Éteint, rien ne s'y passe.
 */
@Component({
  selector: 'app-online-layer',
  template: '<app-account-prompt />',
  imports: [AccountPrompt],
})
export class OnlineLayer {
  constructor() {
    inject(CloudSync);
  }
}
