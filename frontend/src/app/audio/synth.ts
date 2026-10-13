// Sons et musique fabriqués par le code, échantillon par échantillon : aucun fichier à télécharger, aucune licence
// à suivre, quelques millisecondes de calcul au premier toucher. Fichier pur, sans Angular ni Web Audio.
import type { SoundId } from './sound-catalog';

export type Samples = Float32Array<ArrayBuffer>;

const TAU = Math.PI * 2;
/** Crête visée après normalisation : un peu sous 1 pour garder de la marge quand plusieurs sons se superposent. */
const PEAK = 0.9;

/** Tirages pseudo-aléatoires reproductibles : un même son est identique à chaque partie et dans les tests. */
function seededNoise(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return (state / 0x100000000) * 2 - 1;
  };
}

function noteHz(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

function buffer(seconds: number, sampleRate: number): Samples {
  return new Float32Array(Math.ceil(seconds * sampleRate));
}

/** Ajoute une note sinusoïdale (ou triangle) qui attaque vite et s'éteint en `decay` secondes. */
function addTone(
  out: Samples,
  sampleRate: number,
  options: { start: number; hz: number; endHz?: number; decay: number; gain: number; triangle?: boolean },
): void {
  const first = Math.floor(options.start * sampleRate);
  const length = Math.min(out.length - first, Math.ceil(options.decay * 4 * sampleRate));
  const endHz = options.endHz ?? options.hz;
  let phase = 0;
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const hz = options.hz + (endHz - options.hz) * Math.min(1, t / options.decay);
    phase += hz / sampleRate;
    const wave = options.triangle ? 1 - 4 * Math.abs((phase % 1) - 0.5) : Math.sin(TAU * phase);
    const attack = Math.min(1, t / 0.003);
    out[first + i] += wave * attack * Math.exp(-t / options.decay) * options.gain;
  }
}

/** Ajoute un souffle filtré (passe-bas à un pôle), pour les chocs, les éboulis et les explosions. */
function addNoise(
  out: Samples,
  sampleRate: number,
  options: { start: number; decay: number; gain: number; brightness: number; seed: number },
): void {
  const first = Math.floor(options.start * sampleRate);
  const length = Math.min(out.length - first, Math.ceil(options.decay * 4 * sampleRate));
  const noise = seededNoise(options.seed);
  let low = 0;
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    low += options.brightness * (noise() - low);
    out[first + i] += low * Math.exp(-t / options.decay) * options.gain;
  }
}

/** Partiels inharmoniques d'une enclume frappée. */
function addClang(out: Samples, sampleRate: number, start: number, gain: number): void {
  for (const [ratio, partialGain] of [
    [1, 1],
    [2.76, 0.6],
    [5.4, 0.35],
  ] as const) {
    addTone(out, sampleRate, { start, hz: 520 * ratio, decay: 0.25 / ratio ** 0.3, gain: gain * partialGain });
  }
  addNoise(out, sampleRate, { start, decay: 0.015, gain: gain * 0.8, brightness: 0.9, seed: 7 });
}

function addArpeggio(out: Samples, sampleRate: number, notes: readonly number[], start: number, step: number, decay: number): void {
  notes.forEach((midi, index) =>
    addTone(out, sampleRate, { start: start + index * step, hz: noteHz(midi), decay, gain: 0.5, triangle: true }),
  );
}

function normalize(out: Samples): Samples {
  let peak = 0;
  for (const sample of out) {
    peak = Math.max(peak, Math.abs(sample));
  }
  if (peak > 0) {
    const scale = PEAK / peak;
    for (let i = 0; i < out.length; i++) {
      out[i] *= scale;
    }
  }
  return out;
}

const RENDERERS: Readonly<Record<SoundId, (sampleRate: number) => Samples>> = {
  // Pioche sur la roche : petit claquement sec, une pointe métallique et un bruit sourd
  strike: (rate) => {
    const out = buffer(0.15, rate);
    addNoise(out, rate, { start: 0, decay: 0.02, gain: 0.7, brightness: 0.5, seed: 1 });
    addTone(out, rate, { start: 0, hz: 1700, endHz: 1300, decay: 0.03, gain: 0.35 });
    addTone(out, rate, { start: 0, hz: 140, endHz: 90, decay: 0.04, gain: 0.6 });
    return out;
  },
  crit: (rate) => {
    const out = buffer(0.4, rate);
    addNoise(out, rate, { start: 0, decay: 0.03, gain: 0.8, brightness: 0.6, seed: 2 });
    addTone(out, rate, { start: 0, hz: 2600, endHz: 2400, decay: 0.09, gain: 0.45 });
    addTone(out, rate, { start: 0, hz: 160, endHz: 80, decay: 0.07, gain: 0.8 });
    return out;
  },
  // Éclat de géode : tintement cristallin à deux notes
  shard: (rate) => {
    const out = buffer(0.9, rate);
    addTone(out, rate, { start: 0, hz: noteHz(91), decay: 0.18, gain: 0.5 });
    addTone(out, rate, { start: 0.06, hz: noteHz(98), decay: 0.22, gain: 0.4 });
    return out;
  },
  // Filon épuisé : éboulis grave
  rockBreak: (rate) => {
    const out = buffer(0.9, rate);
    addNoise(out, rate, { start: 0, decay: 0.18, gain: 1, brightness: 0.12, seed: 3 });
    addNoise(out, rate, { start: 0.05, decay: 0.08, gain: 0.5, brightness: 0.35, seed: 4 });
    addTone(out, rate, { start: 0, hz: 90, endHz: 50, decay: 0.12, gain: 0.8 });
    return out;
  },
  blast: (rate) => {
    const out = buffer(1.6, rate);
    addNoise(out, rate, { start: 0, decay: 0.35, gain: 1, brightness: 0.08, seed: 5 });
    addNoise(out, rate, { start: 0, decay: 0.05, gain: 0.6, brightness: 0.6, seed: 6 });
    addTone(out, rate, { start: 0, hz: 70, endHz: 35, decay: 0.3, gain: 1 });
    return out;
  },
  // Forge : coup d'enclume, puis quelques notes qui montent avec la rareté
  forgeCommon: (rate) => {
    const out = buffer(0.9, rate);
    addClang(out, rate, 0, 0.6);
    return out;
  },
  forgeRare: (rate) => {
    const out = buffer(1.1, rate);
    addClang(out, rate, 0, 0.6);
    addArpeggio(out, rate, [79, 84], 0.12, 0.08, 0.15);
    return out;
  },
  forgeEpic: (rate) => {
    const out = buffer(1.3, rate);
    addClang(out, rate, 0, 0.6);
    addArpeggio(out, rate, [76, 79, 84], 0.12, 0.08, 0.18);
    return out;
  },
  forgeLegendary: (rate) => {
    const out = buffer(1.8, rate);
    addClang(out, rate, 0, 0.6);
    addArpeggio(out, rate, [72, 76, 79, 84, 88], 0.12, 0.07, 0.25);
    return out;
  },
  // Vente : deux pièces qui tintent
  sell: (rate) => {
    const out = buffer(0.5, rate);
    addTone(out, rate, { start: 0, hz: noteHz(88), decay: 0.05, gain: 0.5 });
    addTone(out, rate, { start: 0.07, hz: noteHz(95), decay: 0.09, gain: 0.5 });
    return out;
  },
  artifact: (rate) => {
    const out = buffer(2, rate);
    addArpeggio(out, rate, [69, 72, 76, 81, 84, 88], 0, 0.09, 0.35);
    addTone(out, rate, { start: 0.5, hz: noteHz(93), decay: 0.4, gain: 0.25 });
    return out;
  },
  upgrade: (rate) => {
    const out = buffer(1.4, rate);
    addArpeggio(out, rate, [72, 76, 79], 0, 0.1, 0.12);
    addTone(out, rate, { start: 0.3, hz: noteHz(84), decay: 0.3, gain: 0.6, triangle: true });
    return out;
  },
};

export function renderSound(id: SoundId, sampleRate: number): Samples {
  return normalize(RENDERERS[id](sampleRate));
}

// ─── Musique d'ambiance ──────────────────────────────────────────────────────

/** Grille de la boucle : la mineur, calme, 8 accords de 4 secondes (32 secondes en tout). */
const CHORDS: readonly (readonly number[])[] = [
  [57, 60, 64], // la mineur
  [53, 57, 60], // fa
  [48, 55, 64], // do
  [55, 59, 62], // sol
  [57, 60, 64], // la mineur
  [53, 57, 60], // fa
  [50, 57, 62], // ré mineur
  [52, 56, 59], // mi
];
export const MUSIC_CHORD_SECONDS = 4;
export const MUSIC_LOOP_SECONDS = CHORDS.length * MUSIC_CHORD_SECONDS;
/** Gamme pentatonique de la mineur pour les gouttes de mélodie. */
const PENTATONIC = [69, 72, 74, 76, 79, 81];
const PLUCK_STEP_SECONDS = MUSIC_CHORD_SECONDS / 8;
const PLUCK_CHANCE = 0.3;
/** Pas de note pincée dans la dernière seconde et demie : sa traîne serait coupée net en fin de boucle. */
const PLUCK_TAIL_SECONDS = 1.5;
const ECHO_SECONDS = 0.75;
const ECHO_FEEDBACK = 0.35;

/** Nappe : un accord tenu, qui monte et redescend en douceur sur la durée de l'accord. */
function addPad(out: Samples, sampleRate: number, chord: readonly number[], start: number): void {
  const length = Math.ceil((MUSIC_CHORD_SECONDS + 1) * sampleRate);
  const first = Math.floor(start * sampleRate);
  const voices = [...chord.map((midi) => noteHz(midi)), noteHz(chord[0] - 12)];
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    // Fenêtre en cloche qui chevauche l'accord suivant d'une seconde : pas de coupure entre accords
    const envelope = Math.sin((Math.PI * t) / (MUSIC_CHORD_SECONDS + 1)) ** 2;
    let sample = 0;
    for (const hz of voices) {
      // Deux voix très légèrement désaccordées par note donnent un son plus chaud qu'une sinusoïde seule
      sample += Math.sin(TAU * hz * t) + Math.sin(TAU * hz * 1.003 * t);
    }
    // La boucle se referme sur elle-même : la fin du dernier accord retombe au début
    out[(first + i) % out.length] += sample * envelope * 0.05;
  }
}

/** Musique d'ambiance en boucle parfaite : nappe d'accords, petites notes pincées avec écho. */
export function renderMusic(sampleRate: number): Samples {
  const out = buffer(MUSIC_LOOP_SECONDS, sampleRate);
  const melody = new Float32Array(out.length);
  const random = seededNoise(42);
  CHORDS.forEach((chord, index) => addPad(out, sampleRate, chord, index * MUSIC_CHORD_SECONDS));
  for (let start = 0; start < MUSIC_LOOP_SECONDS - PLUCK_TAIL_SECONDS; start += PLUCK_STEP_SECONDS) {
    const roll = (random() + 1) / 2;
    if (roll < PLUCK_CHANCE) {
      const midi = PENTATONIC[Math.floor(((random() + 1) / 2) * PENTATONIC.length) % PENTATONIC.length];
      addTone(melody, sampleRate, { start, hz: noteHz(midi), decay: 0.35, gain: 0.25, triangle: true });
    }
  }
  // Écho circulaire : les répétitions de fin de boucle reviennent au début, comme si la musique ne s'arrêtait pas
  const delay = Math.round(ECHO_SECONDS * sampleRate);
  for (let i = 0; i < melody.length; i++) {
    out[i] += melody[i];
    out[(i + delay) % out.length] += melody[i] * ECHO_FEEDBACK;
    out[(i + 2 * delay) % out.length] += melody[i] * ECHO_FEEDBACK ** 2;
  }
  return normalize(out);
}
