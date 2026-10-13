// Catalogue des sons du jeu, fabriqués par synth.ts. Fichier pur, sans Angular.
import { tierIndex } from '../balance/balance';
import type { TierId } from '../equipment/equipment.model';

export const SOUND_IDS = [
  'strike',
  'crit',
  'shard',
  'rockBreak',
  'blast',
  'forgeCommon',
  'forgeRare',
  'forgeEpic',
  'forgeLegendary',
  'sell',
  'artifact',
  'upgrade',
] as const;
export type SoundId = (typeof SOUND_IDS)[number];

/** Volume propre à chaque son, pour que le coup de pioche, entendu sans arrêt, reste discret. */
export const SOUND_GAIN: Readonly<Record<SoundId, number>> = {
  strike: 0.35,
  crit: 0.6,
  shard: 0.5,
  rockBreak: 0.7,
  blast: 0.8,
  forgeCommon: 0.6,
  forgeRare: 0.7,
  forgeEpic: 0.8,
  forgeLegendary: 0.9,
  sell: 0.5,
  artifact: 0.9,
  upgrade: 0.8,
};

/** Écart minimal entre deux lectures d'un même son : au-delà de 2 coups par seconde, ils se chevaucheraient. */
export const SOUND_MIN_INTERVAL_MS = 70;

/** Les coups varient un peu de hauteur pour ne pas sonner comme une boucle (±6 %). */
export const PITCH_SPREAD = 0.06;
export const VARIED_SOUNDS: ReadonlySet<SoundId> = new Set<SoundId>(['strike', 'crit', 'shard', 'rockBreak']);

/**
 * Son de forge selon le palier de l'objet : plus il est haut, plus il sonne riche.
 * Bois à Cuivre, Fer à Or, Mithril et Cristal, Magma et Divin.
 */
export function forgeSound(tier: TierId): SoundId {
  const index = tierIndex(tier);
  if (index >= 8) {
    return 'forgeLegendary';
  }
  if (index >= 6) {
    return 'forgeEpic';
  }
  return index >= 3 ? 'forgeRare' : 'forgeCommon';
}

/** Volumes proposés dans les paramètres, du plus fort au coupé. */
export const VOLUME_STEPS: readonly number[] = [1, 0.5, 0.25, 0];
export const DEFAULT_SOUND_VOLUME = 1;
/** La musique accompagne sans couvrir les bruitages : moyenne par défaut. */
export const DEFAULT_MUSIC_VOLUME = 0.5;
