// Équilibrage du Puits sans fond : descendre le plus loin possible en un temps limité, 3 fois par jour.
// Fichier pur, comme balance.ts, simulé par tools/simulate.mts. Voir docs/game-design/puits-sans-fond.md.
import { type EvolutionId, rockHp, STAGES_PER_ZONE } from './balance';

/** Le Puits s'ouvre avec le Contremaître : à partir de là, le build compte et l'or commence à manquer. */
export const ABYSS_UNLOCK_FORM: EvolutionId = 'foreman';

/** Essais par jour, remis à 3 à minuit (heure du joueur). */
export const ABYSS_DAILY_RUNS = 3;

/** Durée d'une descente : courte, pour un moment intense sans lasser. */
export const ABYSS_RUN_MS = 30_000;

/**
 * Chaque étage est un filon de la mine, deux filons plus profond que le précédent : l'étage 1 vaut le 5-1,
 * l'étage 8 le 5-15, l'étage 30 le 8-14. Les PV suivent donc la courbe de la mine (+15 % par étage) : seule
 * la Puissance du build fait descendre plus loin, et chaque étage coûte un peu plus que le précédent.
 */
const FIRST_FLOOR_ZONE = 5;
const STAGES_PER_FLOOR = 2;

/** Tous les 10 étages, un gardien : un filon trois fois plus dur, qui marque le palier. */
export const GUARDIAN_EVERY = 10;
const GUARDIAN_HP_FACTOR = 3;

export function floorHp(floor: number): number {
  const index = (FIRST_FLOOR_ZONE - 1) * STAGES_PER_ZONE + (floor - 1) * STAGES_PER_FLOOR;
  const zone = Math.floor(index / STAGES_PER_ZONE) + 1;
  const stage = (index % STAGES_PER_ZONE) + 1;
  const hp = rockHp(zone, stage);
  return floor % GUARDIAN_EVERY === 0 ? hp * GUARDIAN_HP_FACTOR : hp;
}

/** Récompense d'une descente : 1 éclat par étage franchi (2 accéléraient la pioche 30 d'un jour et demi). */
export const SHARDS_PER_FLOOR = 1;

/**
 * Record personnel : chaque palier de 5 étages atteint pour la première fois donne une fois pour toutes
 * 20 éclats et 2 pierres d'éveil. C'est le seul endroit, avec le Défi, où les pierres tombent régulièrement.
 */
export const RECORD_STEP = 5;
export const RECORD_SHARDS = 20;
export const RECORD_STONES = 2;
