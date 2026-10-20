// Règles pures des tenues : une tenue est à soi dès que sa zone est terminée. Rien n'est stocké à part le choix porté.
import { Outfit, OUTFITS } from '../balance/outfits';

export function ownsOutfit(outfit: Outfit, zonesCleared: number): boolean {
  return zonesCleared >= outfit.zone;
}

export function ownedOutfits(zonesCleared: number): readonly Outfit[] {
  return OUTFITS.filter((outfit) => ownsOutfit(outfit, zonesCleared));
}

/** D'où vient une tenue, en clair. */
export function outfitSourceLabel(outfit: Outfit): string {
  return `Terminer la zone ${outfit.zone}`;
}

export function isValidOutfitChoice(value: unknown): value is { readonly worn: string | null } {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const { worn } = value as Record<string, unknown>;
  return worn === null || (typeof worn === 'string' && OUTFITS.some((outfit) => outfit.id === worn));
}
