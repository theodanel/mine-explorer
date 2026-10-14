// Équilibrage du Wagonnet fou : une course de réflexe sur 3 voies, à part de la mine, jouée 3 fois par jour.
// Fichier pur. Voir docs/game-design/wagonnet-fou.md.
import { type EvolutionId, goldForDamage, recommendedPower, rockHp } from './balance';

/** Le Wagonnet s'ouvre au Contremaître, avec le Puits (choix de Théo, 14/10/2026 ; d'abord prévu au Maître). */
export const MINECART_UNLOCK_FORM: EvolutionId = 'foreman';

/** Courses par jour, remises à 3 à minuit (heure du joueur). */
export const MINECART_DAILY_RUNS = 3;

/** Distance visible devant le wagonnet, en mètres : de quoi voir venir un obstacle sans tout voir d'avance. */
export const VIEW_METERS = 40;

/** Vitesse : 9 m/s au départ, +0,18 m/s chaque seconde, jusqu'à 24 m/s. La course finit toujours par un crash. */
export const START_SPEED = 9;
export const SPEED_GAIN_PER_SECOND = 0.18;
export const MAX_SPEED = 24;

/** Une rangée d'obstacles tous les 9 m (7 m sur la voie risquée). */
export const ROW_GAP_METERS = 9;
export const RISKY_ROW_GAP_METERS = 7;
/** Chance qu'une rangée bloque deux voies au lieu d'une (il reste toujours une voie libre). */
export const DOUBLE_BLOCK_CHANCE = 0.4;
export const RISKY_DOUBLE_BLOCK_CHANCE = 0.6;
/** Chance qu'une voie libre porte du minerai ou une pépite, et part des pépites parmi ces trouvailles. */
export const PICKUP_CHANCE = 0.5;
export const RISKY_PICKUP_CHANCE = 0.8;
export const NUGGET_SHARE = 0.3;
/** Les chauves-souris arrivent après 200 m, et changent de voie quand elles sont à 12 m du wagonnet. */
export const BAT_FROM_METERS = 200;
export const BAT_SWITCH_METERS = 12;

/** Un aiguillage tous les 250 m, le premier à 150 m. La voie risquée va 15 % plus vite. */
export const FIRST_FORK_METERS = 150;
export const FORK_EVERY_METERS = 250;
export const RISKY_SPEED_FACTOR = 1.15;
/** Pas d'obstacle juste avant ni juste après un aiguillage : le choix se fait au calme. */
export const FORK_CLEAR_METERS = 12;

/** Après un choc, le wagonnet est intouchable un court instant. */
export const INVULNERABLE_MS = 1200;

/**
 * Solidité du wagonnet : 3 cœurs pour un joueur à la Puissance conseillée de sa zone, un de plus à chaque
 * doublement au-dessus (jusqu'à 5), un de moins en dessous de la moitié (au moins 2).
 */
const BASE_HEARTS = 3;
const MIN_HEARTS = 2;
const MAX_HEARTS = 5;

export function cartHearts(power: number, zone: number, stage: number): number {
  const ratio = Math.max(power, 1) / recommendedPower(zone, stage);
  return Math.min(Math.max(BASE_HEARTS + Math.floor(Math.log2(ratio)), MIN_HEARTS), MAX_HEARTS);
}

/** Une pépite vaut un quart de filon de la zone, augmenté du bonus d'or du joueur. */
const NUGGET_STAGE_SHARE = 0.25;

export function nuggetGold(zone: number, stage: number, goldBonus: number): number {
  return Math.max(1, goldForDamage(rockHp(zone, stage) * NUGGET_STAGE_SHARE, goldBonus));
}

/** Chaque minerai ramassé donne 1 minerai de la zone : de quoi nourrir l'Atelier. */
export const ORE_PER_PICKUP = 1;

/** Record personnel : chaque palier de 500 m atteint pour la première fois donne 5 filons d'or. */
export const RECORD_STEP_METERS = 500;
export const RECORD_BONUS_STAGES = 5;

export function recordBonusGold(zone: number, stage: number, steps: number): number {
  return goldForDamage(rockHp(zone, stage) * RECORD_BONUS_STAGES * steps, 0);
}
