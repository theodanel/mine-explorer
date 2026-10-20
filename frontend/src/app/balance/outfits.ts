// Tenues du dragon : une collection cosmétique, sans stat par tenue, une par zone terminée. Lot 7 des idées inspirées de Forge Master
// (demande de Théo, 19/10/2026). Voir docs/game-design/tenues.md (et les prompts Gemini des visuels).

export type OutfitPart = 'scarf' | 'helmet' | 'lamp';

export interface Outfit {
  readonly id: string;
  readonly label: string;
  readonly part: OutfitPart;
  /** Zone à terminer (gardien battu) pour gagner la tenue. */
  readonly zone: number;
}

/** Une tenue par zone terminée, de la 1 à la 20. */
const ZONE_OUTFITS: readonly [string, string, OutfitPart][] = [
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

export const OUTFITS: readonly Outfit[] = ZONE_OUTFITS.map(([id, label, part], index) => ({ id, label, part, zone: index + 1 }));

/** La collection : +1 % de Puissance (en Frappe) par tranche de 5 tenues, +4 % avec les 20. */
export const OUTFITS_PER_BONUS = 5;
export const OUTFIT_BONUS_STEP = 0.01;
export const OUTFIT_BONUS_MAX = 0.04;

export function outfitCollectionBonus(owned: number): number {
  return Math.min(Math.floor(owned / OUTFITS_PER_BONUS) * OUTFIT_BONUS_STEP, OUTFIT_BONUS_MAX);
}
