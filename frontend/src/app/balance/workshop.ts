// Équilibrage de l'Atelier : renforcement des pièces d'équipement, qualité par qualité, contre de l'or et du minerai.
// Fichier pur, comme balance.ts, simulé par tools/simulate.mts. Voir docs/game-design/atelier.md.
import type { SlotId, TierId } from '../equipment/equipment.model';
import { type EvolutionId, goldForDamage, rockHp, TIER_ORDER, tierIndex } from './balance';

/**
 * L'Atelier s'ouvre avec la forme Mineur (vers 12 h de jeu) : le joueur a déjà de quoi renforcer ses premières
 * pièces, et l'or trouve un deuxième usage tôt. Avant le 14/10/2026, il attendait le Contremaître.
 */
export const WORKSHOP_UNLOCK_FORM: EvolutionId = 'miner';

/** Niveau maximum d'une pièce dans une qualité. */
export const WORKSHOP_MAX_LEVEL = 50;

/**
 * Chaque niveau donne +0,4 % à la stat d'Atelier de la pièce (Frappe pour la pioche, Critique pour les gants…),
 * soit +20 % au niveau 50. Simulé (joueur régulier, 5 graines) : la pioche 30 tombe au jour 47,5 comme avant la
 * refonte (48,1), et l'Atelier vaut ×1,38 de Puissance au jour 70 (×1,37 avant). Un pas plus gros avançait la
 * pioche 30 de 3 à 5 jours, l'Atelier étant désormais ouvert plus tôt et bien moins cher au début.
 * Les niveaux appartiennent à un emplacement ET une qualité : un casque d'acier niveau 24 rend tous les casques
 * d'acier niveau 24, mais un casque de mithril repart de ses propres niveaux.
 * L'Atelier forme une famille à part, multipliée aux autres.
 */
export const WORKSHOP_STEP = 0.004;

/**
 * Prix en or d'un niveau, compté en filons de la zone où se trouve le minerai de la qualité (zone 3 pour le Cuivre,
 * zone 5 pour l'Acier…) : une qualité plus haute coûte plus cher dès le niveau 1, mais suit le revenu du joueur qui
 * la porte. Le niveau 1 vaut un demi-filon de cette zone (305 or en Cuivre, 6 100 en Acier, 51 000 en Mithril),
 * puis chaque niveau coûte 10 % de plus (×117 au niveau 50). Avant le 14/10/2026, le premier niveau coûtait 4 M d'or.
 */
const WORKSHOP_BASE_STAGES = 1 / 2;
const WORKSHOP_GOLD_GROWTH = 1.1;
/** Filon de milieu de zone, pour mesurer le revenu d'une zone. */
const REFERENCE_STAGE = 8;

/** Zone dont la qualité porte le nom de minerai : Bois en zone 1, Pierre en 2… Divin en 10. */
export function tierZone(tier: TierId): number {
  return tierIndex(tier) + 1;
}

/** Prix en or pour passer une pièce de cette qualité du niveau `level` au suivant. */
export function workshopGoldCost(tier: TierId, level: number): number {
  const stageGold = goldForDamage(rockHp(tierZone(tier), REFERENCE_STAGE), 0);
  return Math.max(1, Math.round(stageGold * WORKSHOP_BASE_STAGES * WORKSHOP_GOLD_GROWTH ** level));
}

/** Minerai demandé : 1, puis un de plus tous les 10 niveaux. Un filon en donne 1, une zone terminée 20 de plus. */
const WORKSHOP_BASE_ORES = 1;
const WORKSHOP_ORE_STEP_LEVELS = 10;

export function workshopOreCost(level: number): number {
  return WORKSHOP_BASE_ORES + Math.floor(level / WORKSHOP_ORE_STEP_LEVELS);
}

/** Minerai demandé : celui de la qualité de la pièce. Le Bois n'est pas un minerai : il se renforce à l'or seul. */
export function workshopMaterial(tier: TierId): TierId | null {
  return tier === TIER_ORDER[0] ? null : tier;
}

/** Niveau de chaque pièce, par emplacement puis par qualité. Une entrée absente est au niveau 0. */
export type WorkshopLevels = Readonly<Partial<Record<SlotId, Readonly<Partial<Record<TierId, number>>>>>>;
