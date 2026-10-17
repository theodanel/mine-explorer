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
import { renderSound, Samples } from './synth';
import { AudioRenderer } from './audio-renderer';
import { ZONE_THEMES } from './zone-music';

const SOUND_STORAGE_KEY = 'mine-explorer.volume';
const MUSIC_STORAGE_KEY = 'mine-explorer.music-volume';
/** La musique est calculée à basse fréquence : une nappe douce n'a pas besoin de plus, et le calcul reste court. */
const MUSIC_SAMPLE_RATE = 22050;
/** Fondu entre la musique d'une zone et celle de la suivante, en secondes. */
const MUSIC_FADE_SECONDS = 2;
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
 * tout est calculé par synth.ts et zone-music.ts). Chaque zone a sa musique, qui prend le relais en fondu quand on
 * change de zone. Les navigateurs mobiles n'autorisent le son qu'après un geste du joueur : le contexte audio naît
 * au premier toucher. Tout se met en pause quand l'onglet est caché.
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
  /** Musiques déjà calculées, par thème : revenir dans une zone ne recalcule rien. */
  private readonly musicBuffers = new Map<number, AudioBuffer>();
  /** Bruitages et musiques se calculent dans un Web Worker ; une musique en cours de calcul n'est pas redemandée. */
  private readonly renderer = new AudioRenderer();
  private readonly renderingThemes = new Set<number>();
  private musicSource: AudioBufferSourceNode | null = null;
  private musicFade: GainNode | null = null;
  /** Thème joué (index dans ZONE_THEMES), et celui demandé par la zone en cours. */
  private playingTheme: number | null = null;
  private wantedTheme = 0;
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

  /** La zone affichée a changé : sa musique prend le relais, en fondu. */
  setMusicZone(zone: number): void {
    this.wantedTheme = Math.min(Math.max(zone, 1), ZONE_THEMES.length) - 1;
    this.syncMusic();
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
    // Les bruitages arrivent du Worker un instant après le premier toucher ; sans Worker, tout de suite
    for (const id of SOUND_IDS) {
      if (this.renderer.usesWorker) {
        void this.renderer.render({ kind: 'sound', id, rate: context.sampleRate }).then((samples) => {
          this.buffers.set(id, toBuffer(context, samples, context.sampleRate));
        });
      } else {
        this.buffers.set(id, toBuffer(context, renderSound(id, context.sampleRate), context.sampleRate));
      }
    }
    this.syncMusic();
  }

  private bus(context: AudioContext, volume: number): GainNode {
    const gain = context.createGain();
    gain.gain.value = volume;
    gain.connect(context.destination);
    return gain;
  }

  /**
   * Joue la musique de la zone en cours quand la musique est réglée au-dessus de zéro, l'arrête quand elle est
   * coupée. Une musique pas encore calculée l'est dans un Web Worker, pour que le toucher ou le changement de zone
   * ne fige pas le jeu.
   */
  private syncMusic(): void {
    if (this.musicVolume() === 0) {
      this.stopMusic();
      return;
    }
    const context = this.context;
    if (context === null || this.musicBus === null || this.playingTheme === this.wantedTheme) {
      return;
    }
    const theme = this.wantedTheme;
    const cached = this.musicBuffers.get(theme);
    if (cached === undefined) {
      if (!this.renderingThemes.has(theme)) {
        this.renderingThemes.add(theme);
        void this.renderer.render({ kind: 'music', zone: theme + 1, rate: MUSIC_SAMPLE_RATE }).then((samples) => {
          this.renderingThemes.delete(theme);
          this.musicBuffers.set(theme, toBuffer(context, samples, MUSIC_SAMPLE_RATE));
          this.syncMusic();
        });
      }
      return;
    }
    this.fadeOutMusic(context);
    const fade = context.createGain();
    fade.gain.setValueAtTime(0, context.currentTime);
    fade.gain.linearRampToValueAtTime(1, context.currentTime + MUSIC_FADE_SECONDS);
    fade.connect(this.musicBus);
    const source = context.createBufferSource();
    source.buffer = cached;
    source.loop = true;
    source.connect(fade);
    source.start();
    this.musicSource = source;
    this.musicFade = fade;
    this.playingTheme = theme;
  }

  /** La musique en cours s'éteint en fondu, puis se libère. */
  private fadeOutMusic(context: AudioContext): void {
    const source = this.musicSource;
    const fade = this.musicFade;
    if (source === null || fade === null) {
      return;
    }
    fade.gain.cancelScheduledValues(context.currentTime);
    fade.gain.setValueAtTime(fade.gain.value, context.currentTime);
    fade.gain.linearRampToValueAtTime(0, context.currentTime + MUSIC_FADE_SECONDS);
    source.stop(context.currentTime + MUSIC_FADE_SECONDS);
    source.onended = () => fade.disconnect();
    this.musicSource = null;
    this.musicFade = null;
  }

  private stopMusic(): void {
    this.musicSource?.stop();
    this.musicSource?.disconnect();
    this.musicFade?.disconnect();
    this.musicSource = null;
    this.musicFade = null;
    this.playingTheme = null;
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
