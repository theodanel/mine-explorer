// Équilibrage des runes d'équipement : les runes du Creuset serties sur les emplacements d'équipement, dès la
// 1re étoile du Cœur du monde. Voir docs/game-design/runes-d-equipement.md (demande de Théo, 19/10/2026).
import type { StatId } from '../equipment/equipment.model';
import type { AllianceRune, RuneElement } from './heart-forge';
import type { BonusId } from './skill-tree';

/** Châsses par emplacement : une par étoile du Cœur du monde, trois au plus (dès la 3e étoile). */
export const GEAR_SOCKETS_MAX = 3;

export function gearSocketCount(stars: number): number {
  return Math.min(Math.max(stars, 0), GEAR_SOCKETS_MAX);
}

/** Ce que renforce une rune élémentaire, et de combien à chaque rang (1 à 5). */
export interface ElementEffect {
  readonly bonus: BonusId;
  readonly values: readonly [number, number, number, number, number];
}

/**
 * Chaque rang vaut environ deux fois le précédent, pour une rune qui en demande trois : la fusion reste un vrai choix,
 * et les rangs 4 et 5 restent une affaire de fin de partie. Calé au simulateur (régulier, 200 jours).
 */
export const ELEMENT_EFFECTS: Readonly<Record<RuneElement, ElementEffect>> = {
  fire: { bonus: 'strikePct', values: [0.05, 0.12, 0.25, 0.5, 1] },
  light: { bonus: 'goldPct', values: [0.05, 0.12, 0.25, 0.5, 1] },
  earth: { bonus: 'speed', values: [0.012, 0.03, 0.06, 0.1, 0.18] },
  ice: { bonus: 'critChance', values: [0.006, 0.015, 0.03, 0.05, 0.08] },
  shadow: { bonus: 'critDamage', values: [0.06, 0.15, 0.3, 0.6, 1.2] },
};

/** Les éléments d'une rune d'alliance : ceux de sa recette au Creuset. */
export const ALLIANCE_ELEMENTS: Readonly<Record<AllianceRune, readonly RuneElement[]>> = {
  magma: ['fire', 'earth'],
  storm: ['ice', 'shadow'],
  grove: ['earth', 'light'],
  eclipse: ['shadow', 'light'],
  heart: ['fire', 'ice', 'light'],
};

/**
 * Une rune d'alliance vaut 120 % d'une rune élémentaire du même rang, partagés entre ses éléments : plus polyvalente,
 * un peu plus forte au total, puisque sa recette est à découvrir.
 */
export const ALLIANCE_TOTAL_SHARE = 1.2;

/** Rune sertie sur l'emplacement dont c'est l'esprit (Feu sur la pioche, Lumière sur le sac…) : +50 %. */
export const AFFINITY_MULTIPLIER = 1.5;
/** Résonance : les trois châsses d'un emplacement serties de la même rune, même rang ou non : +25 %. */
export const RESONANCE_MULTIPLIER = 1.25;

/** Bonus qui correspond à la stat d'Atelier d'un emplacement, pour l'affinité. */
export const STAT_BONUS: Readonly<Record<StatId, BonusId>> = {
  strikePower: 'strikePct',
  miningSpeed: 'speed',
  critChance: 'critChance',
  critDamage: 'critDamage',
  goldBonus: 'goldPct',
};
