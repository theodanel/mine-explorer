import { computed, inject, Injectable, signal } from '@angular/core';
import { Assets } from 'pixi.js';

import { Progression } from '../progression/progression';
import { MINER_ATLAS_URL, UI_IMAGES, zoneBackground } from './game-assets';

export type LoadState = 'loading' | 'ready' | 'failed';

/** Précharge les assets du jeu et expose l'avancement pour l'écran de chargement. */
@Injectable({ providedIn: 'root' })
export class AssetLoader {
  private readonly progression = inject(Progression);
  private readonly loadedCount = signal(0);
  private readonly stateValue = signal<LoadState>('loading');
  /** Atlas du mineur, fond de la zone en cours, puis les images de l'interface. */
  private readonly total = 2 + UI_IMAGES.length;
  private started: Promise<void> | null = null;

  /** Avancement entre 0 et 1. */
  readonly progress = computed(() => this.loadedCount() / this.total);
  readonly state = this.stateValue.asReadonly();

  /** Lance le chargement une seule fois, même si plusieurs composants le demandent. */
  load(): Promise<void> {
    this.started ??= this.loadAll();
    return this.started;
  }

  private async loadAll(): Promise<void> {
    const tasks = [
      Assets.load(MINER_ATLAS_URL),
      Assets.load(zoneBackground(this.progression.zone()).url),
      ...UI_IMAGES.map((url) => preloadImage(url)),
    ].map((task) => task.then(() => this.loadedCount.update((count) => count + 1)));
    try {
      await Promise.all(tasks);
      this.stateValue.set('ready');
    } catch (error) {
      console.error('Chargement des assets impossible', error);
      this.stateValue.set('failed');
    }
  }
}

function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () => reject(new Error(`Image introuvable : ${url}`));
    image.src = url;
  });
}
