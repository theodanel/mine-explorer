import { DestroyRef, DOCUMENT, inject, Injectable, InjectionToken, signal } from '@angular/core';

import { CLOCK } from '../shared/clock';
import { RANDOM } from '../shared/random';
import { readStorage, writeStorage } from '../shared/local-storage';
import {
  nextVolume,
  PITCH_SPREAD,
  SOUND_GAIN,
  SOUND_IDS,
  SOUND_MIN_INTERVAL_MS,
  SoundId,
  soundUrl,
  VARIED_SOUNDS,
  VOLUME_STEPS,
} from './sound-catalog';

const STORAGE_KEY = 'mine-explorer.volume';

/** Crée le contexte audio, ou null quand le navigateur n'a pas Web Audio (tests, très vieux navigateurs). */
export const AUDIO_CONTEXT_FACTORY = new InjectionToken<() => AudioContext | null>('AUDIO_CONTEXT_FACTORY', {
  providedIn: 'root',
  factory: () => () => (typeof AudioContext === 'undefined' ? null : new AudioContext()),
});

/**
 * Sons du jeu, joués avec l'API Web Audio du navigateur (aucune dépendance).
 * Les navigateurs mobiles n'autorisent le son qu'après un geste du joueur : le contexte audio naît au premier toucher,
 * puis les fichiers se chargent. Rien ne sonne quand l'onglet est caché.
 */
@Injectable({ providedIn: 'root' })
export class Sound {
  private readonly document = inject(DOCUMENT);
  private readonly createContext = inject(AUDIO_CONTEXT_FACTORY);
  private readonly clock = inject(CLOCK);
  private readonly random = inject(RANDOM);
  private readonly volumeState = signal(loadVolume());
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private readonly buffers = new Map<SoundId, AudioBuffer>();
  private readonly lastPlayed = new Map<SoundId, number>();

  readonly volume = this.volumeState.asReadonly();

  constructor() {
    const unlock = (): void => this.unlock();
    this.document.addEventListener('pointerdown', unlock);
    this.document.addEventListener('keydown', unlock);
    inject(DestroyRef).onDestroy(() => {
      this.document.removeEventListener('pointerdown', unlock);
      this.document.removeEventListener('keydown', unlock);
    });
  }

  play(id: SoundId): void {
    const buffer = this.buffers.get(id);
    if (this.context === null || this.master === null || buffer === undefined || this.volume() === 0 || this.document.hidden) {
      return;
    }
    const now = this.clock();
    if (now - (this.lastPlayed.get(id) ?? -Infinity) < SOUND_MIN_INTERVAL_MS) {
      return;
    }
    this.lastPlayed.set(id, now);
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    if (VARIED_SOUNDS.has(id)) {
      source.playbackRate.value = 1 + (this.random() * 2 - 1) * PITCH_SPREAD;
    }
    const gain = this.context.createGain();
    gain.gain.value = SOUND_GAIN[id];
    source.connect(gain).connect(this.master);
    source.start();
  }

  /** Fort, moyen, coupé : le bouton du son fait défiler ces trois volumes. */
  cycleVolume(): void {
    this.setVolume(nextVolume(this.volume()));
  }

  setVolume(volume: number): void {
    this.volumeState.set(volume);
    if (this.master !== null) {
      this.master.gain.value = volume;
    }
    writeStorage(STORAGE_KEY, String(volume));
  }

  private unlock(): void {
    if (this.context !== null) {
      // iOS suspend le contexte quand l'application passe en arrière-plan : un toucher le relance
      if (this.context.state === 'suspended') {
        void this.context.resume();
      }
      return;
    }
    this.context = this.createContext();
    if (this.context === null) {
      return;
    }
    this.master = this.context.createGain();
    this.master.gain.value = this.volume();
    this.master.connect(this.context.destination);
    void this.loadAll(this.context);
  }

  private async loadAll(context: AudioContext): Promise<void> {
    const missing: SoundId[] = [];
    await Promise.all(
      SOUND_IDS.map(async (id) => {
        try {
          const response = await fetch(soundUrl(id));
          if (!response.ok) {
            missing.push(id);
            return;
          }
          this.buffers.set(id, await context.decodeAudioData(await response.arrayBuffer()));
        } catch (error) {
          console.warn(`Son « ${id} » illisible`, error);
          missing.push(id);
        }
      }),
    );
    if (missing.length > 0) {
      console.info(`Sons absents, le jeu reste muet pour eux : ${missing.join(', ')}`);
    }
  }
}

function loadVolume(): number {
  const raw = readStorage(STORAGE_KEY);
  if (raw === null) {
    return VOLUME_STEPS[0];
  }
  const volume = Number(raw);
  if (!VOLUME_STEPS.includes(volume)) {
    console.warn(`Volume enregistré invalide ignoré : "${raw}"`);
    return VOLUME_STEPS[0];
  }
  return volume;
}
