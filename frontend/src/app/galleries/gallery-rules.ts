// Règles pures des embranchements : galeries proposées, minerai arrondi au hasard, validation de la sauvegarde.
import { GALLERY_IDS, GALLERY_OFFER_SIZE, GalleryId, OFFERED_GALLERIES } from '../balance/galleries';
import type { Random } from '../shared/random';

/** Deux galeries différentes, tirées parmi celles qu'on peut proposer. */
export function rollOffer(random: Random): readonly GalleryId[] {
  const pool = [...OFFERED_GALLERIES];
  const offer: GalleryId[] = [];
  while (offer.length < GALLERY_OFFER_SIZE && pool.length > 0) {
    const index = Math.min(Math.floor(random() * pool.length), pool.length - 1);
    offer.push(...pool.splice(index, 1));
  }
  return offer;
}

/**
 * Multiplie une quantité entière sans perdre la fraction en moyenne : 1 minerai ×1,5 donne 1 ou 2,
 * 2 une fois sur deux.
 */
export function scaleAmount(amount: number, multiplier: number, random: Random): number {
  const scaled = amount * multiplier;
  const whole = Math.floor(scaled);
  const fraction = scaled - whole;
  // Sans fraction, aucun tirage : la galerie ordinaire ne consomme pas de hasard
  return fraction > 0 && random() < fraction ? whole + 1 : whole;
}

export interface GalleryState {
  /** Zone à laquelle s'applique la galerie choisie. */
  readonly zone: number;
  readonly gallery: GalleryId;
  /** Galeries encore proposées, ou null une fois le choix fait ou passé. */
  readonly offer: readonly GalleryId[] | null;
}

const isGalleryId = (value: unknown): value is GalleryId => (GALLERY_IDS as readonly unknown[]).includes(value);

export function isValidGalleryState(value: unknown): value is GalleryState {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const { zone, gallery, offer } = value as Record<string, unknown>;
  return (
    Number.isSafeInteger(zone) &&
    (zone as number) >= 1 &&
    isGalleryId(gallery) &&
    (offer === null || (Array.isArray(offer) && offer.every(isGalleryId)))
  );
}
