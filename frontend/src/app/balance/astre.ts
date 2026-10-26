// Équilibrage de l'Astre du Cœur (choix de Théo, 26/10/2026), qui remplace l'anneau de runes de la Forge du Cœur :
// un cercle à 5 pointes qui flotte derrière le mineur, qu'on nourrit avec les ressources des Échos. Ses 5 stades sont
// les 5 étoiles de la Légende du Cœur du monde. Voir docs/game-design/astre-du-coeur.md. Simulé par tools/simulate.mts.
import type { BonusId } from './skill-tree';
import type { EssenceId } from './heart-forge';
import { REBIRTH_MIN_ZONE } from './rebirth';

export const ASTRE_STAGES = 5;

/**
 * Ressources données au total pour atteindre chaque stade (index 0 : stade 1). Au simulateur (régulier), les étoiles
 * arrivent aux jours 19, 26, 34, 44 et 58 : ce sont les objets forgés des missions qui les rythment, l'Astre suit.
 * Avec les runes de l'anneau, la 5e étoile arrivait au jour 67 : c'était la rune de rang 5 qui la retenait.
 */
export const ASTRE_STAGE_TOTALS = [10, 35, 110, 300, 1300] as const;

/** Stade de l'Astre (0 à 5) pour tant de ressources données. */
export function astreStage(fed: number): number {
  return ASTRE_STAGE_TOTALS.filter((total) => fed >= total).length;
}

/** Ce que chaque ressource renforce, et sa valeur pour un Astre nourri uniquement d'elle au stade 5. */
export const ASTRE_ELEMENT_BONUS: Readonly<Record<EssenceId, { readonly bonus: BonusId; readonly full: number }>> = {
  ember: { bonus: 'strikePct', full: 0.5 },
  frost: { bonus: 'critChance', full: 0.04 },
  mist: { bonus: 'critDamage', full: 0.6 },
  sap: { bonus: 'speed', full: 0.1 },
  dawn: { bonus: 'goldPct', full: 0.5 },
};

/** Part de ce bonus atteinte à chaque stade (index 0 : stade 1). */
export const ASTRE_STAGE_POWER = [0.1, 0.2, 0.4, 0.7, 1] as const;

/** Frappe de l'Astre : une part de la Frappe du mineur, toutes les ASTRE_STRIKE_MS (index 0 : stade 1). */
export const ASTRE_STRIKE_SHARE = [0.05, 0.08, 0.15, 0.2, 0.3] as const;
export const ASTRE_STRIKE_MS = 2000;

/** Chance de ramasser une ressource de plus sur un filon d'Écho (index 0 : stade 1). */
export const ASTRE_ECHO_BONUS_CHANCE = [0, 0.1, 0.1, 0.2, 0.2] as const;

/** Pluie d'étoiles sur le gardien au début du combat, en Frappes du mineur (stades 4 et 5). */
export const ASTRE_GUARDIAN_STRIKES = [0, 0, 0, 3, 6] as const;

/** Couleur de chaque ressource sur l'Astre (0xRRGGBB) : il prend la couleur de sa nourriture. */
export const ASTRE_COLORS: Readonly<Record<EssenceId, number>> = {
  ember: 0xff5a2e,
  frost: 0x5ad1ff,
  mist: 0xb36bff,
  sap: 0x7ad65a,
  dawn: 0xffd34d,
};

/**
 * Constellation (choix de Théo, 26/10/2026) : après Supernova, l'Astre continue de grandir pour la fin de jeu. Chaque
 * renaissance ouvre un niveau de plus. Pour l'allumer, il faut le nourrir et réussir son épreuve : atteindre une zone
 * dans la vie en cours, plus profonde à chaque niveau, alors que les filons durcissent à chaque renaissance. Ce qu'on
 * donne en avance compte pour le niveau suivant. Les Échos rapportent environ 10 ressources par jour au simulateur
 * (plus avec la Mémoire du Cœur) : le 1er niveau demande quelques jours de récolte, chaque niveau suivant 20 % de plus.
 */
export const ASTRE_CONSTELLATION_FIRST_COST = 120;
export const ASTRE_CONSTELLATION_COST_GROWTH = 1.2;
/** Chaque niveau ajoute la moitié de la puissance de Supernova à ses bonus, à sa frappe et à sa pluie d'étoiles. */
export const ASTRE_CONSTELLATION_POWER = 0.5;
const COST_ROUNDING = 10;

/** Ressources à donner pour ce niveau de Constellation (1 et plus). */
export function constellationCost(level: number): number {
  const raw = ASTRE_CONSTELLATION_FIRST_COST * ASTRE_CONSTELLATION_COST_GROWTH ** (level - 1);
  return Math.round(raw / COST_ROUNDING) * COST_ROUNDING;
}

/** Épreuve de la Constellation : zones de plus que la renaissance à atteindre dans la vie, par niveau. */
export const ASTRE_CONSTELLATION_ZONES_PER_LEVEL = 2;

/** Zone à atteindre dans la vie en cours pour allumer ce niveau de Constellation (1 et plus). */
export function constellationZone(level: number): number {
  return REBIRTH_MIN_ZONE + ASTRE_CONSTELLATION_ZONES_PER_LEVEL * level;
}
