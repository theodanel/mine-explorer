// Règles pures de l'avancée dans la mine, portables côté Spring comme celles de l'équipement.
// La vie des zones vient de balance.ts.
import { zoneHp } from '../balance/balance';

export interface Progress {
  /** Zone en cours, à partir de 1. */
  readonly zone: number;
  /** PV déjà minés dans la zone en cours. */
  readonly damage: number;
}

export const START_PROGRESS: Progress = { zone: 1, damage: 0 };

export interface DamageResult {
  readonly progress: Progress;
  /** Zone entièrement minée par ce coup, ou null. */
  readonly clearedZone: number | null;
}

/** Applique un coup. Les dégâts en trop sont perdus : un coup ne termine qu'une seule zone. */
export function applyDamage(progress: Progress, damage: number): DamageResult {
  const total = progress.damage + damage;
  if (total < zoneHp(progress.zone)) {
    return { progress: { ...progress, damage: total }, clearedZone: null };
  }
  return { progress: { zone: progress.zone + 1, damage: 0 }, clearedZone: progress.zone };
}

export function remainingHp(progress: Progress): number {
  return Math.max(zoneHp(progress.zone) - progress.damage, 0);
}

/** Vie restante de la zone, entre 0 et 1. */
export function zoneHealth(progress: Progress): number {
  return remainingHp(progress) / zoneHp(progress.zone);
}

export function isValidProgress(value: unknown): value is Progress {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const { zone, damage } = value as Record<string, unknown>;
  return (
    Number.isSafeInteger(zone) &&
    (zone as number) >= 1 &&
    Number.isSafeInteger(damage) &&
    (damage as number) >= 0 &&
    (damage as number) < zoneHp(zone as number)
  );
}
