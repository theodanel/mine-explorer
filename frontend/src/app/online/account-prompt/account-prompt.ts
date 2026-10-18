import { Component, computed, inject, signal } from '@angular/core';

import { Evolution } from '../../evolution/evolution';
import { CLOCK } from '../../shared/clock';
import { readStorage, writeStorage } from '../../shared/local-storage';
import { Overlays } from '../../shared/overlays';
import { GoogleButton } from '../google-button/google-button';
import { OnlineAccount } from '../online-account';

/** Date du dernier « Plus tard », propre à cet appareil (hors du préfixe des clés envoyées au cloud). */
const DISMISSED_KEY = 'mine-explorer-account-prompt';
/** Après « Plus tard », la bulle revient au plus tôt 3 jours après : un rappel, pas une insistance. */
const REMIND_AFTER_MS = 3 * 24 * 60 * 60 * 1000;
/**
 * Première évolution (Mineur, vers 30 min de jeu) : le joueur a assez avancé pour tenir à sa partie, et il a déjà
 * vu le jeu avant qu'on lui parle de compte.
 */
const FIRST_EVOLUTION_INDEX = 1;

/**
 * Bulle « Ne perds pas ta partie » : propose de relier un compte Google une fois que le joueur a progressé, au lieu
 * d'exiger un compte avant de jouer. Discrète (pas de fond bloquant), une seule fenêtre automatique à la fois.
 */
@Component({
  selector: 'app-account-prompt',
  templateUrl: './account-prompt.html',
  styleUrl: './account-prompt.scss',
  imports: [GoogleButton],
})
export class AccountPrompt {
  private readonly account = inject(OnlineAccount);
  private readonly evolution = inject(Evolution);
  private readonly overlays = inject(Overlays);
  private readonly clock = inject(CLOCK);
  private readonly dismissedAt = signal(Number(readStorage(DISMISSED_KEY) ?? 0));

  protected readonly visible = this.overlays.isShown('account');

  constructor() {
    this.overlays.register(
      'account',
      computed(
        () =>
          this.account.state().kind === 'signed-out' &&
          this.evolution.index() >= FIRST_EVOLUTION_INDEX &&
          this.clock() - this.dismissedAt() >= REMIND_AFTER_MS,
      ),
    );
  }

  protected signIn(): void {
    this.account.signIn();
  }

  protected later(): void {
    const now = this.clock();
    writeStorage(DISMISSED_KEY, String(now));
    this.dismissedAt.set(now);
  }
}
