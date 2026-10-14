// Équilibrage de la Chasse au filon : un démineur de mine, 3 parties par jour. Voir docs/game-design/chasse-au-filon.md.
import { type EvolutionId, goldForDamage, recommendedPower, rockHp } from './balance';

/** La Chasse s'ouvre au Contremaître, avec le Puits (elle remplace le Wagonnet fou, 14/10/2026). */
export const MINEHUNT_UNLOCK_FORM: EvolutionId = 'foreman';
export const MINEHUNT_DAILY_RUNS = 3;

/** Paroi de 6 colonnes sur 8 rangées, dont 8 poches de grisou. */
export const HUNT_COLUMNS = 6;
export const HUNT_ROWS = 8;
export const HUNT_GAS_POCKETS = 8;
/** Parmi les cases sûres : un coffre, puis du minerai et des pépites ; le reste est vide (et montre son indice). */
export const ORE_CELL_CHANCE = 0.22;
export const NUGGET_CELL_CHANCE = 0.1;
/** La Chance (bonus d'or) ajoute des pépites : +10 % de chance de pépite pour +100 % d'or. */
export const NUGGET_PER_GOLD_BONUS = 0.1;

/**
 * Résistance de la pioche : 3 coups de grisou pour un joueur à la Puissance conseillée de sa zone, un de plus à
 * chaque doublement au-dessus (jusqu'à 5), un de moins sous la moitié (au moins 2).
 */
const BASE_DURABILITY = 3;
const MIN_DURABILITY = 2;
const MAX_DURABILITY = 5;

export function pickaxeDurability(power: number, zone: number, stage: number): number {
  const ratio = Math.max(power, 1) / recommendedPower(zone, stage);
  return Math.min(Math.max(BASE_DURABILITY + Math.floor(Math.log2(ratio)), MIN_DURABILITY), MAX_DURABILITY);
}

/** Cases révélées d'office au départ : 1, puis une de plus par +50 % de bonus d'or, jusqu'à 3. */
export function startingReveals(goldBonus: number): number {
  return Math.min(1 + Math.floor(Math.max(goldBonus, 0) / 0.5), 3);
}

/** Butin : 2 minerais de la zone par case de minerai, une pépite vaut un tiers de filon d'or. */
export const ORE_PER_CELL = 2;
const NUGGET_STAGE_SHARE = 1 / 3;
/** Le coffre : 4 filons d'or et 10 minerais. */
const CHEST_STAGES = 4;
export const CHEST_ORES = 10;

export function nuggetGold(zone: number, stage: number, goldBonus: number): number {
  return Math.max(1, goldForDamage(rockHp(zone, stage) * NUGGET_STAGE_SHARE, goldBonus));
}

export function chestGold(zone: number, stage: number, goldBonus: number): number {
  return goldForDamage(rockHp(zone, stage) * CHEST_STAGES, goldBonus);
}

/** Pioche cassée : on ne remonte qu'avec la moitié du butin. S'arrêter à temps garde tout. */
export const BROKEN_KEEP_SHARE = 0.5;
