// Équilibrage du Campement : trois bâtiments à faire grandir lentement contre de l'or et du minerai.
// Fichier pur, comme balance.ts, simulé par tools/simulate.mts. Voir docs/game-design/campement.md.
import type { TierId } from '../equipment/equipment.model';
import { MAX_PICKAXE_LEVEL, segmentCost, TIER_ORDER } from './balance';

export const BUILDING_IDS = ['tavern', 'warehouse', 'well'] as const;
export type BuildingId = (typeof BUILDING_IDS)[number];

/** Niveau de chaque bâtiment. Un bâtiment absent est au niveau 0 (pas encore construit). */
export type CampLevels = Readonly<Partial<Record<BuildingId, number>>>;

/** Le Campement s'ouvre à la zone 5, vers la fin du premier jour d'un joueur régulier. */
export const CAMP_UNLOCK_ZONE = 5;

/** Niveau maximal de chaque bâtiment : une progression lente, sur plusieurs semaines. */
export const BUILDING_MAX_LEVEL: Readonly<Record<BuildingId, number>> = { tavern: 10, warehouse: 8, well: 10 };

/**
 * Taverne : +1,5 point de rendement hors ligne par niveau (50 % de base, 65 % au niveau 10).
 * L'absence fait les deux tiers de l'or d'une partie : chaque point compte, d'où un petit pas.
 */
export const TAVERN_EFFICIENCY_STEP = 0.015;

/** Entrepôt : +15 min d'absence prise en compte par niveau (4 h de base, 6 h au niveau 8). */
export const WAREHOUSE_CAP_STEP_MS = 15 * 60 * 1000;

/**
 * Puits : 0,3 éclat par heure et par niveau (3 par heure au niveau 10, environ 70 par jour), même jeu fermé,
 * qui s'accumulent jusqu'à 12 h de production : de quoi revenir deux fois par jour.
 */
export const WELL_SHARDS_PER_HOUR = 0.3;
export const WELL_STORAGE_HOURS = 12;

/**
 * Prix en or d'un niveau, en segments de pioche comme l'Atelier : le prix suit la progression sans réglage par zone.
 * Le premier niveau vaut 30 segments de la pioche 11 (celle qu'on a en ouvrant le Campement), puis ×3 par niveau.
 * Simulé (joueur 1 h par jour) : premiers niveaux au jour 3, niveau 5 partout au jour 14, maximum vers le jour 56.
 * Les premiers réglages (+2,5 points de Taverne, +30 min d'Entrepôt, 1 éclat par heure, ×2,2 par niveau) amenaient
 * la pioche 30 au jour 31 au lieu de 48 : le Campement doit donner une raison de revenir, pas raccourcir la partie.
 * Même réduit, il fait gagner 7 jours : le coût des segments de pioche passe de ×2,065 à ×2,085 pour compenser.
 */
const CAMP_BASE_PICKAXE_LEVEL = 11;
const CAMP_BASE_SEGMENTS = 30;
const CAMP_GOLD_GROWTH = 3;

export function buildingGoldCost(level: number): number {
  const base = (segmentCost(Math.min(CAMP_BASE_PICKAXE_LEVEL, MAX_PICKAXE_LEVEL - 1)) ?? 0) * CAMP_BASE_SEGMENTS;
  return Math.round(base * CAMP_GOLD_GROWTH ** level);
}

/** Minerai demandé : 3, puis 2 de plus par niveau. Une zone traversée en donne 35. */
const CAMP_BASE_ORES = 3;
const CAMP_ORE_STEP = 2;

export function buildingOreCost(level: number): number {
  return CAMP_BASE_ORES + CAMP_ORE_STEP * level;
}

/** Minerai de la dernière zone terminée, comme l'Atelier : un minerai déjà récolté en entier. */
export function campMaterial(zone: number): TierId {
  const lastClearedZone = Math.max(zone - 1, 1);
  return TIER_ORDER[Math.min(lastClearedZone, TIER_ORDER.length) - 1];
}
