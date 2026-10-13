// Règles pures de l'avancée dans la mine, portables côté Spring comme celles de l'équipement.
// Les PV des rochers viennent de balance.ts.
import { rockHp, STAGES_PER_ZONE } from '../balance/balance';

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

/** Applique un coup. Les dégâts en trop sont perdus : un coup ne casse qu'un seul rocher. */
export function applyDamage(progress: Progress, damage: number): DamageResult {
  const total = progress.damage + damage;
  if (total < rockHp(progress.zone, progress.stage)) {
    return { progress: { ...progress, damage: total }, rockBroken: false, clearedZone: null };
  }
  if (progress.stage === STAGES_PER_ZONE) {
    return { progress: { zone: progress.zone + 1, stage: 1, damage: 0 }, rockBroken: true, clearedZone: progress.zone };
  }
  return { progress: { ...progress, stage: progress.stage + 1, damage: 0 }, rockBroken: true, clearedZone: null };
}

export function remainingHp(progress: Progress): number {
  return Math.max(rockHp(progress.zone, progress.stage) - progress.damage, 0);
}

/** Résistance restante du rocher, entre 0 et 1. */
export function rockHealth(progress: Progress): number {
  return remainingHp(progress) / rockHp(progress.zone, progress.stage);
}

export function stageLabel(progress: Progress): string {
  return `${progress.zone}-${progress.stage}`;
}

/** Nombre d'étapes atteintes depuis le début : 1 en 1-1, 16 en 2-1. Sert aux missions. */
export function stagesReached(progress: Progress): number {
  return (progress.zone - 1) * STAGES_PER_ZONE + progress.stage;
}

/** L'ancienne sauvegarde « vie de zone » n'avait pas d'étape : on garde la zone et on repart de son premier rocher. */
export function migrateProgress(value: unknown): unknown {
  if (typeof value === 'object' && value !== null && !('stage' in value) && 'zone' in value) {
    return { zone: (value as { zone: unknown }).zone, stage: 1, damage: 0 };
  }
  return value;
}

export function isValidProgress(value: unknown): value is Progress {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const { zone, stage, damage } = value as Record<string, unknown>;
  if (!isPositiveInteger(zone) || !isPositiveInteger(stage) || stage > STAGES_PER_ZONE) {
    return false;
  }
  // Une zone trafiquée trop profonde donnerait un filon aux PV infinis : la partie serait bloquée
  const hp = rockHp(zone, stage);
  return Number.isFinite(hp) && Number.isSafeInteger(damage) && (damage as number) >= 0 && (damage as number) < hp;
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 1;
}
