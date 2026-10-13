import { DestroyRef, DOCUMENT, inject, Injectable, InjectionToken, signal } from '@angular/core';

import { CLOCK } from '../shared/clock';
import { RANDOM } from '../shared/random';
import { readStorage, writeStorage } from '../shared/local-storage';
import {
  DEFAULT_MUSIC_VOLUME,
  DEFAULT_SOUND_VOLUME,
  PITCH_SPREAD,
  SOUND_GAIN,
  SOUND_IDS,
  SOUND_MIN_INTERVAL_MS,
  SoundId,
  VARIED_SOUNDS,
  VOLUME_STEPS,
} from './sound-catalog';
import { renderMusic, renderSound, Samples } from './synth';

const SOUND_STORAGE_KEY = 'mine-explorer.volume';
const MUSIC_STORAGE_KEY = 'mine-explorer.music-volume';
/** La musique est calculée à basse fréquence : une nappe douce n'a pas besoin de plus, et le calcul reste court. */
const MUSIC_SAMPLE_RATE = 22050;
/**
 * Gestes qui autorisent le son. Safari sur iPhone ne débloque l'audio qu'à la fin d'un toucher (touchend) ou
 * d'un clic, d'où plusieurs événements : le premier qui arrive crée le contexte, les suivants le relancent.
 */
const UNLOCK_EVENTS = ['pointerdown', 'touchend', 'click', 'keydown'] as const;

/** Crée le contexte audio, ou null quand le navigateur n'a pas Web Audio (tests, très vieux navigateurs). */
export const AUDIO_CONTEXT_FACTORY = new InjectionToken<() => AudioContext | null>('AUDIO_CONTEXT_FACTORY', {
  providedIn: 'root',
  factory: () => () => (typeof AudioContext === 'undefined' ? null : new AudioContext()),
});

/**
 * Bruitages et musique d'ambiance, joués avec l'API Web Audio du navigateur (aucune dépendance, aucun fichier :
 * tout est calculé par synth.ts). Les navigateurs mobiles n'autorisent le son qu'après un geste du joueur : le
 * contexte audio naît au premier toucher. Tout se met en pause quand l'onglet est caché.
 */
@Injectable({ providedIn: 'root' })
export class Sound {
  private readonly document = inject(DOCUMENT);
  private readonly createContext = inject(AUDIO_CONTEXT_FACTORY);
  private readonly clock = inject(CLOCK);
  private readonly random = inject(RANDOM);
  private readonly volumeState = signal(loadVolume(SOUND_STORAGE_KEY, DEFAULT_SOUND_VOLUME));
  private readonly musicVolumeState = signal(loadVolume(MUSIC_STORAGE_KEY, DEFAULT_MUSIC_VOLUME));
  private context: AudioContext | null = null;
  private soundBus: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private musicBuffer: AudioBuffer | null = null;
  private musicSource: AudioBufferSourceNode | null = null;
  private readonly buffers = new Map<SoundId, AudioBuffer>();
  private readonly lastPlayed = new Map<SoundId, number>();

  /** Volume des bruitages. */
  readonly volume = this.volumeState.asReadonly();
  readonly musicVolume = this.musicVolumeState.asReadonly();

  constructor() {
    const unlock = (): void => this.unlock();
    const visibility = (): void => this.followVisibility();
    UNLOCK_EVENTS.forEach((event) => this.document.addEventListener(event, unlock));
    this.document.addEventListener('visibilitychange', visibility);
    inject(DestroyRef).onDestroy(() => {
      UNLOCK_EVENTS.forEach((event) => this.document.removeEventListener(event, unlock));
      this.document.removeEventListener('visibilitychange', visibility);
      this.stopMusic();
      void this.context?.close();
    });
  }

  play(id: SoundId): void {
    const buffer = this.buffers.get(id);
    if (this.context === null || this.soundBus === null || buffer === undefined || this.volume() === 0 || this.document.hidden) {
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
    source.connect(gain).connect(this.soundBus);
    source.start();
  }

  setVolume(volume: number): void {
    this.volumeState.set(volume);
    if (this.soundBus !== null) {
      this.soundBus.gain.value = volume;
    }
    writeStorage(SOUND_STORAGE_KEY, String(volume));
  }

  setMusicVolume(volume: number): void {
    this.musicVolumeState.set(volume);
    if (this.musicBus !== null) {
      this.musicBus.gain.value = volume;
    }
    writeStorage(MUSIC_STORAGE_KEY, String(volume));
    this.syncMusic();
  }

  private unlock(): void {
    if (this.context !== null) {
      // iOS suspend le contexte quand l'application passe en arrière-plan : un toucher le relance
      if (this.context.state === 'suspended' && !this.document.hidden) {
        void this.context.resume();
      }
      return;
    }
    const context = this.createContext();
    if (context === null) {
      return;
    }
    this.context = context;
    this.soundBus = this.bus(context, this.volume());
    this.musicBus = this.bus(context, this.musicVolume());
    for (const id of SOUND_IDS) {
      this.buffers.set(id, toBuffer(context, renderSound(id, context.sampleRate), context.sampleRate));
    }
    // La musique (32 s d'audio) se calcule juste après le toucher, pour qu'il ne paraisse pas lent
    setTimeout(() => {
      this.musicBuffer = toBuffer(context, renderMusic(MUSIC_SAMPLE_RATE), MUSIC_SAMPLE_RATE);
      this.syncMusic();
    });
  }

  private bus(context: AudioContext, volume: number): GainNode {
    const gain = context.createGain();
    gain.gain.value = volume;
    gain.connect(context.destination);
    return gain;
  }

  /** Lance la boucle quand la musique est réglée au-dessus de zéro, l'arrête quand elle est coupée. */
  private syncMusic(): void {
    if (this.musicVolume() === 0) {
      this.stopMusic();
      return;
    }
    if (this.context === null || this.musicBus === null || this.musicBuffer === null || this.musicSource !== null) {
      return;
    }
    const source = this.context.createBufferSource();
    source.buffer = this.musicBuffer;
    source.loop = true;
    source.connect(this.musicBus);
    source.start();
    this.musicSource = source;
  }

  private stopMusic(): void {
    this.musicSource?.stop();
    this.musicSource?.disconnect();
    this.musicSource = null;
  }

  /** Onglet caché ou application en arrière-plan : plus rien ne joue, et la batterie est épargnée. */
  private followVisibility(): void {
    if (this.context === null) {
      return;
    }
    if (this.document.hidden) {
      void this.context.suspend();
    } else {
      void this.context.resume();
    }
  }
}

function toBuffer(context: AudioContext, samples: Samples, sampleRate: number): AudioBuffer {
  const buffer = context.createBuffer(1, samples.length, sampleRate);
  buffer.copyToChannel(samples, 0);
  return buffer;
}

function loadVolume(key: string, fallback: number): number {
  const raw = readStorage(key);
  if (raw === null) {
    return fallback;
  }
  const volume = Number(raw);
  if (!VOLUME_STEPS.includes(volume)) {
    console.warn(`Volume enregistré invalide ignoré : "${raw}"`);
    return fallback;
  }
  return volume;
}
