import { computed, DOCUMENT, inject, Injectable, signal } from '@angular/core';

import { environment } from '../../environments/environment';
import { Progression } from '../progression/progression';
import { readStorage, writeStorage } from '../shared/local-storage';

const ENABLED_STORAGE_KEY = 'mine-explorer.marche-defile';
/** Zones où le héros avance entre deux filons : la zone 1 seulement, le temps de l'essai. */
const SIDE_WALK_ZONES: ReadonlySet<number> = new Set([1]);

/**
 * Essai du héros qui avance dans la galerie (zone 1). Allumé d'office sur le site de test, éteint en production tant
 * qu'on n'a pas décidé de le garder ; les outils de test le basculent. Un téléphone qui demande moins d'animations
 * garde le décor immobile.
 */
@Injectable({ providedIn: 'root' })
export class SideWalkSettings {
  private readonly progression = inject(Progression);
  private readonly reducedMotion = signal(false);
  readonly enabled = signal(readEnabled());
  /** Le décor défile entre deux filons dans la zone jouée. */
  readonly active = computed(() => this.enabled() && !this.reducedMotion() && SIDE_WALK_ZONES.has(this.progression.playingZone()));

  constructor() {
    const query = inject(DOCUMENT).defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (query) {
      this.reducedMotion.set(query.matches);
      query.addEventListener('change', (event) => this.reducedMotion.set(event.matches));
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled.set(enabled);
    writeStorage(ENABLED_STORAGE_KEY, String(enabled));
  }
}

function readEnabled(): boolean {
  const raw = readStorage(ENABLED_STORAGE_KEY);
  return raw === null ? environment.testBanner : raw === 'true';
}
