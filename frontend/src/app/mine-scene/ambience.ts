// Règles pures des animations de fond de la mine : l'ambiance de chaque zone (particules dessinées en code) et les
// passages rares d'une silhouette au fond de la grotte. Voir docs/game-design/animations-de-fond.md.
import type { Random } from '../shared/random';

/** Comment bougent les particules d'une ambiance. */
export type AmbienceMotion = 'drift' | 'fall' | 'rise' | 'twinkle';

export interface AmbiencePreset {
  readonly motion: AmbienceMotion;
  readonly count: number;
  readonly colors: readonly number[];
  /** Rayon, en pixels de scène. */
  readonly size: readonly [min: number, max: number];
  /** Vitesse, en pixels de scène par seconde (horizontale pour drift, verticale sinon). */
  readonly speed: readonly [min: number, max: number];
  /** Balancement horizontal, en pixels de scène. */
  readonly sway: number;
  /** Opacité au plus fort : l'ambiance reste discrète derrière le mineur. */
  readonly alpha: number;
  /** Gouttes : étirées dans le sens de la chute. */
  readonly stretch?: number;
}

export type AmbienceId =
  | 'dust'
  | 'glints'
  | 'drips'
  | 'embers'
  | 'fireflies'
  | 'crystals'
  | 'goldMotes'
  | 'snow'
  | 'bubbles'
  | 'fairyDust';

export const AMBIENCES: Readonly<Record<AmbienceId, AmbiencePreset>> = {
  dust: { motion: 'drift', count: 30, colors: [0xfff0d6], size: [1.5, 3.5], speed: [4, 10], sway: 10, alpha: 0.55 },
  glints: { motion: 'twinkle', count: 14, colors: [0xffe08a, 0xffb36b], size: [1.5, 3], speed: [0, 0], sway: 0, alpha: 0.8 },
  drips: { motion: 'fall', count: 6, colors: [0xa9d4e6], size: [2, 3], speed: [260, 340], sway: 0, alpha: 0.55, stretch: 3 },
  embers: { motion: 'rise', count: 30, colors: [0xffb04a, 0xffd36a, 0xff7a2a], size: [2, 4.5], speed: [25, 55], sway: 14, alpha: 1 },
  fireflies: { motion: 'drift', count: 12, colors: [0xfff1a0, 0xd9ff9a], size: [2.5, 4], speed: [8, 18], sway: 18, alpha: 0.85 },
  crystals: { motion: 'twinkle', count: 18, colors: [0xb98cff, 0x7fe3ff, 0xff9ce0], size: [1.5, 3.5], speed: [0, 0], sway: 0, alpha: 0.85 },
  goldMotes: { motion: 'rise', count: 22, colors: [0xffe9a8, 0xfff6d8], size: [1.5, 3], speed: [12, 26], sway: 10, alpha: 0.7 },
  snow: { motion: 'fall', count: 30, colors: [0xf4fbff], size: [1.5, 3.5], speed: [18, 40], sway: 16, alpha: 0.75 },
  bubbles: { motion: 'rise', count: 16, colors: [0xbfe9ff], size: [2, 5], speed: [20, 45], sway: 8, alpha: 0.45 },
  fairyDust: { motion: 'drift', count: 22, colors: [0xffb6e6, 0xffe2f4, 0xd9b8ff], size: [1.5, 3], speed: [6, 14], sway: 14, alpha: 0.8 },
};

/** Ambiance de chaque zone, de la 1 à la 20 : elle suit le décor (Théo, 17/10/2026). */
const ZONE_AMBIENCES: readonly AmbienceId[] = [
  'dust', // 1 Galerie des racines
  'dust', // 2 Carrière de pierre
  'glints', // 3 Veines de cuivre
  'drips', // 4 Mine de fer
  'embers', // 5 Forge naine
  'glints', // 6 Caverne d'or
  'fireflies', // 7 Ruines elfiques
  'crystals', // 8 Grotte de cristal
  'embers', // 9 Caverne de magma
  'goldMotes', // 10 Sanctuaire divin
  'fireflies', // 11 Forêt souterraine
  'snow', // 12 Lac gelé
  'bubbles', // 13 Cité naine engloutie
  'embers', // 14 Grotte d'obsidienne
  'crystals', // 15 Jardin de cristaux
  'embers', // 16 Nid de dragon
  'dust', // 17 Ruines anciennes
  'bubbles', // 18 Abysses
  'fairyDust', // 19 Royaume des fées
  'embers', // 20 Cœur du monde
];

/** Au-delà de la zone 20, le Cœur du monde garde son ambiance. */
export function zoneAmbience(zone: number): AmbiencePreset {
  const index = Math.min(Math.max(zone, 1), ZONE_AMBIENCES.length) - 1;
  return AMBIENCES[ZONE_AMBIENCES[index]];
}

/** Zone où vivent les particules, en pixels de scène : de sous le bandeau de zone jusqu'au sol du mineur. */
export const AMBIENCE_AREA = { left: 0, right: 720, top: 80, bottom: 700 } as const;

export interface Particle {
  x: number;
  y: number;
  /** Vitesse propre (horizontale pour drift, verticale sinon). */
  speed: number;
  size: number;
  color: number;
  /** Phase du balancement et du scintillement, en radians. */
  phase: number;
  alpha: number;
}

const TWO_PI = Math.PI * 2;
/** Vitesse du balancement et du scintillement, en radians par seconde. */
const SWAY_RATE = 1.4;
const TWINKLE_RATE = 2.2;

function between([min, max]: readonly [number, number], random: Random): number {
  return min + (max - min) * random();
}

/** Nouvelle particule, n'importe où dans la zone (au départ) ou à son bord d'entrée (en cours de route). */
export function spawnParticle(preset: AmbiencePreset, random: Random, anywhere: boolean): Particle {
  const { left, right, top, bottom } = AMBIENCE_AREA;
  let y = top + (bottom - top) * random();
  if (!anywhere && preset.motion === 'fall') {
    y = top;
  } else if (!anywhere && preset.motion === 'rise') {
    y = bottom;
  }
  const speed = between(preset.speed, random) * (preset.motion === 'drift' && random() < 0.5 ? -1 : 1);
  let x = left + (right - left) * random();
  // Une poussière qui sort d'un côté revient par l'autre, dans le sens de sa dérive
  if (!anywhere && preset.motion === 'drift') {
    x = speed > 0 ? left : right;
  }
  return {
    x,
    y,
    speed,
    size: between(preset.size, random),
    color: preset.colors[Math.floor(random() * preset.colors.length)],
    // Un éclat commence au début de son scintillement, qui dure une demi-période
    phase: (preset.motion === 'twinkle' ? Math.PI : TWO_PI) * random(),
    alpha: preset.motion === 'twinkle' ? 0 : preset.alpha,
  };
}

/**
 * Fait avancer une particule de `seconds` ; renvoie une nouvelle particule à la place de celle qui sort de la zone
 * (ou d'un éclat qui a fini de scintiller).
 */
export function stepParticle(particle: Particle, preset: AmbiencePreset, seconds: number, random: Random): Particle {
  const { left, right, top, bottom } = AMBIENCE_AREA;
  const phase = particle.phase + seconds * (preset.motion === 'twinkle' ? TWINKLE_RATE : SWAY_RATE);
  const sway = Math.sin(phase) * preset.sway * seconds;
  const next: Particle = { ...particle, phase };
  switch (preset.motion) {
    case 'drift':
      next.x += particle.speed * seconds;
      next.y += sway;
      next.alpha = preset.alpha * (0.6 + 0.4 * Math.sin(phase * 1.7));
      break;
    case 'fall':
      next.y += particle.speed * seconds;
      next.x += sway;
      break;
    case 'rise': {
      next.y -= particle.speed * seconds;
      next.x += sway;
      // Les braises et les bulles s'éteignent en montant
      next.alpha = preset.alpha * Math.min(1, (next.y - top) / ((bottom - top) / 2));
      break;
    }
    case 'twinkle':
      // Un éclat brille une fois (une demi-sinusoïde), puis réapparaît ailleurs
      next.alpha = preset.alpha * Math.max(0, Math.sin(phase));
      if (phase >= Math.PI) {
        return spawnParticle(preset, random, true);
      }
      break;
  }
  const outside = next.x < left || next.x > right || next.y < top || next.y > bottom;
  return outside ? spawnParticle(preset, random, false) : next;
}

// ─── Passages rares ─────────────────────────────────────────────────────────

export type PasserId = 'bats' | 'dwarfCart' | 'crystalGolem' | 'fireDragon' | 'divineDragon' | 'abyssWhale' | 'fairies';

export interface Passer {
  /** Image Gemini détourée (art-source/passages), tournée vers la droite. */
  readonly url: string;
  /** Largeur à l'écran, en pixels de scène. */
  readonly width: number;
  /** Hauteur de son passage (milieu de la silhouette), en pixels de scène. */
  readonly y: number;
  /** Durée de la traversée, en secondes. */
  readonly seconds: number;
  /** Assombrissement propre : une créature lumineuse le reste un peu plus que les autres. */
  readonly tint?: number;
}

export const PASSERS: Readonly<Record<PasserId, Passer>> = {
  bats: { url: 'assets/ui/passages/chauves-souris.webp', width: 200, y: 270, seconds: 9 },
  // Ceux qui marchent passent sur un sol plus lointain, un peu au-dessus de celui du mineur
  dwarfCart: { url: 'assets/ui/passages/wagonnet.webp', width: 190, y: 545, seconds: 22 },
  crystalGolem: { url: 'assets/ui/passages/golem.webp', width: 140, y: 540, seconds: 26 },
  fireDragon: { url: 'assets/ui/passages/dragon-feu.webp', width: 300, y: 300, seconds: 14 },
  divineDragon: { url: 'assets/ui/passages/dragon-divin.webp', width: 320, y: 280, seconds: 16, tint: 0xd8ccb6 },
  abyssWhale: { url: 'assets/ui/passages/baleine.webp', width: 340, y: 320, seconds: 24 },
  fairies: { url: 'assets/ui/passages/fees.webp', width: 170, y: 330, seconds: 12 },
};

/** Silhouette qui peut passer dans chaque zone, de la 1 à la 20. */
const ZONE_PASSERS: readonly PasserId[] = [
  'bats', 'bats', 'bats', 'bats',
  'dwarfCart', 'dwarfCart',
  'crystalGolem', 'crystalGolem',
  'fireDragon',
  'divineDragon',
  'bats',
  'abyssWhale',
  'dwarfCart',
  'fireDragon',
  'crystalGolem',
  'fireDragon',
  'fairies',
  'abyssWhale',
  'fairies',
  'divineDragon',
];

/** La silhouette qui passe dans la zone ; au-delà de la zone 20, celle du Cœur du monde. */
export function zonePasser(zone: number): Passer {
  const index = Math.min(Math.max(zone, 1), ZONE_PASSERS.length) - 1;
  return PASSERS[ZONE_PASSERS[index]];
}

/** Une silhouette passe toutes les 2 à 4 minutes ; la première un peu plus tôt, pour qu'on la remarque. */
export const PASSER_DELAY_SECONDS: readonly [min: number, max: number] = [120, 240];
export const FIRST_PASSER_DELAY_SECONDS: readonly [min: number, max: number] = [40, 80];

export function passerDelay(random: Random, first: boolean): number {
  return between(first ? FIRST_PASSER_DELAY_SECONDS : PASSER_DELAY_SECONDS, random);
}
