// Sons et musique fabriqués par le code, échantillon par échantillon : aucun fichier à télécharger, aucune licence
// à suivre, quelques millisecondes de calcul au premier toucher. Fichier pur, sans Angular ni Web Audio.
import type { SoundId } from './sound-catalog';

export type Samples = Float32Array<ArrayBuffer>;

const TAU = Math.PI * 2;
/** Crête visée après normalisation : un peu sous 1 pour garder de la marge quand plusieurs sons se superposent. */
const PEAK = 0.9;

/** Tirages pseudo-aléatoires reproductibles : un même son est identique à chaque partie et dans les tests. */
export function seededNoise(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return (state / 0x100000000) * 2 - 1;
  };
}

export function noteHz(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

export function buffer(seconds: number, sampleRate: number): Samples {
  return new Float32Array(Math.ceil(seconds * sampleRate));
}

/** Ajoute une note sinusoïdale (ou triangle) qui attaque vite et s'éteint en `decay` secondes. */
export function addTone(
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
export function addNoise(
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

export function normalize(out: Samples): Samples {
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
  // Jackpot : le coup d'enclume, une montée de cloches sur deux octaves, puis une pluie de pièces
  jackpot: (rate) => {
    const out = buffer(2, rate);
    addClang(out, rate, 0, 0.7);
    addArpeggio(out, rate, [72, 76, 79, 84, 88, 91, 96], 0.1, 0.07, 0.28);
    for (let coin = 0; coin < 8; coin++) {
      addTone(out, rate, { start: 0.8 + coin * 0.1, hz: noteHz(coin % 2 === 0 ? 96 : 100), decay: 0.08, gain: 0.3 });
    }
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
