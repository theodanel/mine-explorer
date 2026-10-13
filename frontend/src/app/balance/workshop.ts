// Équilibrage de l'Atelier : renforcement des emplacements contre de l'or et des minerais.
// Fichier pur, comme balance.ts, simulé par tools/simulate.mts. Voir docs/game-design/idees-fun.md (idée 1).
import type { SlotId, TierId } from '../equipment/equipment.model';
import { type EvolutionId, MAX_PICKAXE_LEVEL, segmentCost, TIER_ORDER } from './balance';

/**
 * L'Atelier s'ouvre avec la forme Contremaître (zone 7, vers le jour 6 pour un joueur régulier) :
 * le début reste rapide et généreux, et l'or trouve un deuxième usage quand la pioche commence à coûter cher.
 */
export const WORKSHOP_UNLOCK_FORM: EvolutionId = 'foreman';

/**
 * Chaque niveau d'un emplacement donne +3 % à la stat d'Atelier de cet emplacement (Frappe pour la pioche,
 * Critique pour les gants…). Le bonus appartient à l'emplacement : il reste quand on change d'objet.
 * Les niveaux d'un même emplacement s'additionnent ; l'Atelier forme une famille à part, multipliée aux autres.
 */
export const WORKSHOP_STEP = 0.015;

/**
 * Prix en or d'un niveau, exprimé en segments de pioche : le renforcement suit la progression sans réglage par zone.
 * Le premier niveau vaut un demi-segment du niveau 17 de pioche (celui qu'on a à peu près en arrivant
 * Contremaître), puis chaque niveau coûte ×1,6, bien plus vite que le revenu (×1,4 par zone) : c'est un puits d'or,
 * jamais un raccourci, et il reste utile après la pioche 30.
 */
const WORKSHOP_BASE_PICKAXE_LEVEL = 17;
const WORKSHOP_BASE_SEGMENT_SHARE = 20;
const WORKSHOP_GOLD_GROWTH = 3;

/** Prix en or pour passer un emplacement du niveau `level` au suivant. */
export function workshopGoldCost(level: number): number {
  const base = (segmentCost(Math.min(WORKSHOP_BASE_PICKAXE_LEVEL, MAX_PICKAXE_LEVEL - 1)) ?? 0) * WORKSHOP_BASE_SEGMENT_SHARE;
  return Math.round(base * WORKSHOP_GOLD_GROWTH ** level);
}

/** Minerais demandés : 2, puis un de plus tous les 5 niveaux. Une zone traversée en donne 35. */
const WORKSHOP_BASE_ORES = 2;
const WORKSHOP_ORE_STEP_LEVELS = 5;

export function workshopOreCost(level: number): number {
  return WORKSHOP_BASE_ORES + Math.floor(level / WORKSHOP_ORE_STEP_LEVELS);
}

/**
 * Minerai demandé : celui de la dernière zone terminée, donc un minerai déjà récolté en entier
 * (Or en zone 7, Mithril en zone 8…, Divin au-delà de la zone 10).
 */
export function workshopMaterial(zone: number): TierId {
  const lastClearedZone = Math.max(zone - 1, 2);
  return TIER_ORDER[Math.min(lastClearedZone, TIER_ORDER.length) - 1];
}

/** Niveau de chaque emplacement. Un emplacement absent est au niveau 0. */
export type WorkshopLevels = Readonly<Partial<Record<SlotId, number>>>;
