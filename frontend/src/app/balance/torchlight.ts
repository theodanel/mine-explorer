// Équilibrage de l'Expédition aux flambeaux : une grotte plongée dans le noir, 30 pas pour trouver le trésor.
// Voir docs/game-design/expedition-flambeaux.md.
import { type EvolutionId, recommendedPower } from './balance';

/** L'Expédition s'ouvre à la Légende, la dernière forme : elle donne une raison d'y arriver. */
export const TORCHLIGHT_UNLOCK_FORM: EvolutionId = 'legend';
/** Deux expéditions par jour : leurs pierres d'éveil pèsent lourd à côté des autres sources. */
export const TORCHLIGHT_DAILY_RUNS = 2;

/** Grotte de 7 colonnes sur 9 rangées ; on part du bas, au milieu. Le trésor dort dans les 3 rangées du haut. */
export const CAVE_COLUMNS = 7;
export const CAVE_ROWS = 9;
export const TREASURE_ROWS = 3;

/** Ce que cache la grotte, hors trésor. */
export const CAVE_CONTENT = { walls: 9, monsters: 6, stones: 7, chests: 2, oil: 3 } as const;

export const STARTING_STEPS = 30;
/** Une fiole d'huile ranime la torche : quelques pas de plus. */
export const OIL_STEPS = 4;

/**
 * La torche éclaire les cases voisines (diagonales comprises). La Chance l'agrandit d'une case dès +15 % de bonus
 * d'or ; les yeux des monstres et la lueur du trésor se voient une case plus loin que la lumière.
 */
export const WIDE_TORCH_LUCK = 0.15;

export function torchRadius(goldBonus: number): number {
  return goldBonus >= WIDE_TORCH_LUCK ? 2 : 1;
}

/**
 * Un monstre barre la case : on le chasse, mais il coûte des pas. À la Puissance conseillée de la zone, 2 pas ;
 * en dessous, 4. Vaincu, il lâche une pierre d'éveil.
 */
const STRONG_MONSTER_STEPS = 2;
const WEAK_MONSTER_STEPS = 4;

export function monsterSteps(power: number, zone: number, stage: number): number {
  return power >= recommendedPower(zone, stage) ? STRONG_MONSTER_STEPS : WEAK_MONSTER_STEPS;
}

/** Butin, en pierres d'éveil et en filons d'or de la zone. */
export const STONES_PER_PILE = 1;
export const MONSTER_STONES = 1;
export const CHEST_LOOT = { stones: 2, goldStages: 3 } as const;
/** Le trésor : le coffre rare, qui garde parfois un œuf (au moins rare). */
export const TREASURE_LOOT = { stones: 5, goldStages: 10 } as const;
export const TREASURE_EGG_CHANCE = 0.3;
