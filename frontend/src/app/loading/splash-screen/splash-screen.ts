import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';

import { AssetLoader } from '../asset-loader';

/** Durée minimale d'affichage : évite un flash quand les assets sont déjà en cache. */
const MIN_DISPLAY_MS = 1200;
/** Doit rester égale à la transition d'opacité de .splash.leaving dans le SCSS. */
const FADE_OUT_MS = 500;
const PERCENT = 100;

@Component({
  selector: 'app-splash-screen',
  templateUrl: './splash-screen.html',
  styleUrl: './splash-screen.scss',
})
export class SplashScreen implements OnInit {
  protected readonly loader = inject(AssetLoader);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly visible = signal(true);
  protected readonly leaving = signal(false);
  protected readonly percent = computed(() => Math.round(this.loader.progress() * PERCENT));

  async ngOnInit(): Promise<void> {
    const minDelay = wait(MIN_DISPLAY_MS, this.destroyRef);
    await Promise.all([this.loader.load(), minDelay]);
    // En cas d'échec, l'écran reste affiché avec le message d'erreur plutôt qu'un jeu à moitié chargé
    if (this.loader.state() !== 'ready') {
      return;
    }
    this.leaving.set(true);
    await wait(FADE_OUT_MS, this.destroyRef);
    this.visible.set(false);
  }
}

/** Attente annulée si le composant est détruit, pour ne pas toucher un composant mort. */
function wait(ms: number, destroyRef: DestroyRef): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    destroyRef.onDestroy(() => clearTimeout(timer));
  });
}
