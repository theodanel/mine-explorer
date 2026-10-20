// Tenues du dragon : une collection cosmétique, sans stat par tenue. Lot 7 des idées inspirées de Forge Master
// (demande de Théo, 19/10/2026). Voir docs/game-design/tenues.md (et les prompts Gemini des visuels).
import type { DungeonId } from './dungeons';

export type OutfitPart = 'scarf' | 'helmet' | 'lamp';

/** D'où vient une tenue : la fin d'une zone du passe de progression, ou un palier de niveau d'un donjon. */
export type OutfitSource =
  | { readonly kind: 'pass'; readonly zone: number }
  | { readonly kind: 'dungeon'; readonly dungeon: DungeonId; readonly level: number };

export interface Outfit {
  readonly id: string;
  readonly label: string;
  readonly part: OutfitPart;
  readonly source: OutfitSource;
}

const PASS_OUTFITS: readonly [string, string, OutfitPart][] = [
  ['foulard-bleu', 'Foulard bleu', 'scarf'],
  ['foulard-vert', 'Foulard vert', 'scarf'],
  ['lampe-cuivre', 'Lampe cuivrée', 'lamp'],
  ['casque-rivete', 'Casque riveté', 'helmet'],
  ['foulard-braise', 'Foulard de braise', 'scarf'],
  ['lampe-doree', 'Lampe dorée', 'lamp'],
  ['casque-elfique', 'Casque elfique', 'helmet'],
  ['foulard-cristal', 'Foulard de cristal', 'scarf'],
  ['lampe-magma', 'Lampe de magma', 'lamp'],
  ['casque-divin', 'Casque divin', 'helmet'],
  ['foulard-mousse', 'Foulard de mousse', 'scarf'],
  ['lampe-obsidienne', "Lampe d'obsidienne", 'lamp'],
  ['casque-givre', 'Casque de givre', 'helmet'],
  ['foulard-ombre', "Foulard d'ombre", 'scarf'],
  ['lampe-aurore', "Lampe d'aurore", 'lamp'],
  ['casque-corail', 'Casque de corail', 'helmet'],
  ['foulard-etoile', 'Foulard étoilé', 'scarf'],
  ['lampe-spectrale', 'Lampe spectrale', 'lamp'],
  ['casque-gardien', 'Casque du gardien', 'helmet'],
  ['foulard-coeur', 'Foulard du Cœur', 'scarf'],
];

/** Une tenue tous les 10 niveaux de chaque donjon, jusqu'au niveau 50. */
export const DUNGEON_OUTFIT_STEP = 10;
const DUNGEON_OUTFITS: Readonly<Record<DungeonId, readonly [string, string, OutfitPart][]>> = {
  crystal: [
    ['lampe-amethyste', "Lampe d'améthyste", 'lamp'],
    ['foulard-geode', 'Foulard géode', 'scarf'],
    ['casque-quartz', 'Casque de quartz', 'helmet'],
    ['lampe-prisme', 'Lampe prismatique', 'lamp'],
    ['casque-cristal-royal', 'Casque de cristal royal', 'helmet'],
  ],
  forge: [
    ['foulard-suie', 'Foulard de suie', 'scarf'],
    ['lampe-enclume', "Lampe d'enclume", 'lamp'],
    ['casque-nain', 'Casque nain', 'helmet'],
    ['foulard-forgeron', 'Foulard de forgeron', 'scarf'],
    ['casque-ancetre', "Casque de l'ancêtre", 'helmet'],
  ],
};

export const OUTFITS: readonly Outfit[] = [
  ...PASS_OUTFITS.map(([id, label, part], index) => ({ id, label, part, source: { kind: 'pass' as const, zone: index + 1 } })),
  ...(Object.entries(DUNGEON_OUTFITS) as [DungeonId, readonly [string, string, OutfitPart][]][]).flatMap(([dungeon, list]) =>
    list.map(([id, label, part], index) => ({
      id,
      label,
      part,
      source: { kind: 'dungeon' as const, dungeon, level: (index + 1) * DUNGEON_OUTFIT_STEP },
    })),
  ),
];

/** La collection : +1 % de Puissance (en Frappe) par tranche de 5 tenues, +5 % au plus. */
export const OUTFITS_PER_BONUS = 5;
export const OUTFIT_BONUS_STEP = 0.01;
export const OUTFIT_BONUS_MAX = 0.05;

export function outfitCollectionBonus(owned: number): number {
  return Math.min(Math.floor(owned / OUTFITS_PER_BONUS) * OUTFIT_BONUS_STEP, OUTFIT_BONUS_MAX);
}
