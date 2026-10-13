import { computed, inject, Injectable, signal } from '@angular/core';

import { Inventory } from '../equipment/inventory';
import { Navigation } from '../navigation/navigation';
import { Progression } from '../progression/progression';
import { Overlays } from '../shared/overlays';
import { readStorage, writeStorage } from '../shared/local-storage';
import { isNewGame, nextStep, TUTORIAL_STEPS, TutorialStep } from './tutorial-steps';

const STORAGE_KEY = 'mine-explorer.tutorial';
const DONE = 'done';

/**
 * Tutoriel du premier lancement : quelques étapes qui ciblent un élément de l'écran.
 * Vu une seule fois : fini ou passé, il ne revient plus. Une partie déjà commencée ne le déclenche pas.
 */
@Injectable({ providedIn: 'root' })
export class Tutorial {
  private readonly inventory = inject(Inventory);
  private readonly navigation = inject(Navigation);
  private readonly overlays = inject(Overlays);
  private readonly progression = inject(Progression);
  private readonly index = signal<number | null>(this.initialIndex());

  readonly step = computed<TutorialStep | null>(() => {
    const index = this.index();
    return index === null ? null : TUTORIAL_STEPS[index];
  });

  readonly stepNumber = computed(() => (this.index() ?? 0) + 1);
  readonly stepCount = TUTORIAL_STEPS.length;

  /**
   * L'étape s'affiche quand sa condition de jeu est remplie, sur la mine, sans autre fenêtre ouverte :
   * le tutoriel ne passe jamais devant l'objet forgé ou une page du menu.
   */
  readonly visible = computed(() => {
    const step = this.step();
    if (step === null || this.navigation.page() !== 'mine' || this.overlays.userDialogOpen() || this.overlays.shown() !== null) {
      return false;
    }
    switch (step.waitFor) {
      case 'canForge':
        return this.inventory.canForge();
      case 'noPendingItem':
        return this.inventory.pending() === null && !this.inventory.forging();
      case 'none':
        return true;
    }
  });

  advance(): void {
    const index = this.index();
    if (index === null) {
      return;
    }
    const next = nextStep(index);
    if (next === null) {
      this.finish();
    } else {
      this.index.set(next);
    }
  }

  /** Fin, ou le joueur a choisi de passer : on ne le lui remontrera pas. */
  finish(): void {
    this.index.set(null);
    writeStorage(STORAGE_KEY, DONE);
  }

  private initialIndex(): number | null {
    if (readStorage(STORAGE_KEY) === DONE) {
      return null;
    }
    const { zone, stage } = this.progression.progress();
    return isNewGame(zone, stage) ? 0 : null;
  }
}
