// Musique de chaque zone (demande de Théo, 16/10/2026) : une boucle d'ambiance par décor, calculée par le code comme
// les bruitages. Chaque zone a sa gamme, ses accords, son tempo, ses instruments et sa percussion. Fichier pur.
import { addNoise, addTone, buffer, normalize, noteHz, Samples, seededNoise } from './synth';

const TAU = Math.PI * 2;

/**
 * Table de sinus : la nappe et le bourdon lisent une table plutôt que d'appeler Math.sin des centaines de milliers de
 * fois. La musique d'une zone se calcule ainsi en un éclair, même sur un téléphone, au moment où l'on change de zone.
 */
const SINE_TABLE_SIZE = 4096;
const SINE_TABLE = Float32Array.from({ length: SINE_TABLE_SIZE }, (_, index) => Math.sin((TAU * index) / SINE_TABLE_SIZE));

/** Sinus d'une phase exprimée en tours (1 = un tour complet). */
function fastSine(cycles: number): number {
  const position = (cycles - Math.floor(cycles)) * SINE_TABLE_SIZE;
  return SINE_TABLE[Math.floor(position) & (SINE_TABLE_SIZE - 1)];
}

/** Gammes, en demi-tons depuis la tonique. */
const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
} as const;
type ScaleId = keyof typeof SCALES;

/** Timbre de la nappe d'accords. */
type PadVoice = 'soft' | 'warm' | 'choir' | 'brass';
/** Instrument des petites notes de mélodie. */
type LeadVoice = 'pluck' | 'bell' | 'flute' | 'glass';
/** Percussion douce qui donne le pas de la zone. */
type Percussion = 'none' | 'taps' | 'anvil' | 'drum' | 'heartbeat' | 'drops';

export interface ZoneTheme {
  /** Ambiance, pour la documentation et les tests. */
  readonly mood: string;
  /** Tonique, en note MIDI (57 = la). */
  readonly root: number;
  readonly scale: ScaleId;
  /** Accords en degrés de la gamme (0 = premier degré), un par mesure. */
  readonly chords: readonly number[];
  /** Durée d'un accord, en secondes : le tempo de la zone. */
  readonly chordSeconds: number;
  readonly pad: PadVoice;
  readonly lead: LeadVoice;
  /** Part des pas où une note de mélodie tombe, de 0 à 1. */
  readonly density: number;
  /** Notes de mélodie par accord. */
  readonly steps: number;
  /** Octave de la mélodie, en demi-tons au-dessus de la tonique. */
  readonly leadOctave: number;
  readonly percussion: Percussion;
  /** Bourdon grave tenu sous toute la boucle. */
  readonly drone: boolean;
  /** Écho de la mélodie, en secondes, et sa force. */
  readonly echo: number;
  readonly echoFeedback: number;
}

/**
 * Une ambiance par zone, d'après son décor (noms de la carte des zones). Au-delà de la zone 20, on reste dans le
 * Cœur du monde.
 */
export const ZONE_THEMES: readonly ZoneTheme[] = [
  { mood: 'Galerie des racines : terre chaude, calme, petites notes boisées', root: 50, scale: 'dorian', chords: [0, 3, 0, 6, 0, 3, 4, 6], chordSeconds: 4, pad: 'warm', lead: 'pluck', density: 0.3, steps: 8, leadOctave: 12, percussion: 'none', drone: false, echo: 0.75, echoFeedback: 0.35 },
  { mood: 'Carrière de pierre : régulière, coups de pioche lointains', root: 57, scale: 'minor', chords: [0, 5, 2, 6, 0, 5, 3, 4], chordSeconds: 4, pad: 'soft', lead: 'pluck', density: 0.25, steps: 8, leadOctave: 12, percussion: 'taps', drone: false, echo: 0.5, echoFeedback: 0.3 },
  { mood: 'Veines de cuivre : enjouée, chaude, qui sautille', root: 52, scale: 'mixolydian', chords: [0, 6, 3, 0, 0, 6, 4, 3], chordSeconds: 3, pad: 'warm', lead: 'pluck', density: 0.45, steps: 8, leadOctave: 12, percussion: 'taps', drone: false, echo: 0.375, echoFeedback: 0.3 },
  { mood: 'Mine de fer : sombre et martelée, une enclume au loin', root: 48, scale: 'minor', chords: [0, 0, 5, 6, 0, 3, 6, 4], chordSeconds: 4, pad: 'soft', lead: 'pluck', density: 0.2, steps: 8, leadOctave: 12, percussion: 'anvil', drone: true, echo: 0.5, echoFeedback: 0.3 },
  { mood: 'Forge naine : fière, au pas, tambours et enclume', root: 55, scale: 'minor', chords: [0, 5, 6, 4, 0, 5, 3, 4], chordSeconds: 3, pad: 'brass', lead: 'pluck', density: 0.35, steps: 8, leadOctave: 12, percussion: 'drum', drone: false, echo: 0.375, echoFeedback: 0.25 },
  { mood: "Caverne d'or : scintillante, des clochettes partout", root: 53, scale: 'lydian', chords: [0, 1, 0, 4, 0, 1, 5, 4], chordSeconds: 4, pad: 'soft', lead: 'bell', density: 0.4, steps: 8, leadOctave: 24, percussion: 'none', drone: false, echo: 0.5, echoFeedback: 0.4 },
  { mood: 'Ruines elfiques : aérienne, une flûte et des arpèges de harpe', root: 52, scale: 'minor', chords: [0, 5, 2, 6, 3, 0, 6, 4], chordSeconds: 4, pad: 'choir', lead: 'flute', density: 0.3, steps: 4, leadOctave: 12, percussion: 'none', drone: false, echo: 0.75, echoFeedback: 0.35 },
  { mood: 'Grotte de cristal : verre et longs échos', root: 59, scale: 'lydian', chords: [0, 4, 1, 4, 0, 4, 5, 1], chordSeconds: 5, pad: 'soft', lead: 'glass', density: 0.3, steps: 8, leadOctave: 12, percussion: 'drops', drone: false, echo: 1, echoFeedback: 0.45 },
  { mood: 'Caverne de magma : grondante et lente, la terre qui bat', root: 48, scale: 'phrygian', chords: [0, 1, 0, 6, 0, 1, 2, 1], chordSeconds: 4, pad: 'brass', lead: 'pluck', density: 0.15, steps: 4, leadOctave: 12, percussion: 'heartbeat', drone: true, echo: 0.5, echoFeedback: 0.3 },
  { mood: 'Sanctuaire divin : lumineux, un chœur et des cloches', root: 50, scale: 'major', chords: [0, 4, 5, 3, 0, 4, 3, 4], chordSeconds: 5, pad: 'choir', lead: 'bell', density: 0.25, steps: 4, leadOctave: 24, percussion: 'none', drone: false, echo: 1, echoFeedback: 0.4 },
  { mood: 'Forêt souterraine : paisible, des gouttes et des notes de bois', root: 55, scale: 'major', chords: [0, 3, 5, 4, 0, 3, 1, 4], chordSeconds: 4, pad: 'warm', lead: 'pluck', density: 0.35, steps: 8, leadOctave: 12, percussion: 'drops', drone: false, echo: 0.5, echoFeedback: 0.35 },
  { mood: 'Lac gelé : froide et clairsemée, du verre sur la glace', root: 54, scale: 'minor', chords: [0, 5, 3, 4, 0, 5, 6, 4], chordSeconds: 5, pad: 'soft', lead: 'glass', density: 0.2, steps: 4, leadOctave: 12, percussion: 'none', drone: true, echo: 1.25, echoFeedback: 0.45 },
  { mood: 'Cité naine engloutie : profonde, bulles et gouttes', root: 46, scale: 'dorian', chords: [0, 3, 6, 0, 0, 3, 4, 6], chordSeconds: 5, pad: 'choir', lead: 'bell', density: 0.2, steps: 4, leadOctave: 24, percussion: 'drops', drone: true, echo: 1, echoFeedback: 0.4 },
  { mood: "Grotte d'obsidienne : sombre et tranchante", root: 57, scale: 'phrygian', chords: [0, 1, 6, 0, 0, 1, 5, 6], chordSeconds: 3, pad: 'soft', lead: 'pluck', density: 0.35, steps: 8, leadOctave: 12, percussion: 'taps', drone: true, echo: 0.375, echoFeedback: 0.35 },
  { mood: 'Jardin de cristaux : féerique, des arpèges qui scintillent', root: 52, scale: 'lydian', chords: [0, 1, 4, 5, 0, 1, 2, 4], chordSeconds: 4, pad: 'soft', lead: 'glass', density: 0.5, steps: 8, leadOctave: 24, percussion: 'none', drone: false, echo: 0.5, echoFeedback: 0.4 },
  { mood: 'Nid de dragon : menaçante, gros tambours et cuivres', root: 50, scale: 'harmonicMinor', chords: [0, 5, 4, 0, 0, 5, 1, 4], chordSeconds: 3, pad: 'brass', lead: 'pluck', density: 0.3, steps: 8, leadOctave: 12, percussion: 'drum', drone: true, echo: 0.375, echoFeedback: 0.25 },
  { mood: 'Ruines anciennes : mystérieuse, une cloche qui résonne', root: 48, scale: 'dorian', chords: [0, 6, 3, 0, 0, 6, 4, 3], chordSeconds: 5, pad: 'choir', lead: 'bell', density: 0.15, steps: 4, leadOctave: 12, percussion: 'none', drone: true, echo: 1.25, echoFeedback: 0.45 },
  { mood: 'Abysses : presque silencieuse, un bourdon et des appels lointains', root: 41, scale: 'phrygian', chords: [0, 0, 1, 0, 0, 0, 6, 0], chordSeconds: 5, pad: 'soft', lead: 'flute', density: 0.1, steps: 4, leadOctave: 24, percussion: 'heartbeat', drone: true, echo: 1.25, echoFeedback: 0.5 },
  { mood: 'Royaume des fées : vive et légère, des arpèges qui virevoltent', root: 57, scale: 'lydian', chords: [0, 1, 4, 3, 0, 1, 5, 4], chordSeconds: 3, pad: 'soft', lead: 'bell', density: 0.55, steps: 8, leadOctave: 24, percussion: 'taps', drone: false, echo: 0.375, echoFeedback: 0.4 },
  { mood: 'Cœur du monde : épique, un cœur qui bat sous un grand chœur', root: 52, scale: 'minor', chords: [0, 5, 2, 6, 0, 5, 3, 4], chordSeconds: 4, pad: 'choir', lead: 'flute', density: 0.3, steps: 4, leadOctave: 12, percussion: 'heartbeat', drone: true, echo: 0.75, echoFeedback: 0.35 },
];

/** Thème de la zone : au-delà de la dernière, on reste dans le Cœur du monde. */
export function zoneTheme(zone: number): ZoneTheme {
  return ZONE_THEMES[Math.min(Math.max(zone, 1), ZONE_THEMES.length) - 1];
}

export function themeLoopSeconds(theme: ZoneTheme): number {
  return theme.chords.length * theme.chordSeconds;
}

/** Note de la gamme au degré donné (les degrés au-delà de 7 montent d'une octave). */
function degreeMidi(theme: ZoneTheme, degree: number): number {
  const scale = SCALES[theme.scale];
  const octave = Math.floor(degree / scale.length);
  return theme.root + scale[((degree % scale.length) + scale.length) % scale.length] + 12 * octave;
}

/** Accord de trois sons sur un degré, dans la gamme de la zone. */
function chordNotes(theme: ZoneTheme, degree: number): number[] {
  return [degree, degree + 2, degree + 4].map((step) => degreeMidi(theme, step));
}

const PAD_GAIN = 0.045;

/** Nappe : un accord tenu, en cloche, qui chevauche le suivant d'une seconde et se referme sur la boucle. */
function addThemePad(out: Samples, sampleRate: number, theme: ZoneTheme, notes: readonly number[], start: number): void {
  const length = Math.ceil((theme.chordSeconds + 1) * sampleRate);
  const first = Math.floor(start * sampleRate);
  const voices = [...notes.map(noteHz), noteHz(notes[0] - 12)];
  const detune = theme.pad === 'choir' ? 1.006 : 1.003;
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const envelope = Math.sin((Math.PI * t) / (theme.chordSeconds + 1)) ** 2;
    let sample = 0;
    for (const hz of voices) {
      sample += padWave(theme.pad, hz * t) + padWave(theme.pad, hz * detune * t);
      if (theme.pad === 'choir') {
        // Troisième voix un peu basse : le chœur gagne de l'épaisseur
        sample += 0.6 * padWave(theme.pad, (hz / detune) * t);
      }
    }
    out[(first + i) % out.length] += sample * envelope * PAD_GAIN;
  }
}

/** Forme d'onde de la nappe, à la phase donnée (en tours). */
function padWave(voice: PadVoice, cycles: number): number {
  const phase = cycles % 1;
  switch (voice) {
    case 'warm':
      // Sinus enrichi de son octave : plus rond qu'une sinusoïde seule
      return fastSine(cycles) + 0.3 * fastSine(2 * cycles);
    case 'brass':
      // Dents de scie adoucies : cuivré sans être agressif
      return 0.7 * (2 * phase - 1) * (1 - Math.abs(2 * phase - 1) * 0.5);
    default:
      return fastSine(cycles);
  }
}

/** Une note de mélodie, avec le timbre de la zone. */
function addLeadNote(out: Samples, sampleRate: number, voice: LeadVoice, start: number, midi: number): void {
  const hz = noteHz(midi);
  switch (voice) {
    case 'bell':
      addTone(out, sampleRate, { start, hz, decay: 0.6, gain: 0.22 });
      addTone(out, sampleRate, { start, hz: hz * 2.76, decay: 0.25, gain: 0.08 });
      return;
    case 'glass':
      addTone(out, sampleRate, { start, hz, decay: 0.45, gain: 0.2 });
      addTone(out, sampleRate, { start, hz: hz * 2, decay: 0.3, gain: 0.07 });
      return;
    case 'flute':
      addFlute(out, sampleRate, start, hz);
      return;
    default:
      addTone(out, sampleRate, { start, hz, decay: 0.35, gain: 0.25, triangle: true });
  }
}

/** Flûte : attaque lente, léger vibrato, souffle doux. */
function addFlute(out: Samples, sampleRate: number, start: number, hz: number): void {
  const seconds = 1.2;
  const first = Math.floor(start * sampleRate);
  const length = Math.min(out.length - first, Math.ceil(seconds * sampleRate));
  let phase = 0;
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    phase += (hz * (1 + 0.006 * Math.sin(TAU * 5 * t))) / sampleRate;
    const envelope = Math.min(1, t / 0.12) * Math.exp(-t / 0.7);
    out[first + i] += Math.sin(TAU * phase) * envelope * 0.18;
  }
}

/** Percussion de la zone, sur toute la boucle. */
function addPercussion(out: Samples, sampleRate: number, theme: ZoneTheme, seconds: number): void {
  const beat = theme.chordSeconds / 4;
  const random = seededNoise(theme.root * 7 + theme.chords.length);
  for (let start = 0, index = 0; start < seconds - 0.5; start += beat, index++) {
    switch (theme.percussion) {
      case 'taps':
        // Coups de pioche lointains, un temps sur deux
        if (index % 2 === 1) {
          addNoise(out, sampleRate, { start, decay: 0.012, gain: 0.12, brightness: 0.5, seed: 11 + index });
        }
        break;
      case 'anvil':
        // Enclume au loin, au premier temps de chaque accord
        if (index % 4 === 0) {
          addTone(out, sampleRate, { start, hz: 1040, decay: 0.12, gain: 0.07 });
          addTone(out, sampleRate, { start, hz: 2870, decay: 0.06, gain: 0.04 });
        }
        break;
      case 'drum':
        // Tambour grave sur les temps forts, plus léger sur les autres
        addTone(out, sampleRate, { start, hz: 90, endHz: 50, decay: 0.12, gain: index % 2 === 0 ? 0.28 : 0.12 });
        break;
      case 'heartbeat':
        // Deux battements rapprochés par accord, comme un cœur
        if (index % 4 === 0) {
          addTone(out, sampleRate, { start, hz: 70, endHz: 45, decay: 0.1, gain: 0.3 });
          addTone(out, sampleRate, { start: start + 0.25, hz: 65, endHz: 42, decay: 0.09, gain: 0.2 });
        }
        break;
      case 'drops':
        // Gouttes d'eau, tombées au hasard
        if ((random() + 1) / 2 < 0.3) {
          addTone(out, sampleRate, { start, hz: 1800, endHz: 900, decay: 0.03, gain: 0.08 });
        }
        break;
      default:
        break;
    }
  }
}

/** Bourdon : la tonique grave, qui respire lentement sur toute la boucle. */
function addDrone(out: Samples, sampleRate: number, theme: ZoneTheme): void {
  const seconds = out.length / sampleRate;
  // Un nombre entier de périodes par boucle : la sinusoïde se raccorde à elle-même, sans clic à la reprise
  const hz = Math.round(noteHz(theme.root - 12) * seconds) / seconds;
  // Un nombre entier de respirations par boucle : le bourdon se referme sans à-coup
  const breaths = Math.max(1, Math.round(seconds / 8));
  for (let i = 0; i < out.length; i++) {
    const t = i / sampleRate;
    const swell = 0.6 + 0.4 * Math.sin((TAU * breaths * t) / seconds);
    out[i] += fastSine(hz * t) * swell * 0.06;
  }
}

/** Musique de la zone, en boucle parfaite : nappe, mélodie avec écho, percussion et bourdon. */
export function renderZoneMusic(zone: number, sampleRate: number): Samples {
  const theme = zoneTheme(zone);
  const seconds = themeLoopSeconds(theme);
  const out = buffer(seconds, sampleRate);
  const melody = new Float32Array(out.length);
  const random = seededNoise(zone * 101 + 7);
  theme.chords.forEach((degree, index) => addThemePad(out, sampleRate, theme, chordNotes(theme, degree), index * theme.chordSeconds));
  const step = theme.chordSeconds / theme.steps;
  // Pas de note dans la dernière seconde et demie : sa traîne serait coupée net en fin de boucle
  for (let start = 0; start < seconds - 1.5; start += step) {
    if ((random() + 1) / 2 >= theme.density) {
      continue;
    }
    const chord = theme.chords[Math.floor(start / theme.chordSeconds)];
    // La mélodie préfère les notes de l'accord du moment, et s'en écarte parfois d'un degré
    const offset = [0, 2, 4, 0, 2, 4, 1, 5][Math.floor(((random() + 1) / 2) * 8) % 8];
    addLeadNote(melody, sampleRate, theme.lead, start, degreeMidi(theme, chord + offset) + theme.leadOctave);
  }
  // Écho circulaire : les répétitions de fin de boucle reviennent au début
  const delay = Math.round(theme.echo * sampleRate);
  for (let i = 0; i < melody.length; i++) {
    out[i] += melody[i];
    out[(i + delay) % out.length] += melody[i] * theme.echoFeedback;
    out[(i + 2 * delay) % out.length] += melody[i] * theme.echoFeedback ** 2;
  }
  addPercussion(out, sampleRate, theme, seconds);
  if (theme.drone) {
    addDrone(out, sampleRate, theme);
  }
  return normalize(out);
}
