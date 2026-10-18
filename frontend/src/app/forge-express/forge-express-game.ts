// Moteur pur de la Forge express : la chaleur oscille, le joueur frappe quand elle est dans la zone dorée.
import {
  COMBO_POINT,
  FAIR_WINDOW,
  GOOD_WINDOW,
  GRADE_POINTS,
  HEAT_PERIOD_MS,
  HEAT_SPEEDUP,
  PERFECT_WINDOW,
  STRIKES_PER_RUN,
  StrikeGrade,
} from '../balance/forge-express';

export interface Smithing {
  /** Temps écoulé depuis la dernière frappe : la chaleur en dépend. */
  readonly sinceStrikeMs: number;
  readonly grades: readonly StrikeGrade[];
  readonly combo: number;
  readonly score: number;
}

export const START_SMITHING: Smithing = { sinceStrikeMs: 0, grades: [], combo: 0, score: 0 };

/** Durée d'un aller-retour de la chaleur, qui raccourcit à chaque frappe. */
export function heatPeriod(strikes: number): number {
  return HEAT_PERIOD_MS * HEAT_SPEEDUP ** strikes;
}

/** Chaleur de 0 à 1 : elle part de 0 après chaque frappe, monte à 1 puis redescend. */
export function heat(smithing: Smithing): number {
  const phase = (smithing.sinceStrikeMs % heatPeriod(smithing.grades.length)) / heatPeriod(smithing.grades.length);
  return (1 - Math.cos(2 * Math.PI * phase)) / 2;
}

export function grade(heatValue: number): StrikeGrade {
  const gap = Math.abs(heatValue - 0.5);
  if (gap <= PERFECT_WINDOW) {
    return 'perfect';
  }
  if (gap <= GOOD_WINDOW) {
    return 'good';
  }
  return gap <= FAIR_WINDOW ? 'fair' : 'miss';
}

export function isDone(smithing: Smithing): boolean {
  return smithing.grades.length >= STRIKES_PER_RUN;
}

export function tick(smithing: Smithing, dtMs: number): Smithing {
  return isDone(smithing) ? smithing : { ...smithing, sinceStrikeMs: smithing.sinceStrikeMs + dtMs };
}

/** Une frappe : sa note selon la chaleur du moment, ses points, et le combo des frappes parfaites. */
export function strike(smithing: Smithing): Smithing {
  if (isDone(smithing)) {
    return smithing;
  }
  const result = grade(heat(smithing));
  const combo = result === 'perfect' ? smithing.combo + 1 : result === 'miss' ? 0 : smithing.combo;
  const comboPoints = result === 'perfect' && combo > 1 ? COMBO_POINT : 0;
  return {
    sinceStrikeMs: 0,
    grades: [...smithing.grades, result],
    combo,
    score: smithing.score + GRADE_POINTS[result] + comboPoints,
  };
}
