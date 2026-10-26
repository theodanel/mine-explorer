// Règles pures de l'avancée dans la mine, portables côté Spring comme celles de l'équipement.
// Les PV des rochers viennent de balance.ts.
import { GUARDIAN_SECONDS, guardianHp, rockHp, STAGES_PER_ZONE } from '../balance/balance';

export interface Progress {
  /** Zone en cours, à partir de 1 (le « 1 » de « 1-3 »). */
  readonly zone: number;
  /** Étape dans la zone, de 1 à STAGES_PER_ZONE : un rocher par étape. */
  readonly stage: number;
  /** PV déjà minés sur le rocher en cours. */
  readonly damage: number;
}

export const START_PROGRESS: Progress = { zone: 1, stage: 1, damage: 0 };

export interface DamageResult {
  readonly progress: Progress;
  /** Vrai si ce coup a cassé le rocher. */
  readonly rockBroken: boolean;
  /** Zone terminée par ce coup (dernier rocher cassé), ou null. */
  readonly clearedZone: number | null;
}

/** Le dernier filon de chaque zone est son gardien. */
export const GUARDIAN_STAGE = STAGES_PER_ZONE;
/** Filon où l'on retombe après un gardien raté, et qu'on mine sans fin en attendant de le défier à nouveau. */
export const BEFORE_GUARDIAN_STAGE = STAGES_PER_ZONE - 1;
const GUARDIAN_MS = GUARDIAN_SECONDS * 1000;

/**
 * PV du filon de l'étape : ceux de la courbe, sauf le gardien, calculés sur le temps (voir balance.ts). `hardness` :
 * dureté de la vie en cours, qui monte à chaque renaissance (balance/rebirth.ts).
 */
export function stageHp(zone: number, stage: number, hardness = 1): number {
  return Math.round((stage === GUARDIAN_STAGE ? guardianHp(zone) : rockHp(zone, stage)) * hardness);
}

export function isGuardian(progress: Progress): boolean {
  return progress.stage === GUARDIAN_STAGE;
}

/**
 * Applique un coup. Les dégâts en trop sont perdus : un coup ne casse qu'un seul rocher. `blocked` : le joueur a
 * raté le gardien, le filon d'avant se reforme à chaque fois au lieu de mener au gardien.
 */
export function applyDamage(progress: Progress, damage: number, blocked = false, hardness = 1): DamageResult {
  const total = progress.damage + damage;
  if (total < stageHp(progress.zone, progress.stage, hardness)) {
    return { progress: { ...progress, damage: total }, rockBroken: false, clearedZone: null };
  }
  if (blocked && progress.stage === BEFORE_GUARDIAN_STAGE) {
    return { progress: { ...progress, damage: 0 }, rockBroken: true, clearedZone: null };
  }
  if (progress.stage === STAGES_PER_ZONE) {
    return { progress: { zone: progress.zone + 1, stage: 1, damage: 0 }, rockBroken: true, clearedZone: progress.zone };
  }
  return { progress: { ...progress, stage: progress.stage + 1, damage: 0 }, rockBroken: true, clearedZone: null };
}

/** Temps restant contre le gardien, en millisecondes, pour un combat commencé à `startedAt`. */
export function guardianTimeLeft(startedAt: number, now: number): number {
  return Math.max(GUARDIAN_MS - (now - startedAt), 0);
}

/** Gardien raté : il se reforme, et le joueur retombe sur le filon d'avant. */
export function failGuardian(progress: Progress): Progress {
  return { zone: progress.zone, stage: BEFORE_GUARDIAN_STAGE, damage: 0 };
}

/** Le joueur défie à nouveau le gardien, qui repart avec tous ses PV. */
export function challengeGuardian(progress: Progress): Progress {
  return { zone: progress.zone, stage: GUARDIAN_STAGE, damage: 0 };
}

export function remainingHp(progress: Progress, hardness = 1): number {
  return Math.max(stageHp(progress.zone, progress.stage, hardness) - progress.damage, 0);
}

/** Résistance restante du rocher, entre 0 et 1. */
export function rockHealth(progress: Progress, hardness = 1): number {
  return remainingHp(progress, hardness) / stageHp(progress.zone, progress.stage, hardness);
}

export function stageLabel(progress: Progress): string {
  return `${progress.zone}-${progress.stage}`;
}

/** Nombre d'étapes atteintes depuis le début : 1 en 1-1, 16 en 2-1. Sert aux missions. */
export function stagesReached(progress: Progress): number {
  return (progress.zone - 1) * STAGES_PER_ZONE + progress.stage;
}

/** L'ancienne sauvegarde « vie de zone » n'avait pas d'étape : on garde la zone et on repart de son premier rocher. */
export function migrateProgress(value: unknown, hardness = 1): unknown {
  if (typeof value === 'object' && value !== null && !('stage' in value) && 'zone' in value) {
    return { zone: (value as { zone: unknown }).zone, stage: 1, damage: 0 };
  }
  return clampDamageToRock(value, hardness);
}

/**
 * Quand un rééquilibrage baisse les PV des filons, les dégâts déjà portés au filon en cours peuvent dépasser
 * ses nouveaux PV : la sauvegarde serait rejetée et le joueur repartirait du 1-1. Le filon reste alors à 1 PV.
 */
function clampDamageToRock(value: unknown, hardness: number): unknown {
  if (typeof value !== 'object' || value === null) {
    return value;
  }
  const { zone, stage, damage } = value as Record<string, unknown>;
  if (!isPositiveInteger(zone) || !isPositiveInteger(stage) || stage > STAGES_PER_ZONE || !isDamage(damage)) {
    return value;
  }
  const hp = stageHp(zone, stage, hardness);
  return Number.isFinite(hp) && damage >= hp ? { ...value, damage: hp - 1 } : value;
}

export function isValidProgress(value: unknown, hardness = 1): value is Progress {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const { zone, stage, damage } = value as Record<string, unknown>;
  if (!isPositiveInteger(zone) || !isPositiveInteger(stage) || stage > STAGES_PER_ZONE) {
    return false;
  }
  // Une zone trafiquée trop profonde donnerait un filon aux PV infinis : la partie serait bloquée
  const hp = stageHp(zone, stage, hardness);
  return Number.isFinite(hp) && isDamage(damage) && damage < hp;
}

/**
 * Dégâts faits au filon : un nombre fini et positif. Dans les zones sans fin, les PV dépassent les entiers exacts de
 * JavaScript (9 × 10¹⁵, vers la zone 35) : on garde alors un nombre à virgule, de la bonne grandeur.
 */
function isDamage(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 1;
}

// ─── Retour dans une zone passée ───────────────────────────────────────────

/**
 * Retour dans une zone déjà terminée, pour y récolter son minerai : les filons y sont sans fin (aucun ne fait
 * avancer), tous de la résistance du dernier filon de la zone. La progression principale attend, intacte.
 */
export interface Farm {
  readonly zone: number;
  /** PV déjà minés sur le filon en cours. */
  readonly damage: number;
  /**
   * PV de chaque filon d'un Écho (zone passée devenue plus dure, dès la Légende), fixés à l'entrée selon la Puissance
   * du joueur ; absent pour une zone passée ordinaire.
   */
  readonly echoHp?: number;
}

export function farmRockHp(zone: number): number {
  return rockHp(zone, STAGES_PER_ZONE);
}

/** PV d'un filon de la zone passée : ceux de l'Écho s'il y en a un. */
export function farmHp(farm: Farm): number {
  return farm.echoHp ?? farmRockHp(farm.zone);
}

/** On ne revient que dans une zone déjà terminée. */
export function canFarm(progress: Progress, zone: number): boolean {
  return Number.isSafeInteger(zone) && zone >= 1 && zone < progress.zone;
}

export interface FarmHit {
  readonly farm: Farm;
  readonly rockBroken: boolean;
  /** PV réellement minés : les dégâts en trop ne rapportent rien, d'où un or réduit dans une zone facile. */
  readonly mined: number;
}

export function applyFarmDamage(farm: Farm, damage: number): FarmHit {
  const hp = farmHp(farm);
  const mined = Math.min(damage, hp - farm.damage);
  const total = farm.damage + damage;
  return total < hp
    ? { farm: { ...farm, damage: total }, rockBroken: false, mined }
    : { farm: { ...farm, damage: 0 }, rockBroken: true, mined };
}

export function isValidFarm(value: unknown, progress: Progress): value is Farm {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const { zone, damage, echoHp } = value as Record<string, unknown>;
  const echoValid = echoHp === undefined || (typeof echoHp === 'number' && Number.isFinite(echoHp) && echoHp > 0);
  return (
    isPositiveInteger(zone) &&
    canFarm(progress, zone) &&
    echoValid &&
    isDamage(damage) &&
    (damage as number) >= 0 &&
    (damage as number) < ((echoHp as number | undefined) ?? farmRockHp(zone))
  );
}
