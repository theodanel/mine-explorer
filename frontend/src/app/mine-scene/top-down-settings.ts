import { computed, DOCUMENT, inject, Injectable, signal } from '@angular/core';

import { environment } from '../../environments/environment';
import { Progression } from '../progression/progression';
import { readStorage, writeStorage } from '../shared/local-storage';

const ENABLED_STORAGE_KEY = 'mine-explorer.vue-dessus';
const CAMERA_STORAGE_KEY = 'mine-explorer.vue-dessus-camera';
/** Zones jouées vue du dessus : la zone 1 seulement, le temps du prototype. Les autres gardent la scène de côté. */
const TOP_DOWN_ZONES: ReadonlySet<number> = new Set([1]);

/** Caméra de la vue du dessus : celle du téléphone (fixe s'il demande moins d'animations), ou un choix forcé. */
export type CameraChoice = 'auto' | 'fixed' | 'follow';
const CAMERA_CHOICES: readonly CameraChoice[] = ['auto', 'fixed', 'follow'];

/**
 * Prototype de la mine vue du dessus (zone 1). Allumé d'office sur le site de test, éteint en production tant qu'on
 * n'a pas décidé de le garder ; les outils de test le basculent.
 */
@Injectable({ providedIn: 'root' })
export class TopDownSettings {
  private readonly progression = inject(Progression);
  private readonly motionReduced = signal(false);
  /** Le téléphone demande moins d'animations : caméra fixe d'office, héros qui glisse sans sauter. */
  readonly reducedMotion = this.motionReduced.asReadonly();
  readonly enabled = signal(readEnabled());
  readonly camera = signal(readCamera());
  readonly fixedCamera = computed(() => {
    const camera = this.camera();
    return camera === 'auto' ? this.reducedMotion() : camera === 'fixed';
  });
  /** La zone jouée s'affiche vue du dessus. */
  readonly active = computed(() => this.enabled() && TOP_DOWN_ZONES.has(this.progression.playingZone()));

  constructor() {
    const query = inject(DOCUMENT).defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (query) {
      this.motionReduced.set(query.matches);
      query.addEventListener('change', (event) => this.motionReduced.set(event.matches));
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled.set(enabled);
    writeStorage(ENABLED_STORAGE_KEY, String(enabled));
  }

  setCamera(camera: CameraChoice): void {
    this.camera.set(camera);
    writeStorage(CAMERA_STORAGE_KEY, camera);
  }
}

function readEnabled(): boolean {
  const raw = readStorage(ENABLED_STORAGE_KEY);
  return raw === null ? environment.testBanner : raw === 'true';
}

function readCamera(): CameraChoice {
  const raw = readStorage(CAMERA_STORAGE_KEY);
  return CAMERA_CHOICES.find((choice) => choice === raw) ?? 'auto';
}
