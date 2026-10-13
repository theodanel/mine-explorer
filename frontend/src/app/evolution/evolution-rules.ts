// Règles pures de l'évolution du mineur : objectifs de la forme suivante, façon « Adventure Rank ».
import { EVOLUTION_FORMS, EvolutionForm, EvolutionMetric } from '../balance/balance';

/** Valeur actuelle de chaque mesure : jauges (zone, pioche) et compteurs de toute la partie. */
export type EvolutionProgress = Readonly<Record<EvolutionMetric, number>>;

export interface ObjectiveStatus {
  readonly index: number;
  readonly metric: EvolutionMetric;
  readonly label: string;
  readonly have: number;
  readonly need: number;
  readonly done: boolean;
  readonly shards: number;
  /** Récompense déjà touchée. */
  readonly claimed: boolean;
}

const LABELS: Readonly<Record<EvolutionMetric, (target: number) => string>> = {
  zone: (target) => `Atteindre la zone ${target}`,
  pickaxeLevel: (target) => `Monter la pioche au niveau ${target}`,
  itemsForged: (target) => `Forger ${target} objets`,
  eventsTouched: (target) => `Toucher ${target} événements de mine`,
};

/** Forme suivante, ou null si le mineur est déjà à sa dernière forme. */
export function nextForm(formIndex: number): EvolutionForm | null {
  return EVOLUTION_FORMS[formIndex + 1] ?? null;
}

export function objectivesFor(form: EvolutionForm, progress: EvolutionProgress, claimed: readonly number[]): ObjectiveStatus[] {
  return form.objectives.map((objective, index) => {
    const have = progress[objective.metric];
    return {
      index,
      metric: objective.metric,
      label: LABELS[objective.metric](objective.target),
      have: Math.min(have, objective.target),
      need: objective.target,
      done: have >= objective.target,
      shards: objective.shards,
      claimed: claimed.includes(index),
    };
  });
}

/** La promotion est possible quand tous les objectifs sont remplis. */
export function canEvolve(objectives: readonly ObjectiveStatus[]): boolean {
  return objectives.length > 0 && objectives.every((objective) => objective.done);
}

/** Éclats encore à toucher : ceux des objectifs remplis dont la récompense n'a pas été prise. */
export function unclaimedShards(objectives: readonly ObjectiveStatus[]): number {
  return objectives.filter((objective) => objective.done && !objective.claimed).reduce((sum, objective) => sum + objective.shards, 0);
}
