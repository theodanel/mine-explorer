// Règles pures des tenues : une tenue est à soi dès que sa source est atteinte. Rien n'est stocké à part le choix
// porté : récupérer un palier du passe ou battre un niveau de donjon suffit, même avant l'arrivée des tenues.
import type { DungeonId } from '../balance/dungeons';
import { Outfit, OUTFITS } from '../balance/outfits';
import { PASS_TIERS_PER_ZONE } from '../balance/progress-pass';

export interface OutfitProgress {
  /** Paliers du passe déjà récupérés. */
  readonly passClaimed: number;
  /** Meilleur niveau battu de chaque donjon. */
  readonly dungeonBest: Readonly<Record<DungeonId, number>>;
}

export function ownsOutfit(outfit: Outfit, progress: OutfitProgress): boolean {
  const { source } = outfit;
  return source.kind === 'pass'
    ? progress.passClaimed >= source.zone * PASS_TIERS_PER_ZONE
    : progress.dungeonBest[source.dungeon] >= source.level;
}

export function ownedOutfits(progress: OutfitProgress): readonly Outfit[] {
  return OUTFITS.filter((outfit) => ownsOutfit(outfit, progress));
}

/** D'où vient une tenue, en clair. */
export function outfitSourceLabel(outfit: Outfit, dungeonLabel: (id: DungeonId) => string): string {
  const { source } = outfit;
  return source.kind === 'pass' ? `Passe : fin de la zone ${source.zone}` : `${dungeonLabel(source.dungeon)} : niveau ${source.level}`;
}

export function isValidOutfitChoice(value: unknown): value is { readonly worn: string | null } {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const { worn } = value as Record<string, unknown>;
  return worn === null || (typeof worn === 'string' && OUTFITS.some((outfit) => outfit.id === worn));
}
