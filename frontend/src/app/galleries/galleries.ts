import { computed, inject, Injectable, signal } from '@angular/core';

import { GALLERIES, GalleryId } from '../balance/galleries';
import { Progression } from '../progression/progression';
import { readStorage, writeStorage } from '../shared/local-storage';
import { RANDOM } from '../shared/random';
import { GalleryState, isValidGalleryState, rollOffer } from './gallery-rules';

const STORAGE_KEY = 'mine-explorer.gallery';

/**
 * Embranchements : à la fin d'une zone, deux galeries sont proposées pour la suivante. Le choix reste ouvert
 * pendant le premier filon de la zone ; sans choix (jeu laissé tourner, fenêtre fermée), c'est la galerie ordinaire.
 */
@Injectable({ providedIn: 'root' })
export class Galleries {
  private readonly progression = inject(Progression);
  private readonly random = inject(RANDOM);
  private readonly state = signal<GalleryState | null>(loadState());
  private readonly dialogClosed = signal(false);

  /** Galerie de la zone en cours. Une sauvegarde d'une autre zone, ou aucune, donne la galerie ordinaire. */
  readonly current = computed<GalleryId>(() => {
    const state = this.state();
    return state !== null && state.zone === this.progression.zone() ? state.gallery : 'neutral';
  });
  readonly gallery = computed(() => GALLERIES[this.current()]);
  readonly modifiers = computed(() => this.gallery().modifiers);

  /** Choix encore possible : la zone vient de commencer et le joueur n'a pas tranché. */
  readonly offer = computed(() => {
    const state = this.state();
    const { zone, stage } = this.progression.progress();
    if (state === null || state.offer === null || state.zone !== zone || stage > 1) {
      return null;
    }
    return state.offer;
  });
  readonly choosing = computed(() => this.offer() !== null && !this.dialogClosed());

  /** Appelé quand une zone est terminée : la suivante démarre ordinaire, avec deux galeries proposées. */
  offerFor(zone: number): void {
    this.save({ zone, gallery: 'neutral', offer: rollOffer(this.random) });
    this.dialogClosed.set(false);
  }

  choose(gallery: GalleryId): void {
    const offer = this.offer();
    const state = this.state();
    if (offer === null || state === null || !offer.includes(gallery)) {
      return;
    }
    this.save({ ...state, gallery, offer: null });
  }

  /** Garde la galerie ordinaire pour cette zone. */
  decline(): void {
    const state = this.state();
    if (state !== null) {
      this.save({ ...state, offer: null });
    }
  }

  /** Ferme la fenêtre sans choisir : le choix reste possible pendant le premier filon. */
  closeDialog(): void {
    this.dialogClosed.set(true);
  }

  reopenDialog(): void {
    this.dialogClosed.set(false);
  }

  private save(next: GalleryState): void {
    this.state.set(next);
    writeStorage(STORAGE_KEY, JSON.stringify(next));
  }
}

function loadState(): GalleryState | null {
  const raw = readStorage(STORAGE_KEY);
  if (raw === null) {
    return null;
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (isValidGalleryState(value)) {
      return value;
    }
  } catch {
    // JSON illisible : traité comme une sauvegarde invalide juste en dessous
  }
  console.warn('Sauvegarde de la galerie invalide ignorée');
  return null;
}
