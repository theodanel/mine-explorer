// Équilibrage de la Chasse au filon : « Quitte ou double », une file de rochers à casser l'un après l'autre,
// 3 parties par jour. Voir docs/game-design/chasse-au-filon.md.
import { type EvolutionId, goldForDamage, recommendedPower, rockHp } from './balance';

/** La Chasse s'ouvre au Contremaître, avec le Puits (elle remplace le Wagonnet fou, 14/10/2026). */
export const MINEHUNT_UNLOCK_FORM: EvolutionId = 'foreman';
export const MINEHUNT_DAILY_RUNS = 3;

/** Dix rochers au plus dans la file ; casser le dernier encaisse d'office, avec un bonus. */
export const ROCKS_PER_RUN = 10;

/**
 * Risque d'éboulement : 8 % au premier rocher, 4 % de plus à chaque rocher cassé (44 % au dixième). La Chance
 * (bonus d'or) le réduit : −30 % du risque pour +100 % d'or, au plus −40 %.
 */
const BASE_CAVE_IN = 0.08;
const CAVE_IN_STEP = 0.04;
const LUCK_REDUCTION = 0.3;
const MAX_LUCK_REDUCTION = 0.4;

export function caveInChance(rock: number, goldBonus: number): number {
  const reduction = Math.min(Math.max(goldBonus, 0) * LUCK_REDUCTION, MAX_LUCK_REDUCTION);
  return (BASE_CAVE_IN + CAVE_IN_STEP * rock) * (1 - reduction);
}

/**
 * Étais : chacun arrête un éboulement (le rocher est perdu, la cagnotte reste). La Puissance en donne : un à la
 * Puissance conseillée de la zone, un de plus à chaque doublement au-dessus (jusqu'à 3), aucun en dessous.
 */
const MAX_PROPS = 3;

export function propsFor(power: number, zone: number, stage: number): number {
  const ratio = Math.max(power, 1) / recommendedPower(zone, stage);
  return Math.min(Math.max(Math.floor(Math.log2(ratio)) + 1, 0), MAX_PROPS);
}

/** Butin d'un rocher : il grossit à chaque rocher cassé, d'où la tentation de continuer. */
export function rockOres(rock: number): number {
  return 2 + rock;
}

/** Or d'un rocher, en filons : 0,3 au premier, +0,15 par rocher. */
export function rockGoldStages(rock: number): number {
  return 0.3 + 0.15 * rock;
}

/** À partir du 5e rocher, un sur quatre cache un coffre : 2 filons d'or et 8 minerais de plus. */
export const CHEST_FROM_ROCK = 4;
export const CHEST_CHANCE = 0.25;
export const CHEST_STAGES = 2;
export const CHEST_ORES = 8;

/** Toute la file cassée : la cagnotte est majorée de moitié. */
export const COMPLETE_BONUS = 0.5;

/** Valeur d'un filon d'or de la zone, avec le bonus d'or du joueur. */
export function stageGold(zone: number, stage: number, goldBonus: number): number {
  return goldForDamage(rockHp(zone, stage), goldBonus);
}
