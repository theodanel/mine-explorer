// Règles pures de l'évolution du mineur : objectifs de la forme suivante, façon « Adventure Rank ».
import { EVOLUTION_FORMS, EvolutionForm, EvolutionMetric } from '../balance/balance';

/** Valeur actuelle de chaque mesure : jauges (zone, pioche) et compteurs de toute la partie. */
export type EvolutionProgress = Readonly<Record<EvolutionMetric, number>>;

export interface ObjectiveStatus {
  readonly index: number;
  /** Palier de la mission (1, 2, 3). */
  readonly tier: number;
  /** Le palier est ouvert : tous les paliers d'avant sont remplis. */
  readonly unlocked: boolean;
  readonly metric: EvolutionMetric;
  readonly label: string;
  readonly have: number;
  readonly need: number;
  readonly done: boolean;
  readonly shards: number;
  /** Récompense déjà touchée. */
  readonly claimed: boolean;
}

const NUMBER = new Intl.NumberFormat('fr-FR');

const LABELS: Readonly<Record<EvolutionMetric, (target: number) => string>> = {
  zone: (target) => `Atteindre la zone ${target}`,
  pickaxeLevel: (target) => `Pioche niveau ${target}`,
  itemsForged: (target) => `Forger ${NUMBER.format(target)} objets`,
  rocksBroken: (target) => `Épuiser ${target} filons`,
};

/** Forme suivante, ou null si le mineur est déjà à sa dernière forme. */
export function nextForm(formIndex: number): EvolutionForm | null {
  return EVOLUTION_FORMS[formIndex + 1] ?? null;
}

export function objectivesFor(form: EvolutionForm, progress: EvolutionProgress, claimed: readonly number[]): ObjectiveStatus[] {
  const current = currentTier(form, progress);
  return form.objectives.map((objective, index) => {
    const have = progress[objective.metric];
    return {
      index,
      tier: objective.tier,
      unlocked: objective.tier <= current,
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

/** Palier en cours : le premier qui n'est pas rempli (le dernier quand tout est rempli). */
export function currentTier(form: EvolutionForm, progress: EvolutionProgress): number {
  const tiers = [...new Set(form.objectives.map((objective) => objective.tier))].sort((a, b) => a - b);
  const unfinished = (tier: number): boolean =>
    form.objectives.some((objective) => objective.tier === tier && progress[objective.metric] < objective.target);
  return tiers.find(unfinished) ?? tiers[tiers.length - 1] ?? 1;
}

/** La promotion est possible quand tous les objectifs sont remplis. */
export function canEvolve(objectives: readonly ObjectiveStatus[]): boolean {
  return objectives.length > 0 && objectives.every((objective) => objective.done);
}

/** Une récompense se touche quand la mission est remplie et son palier ouvert. */
export function isClaimable(objective: ObjectiveStatus): boolean {
  return objective.done && objective.unlocked && !objective.claimed;
}

/** Éclats encore à toucher : ceux des missions remplies dont la récompense n'a pas été prise. */
export function unclaimedShards(objectives: readonly ObjectiveStatus[]): number {
  return objectives.filter((objective) => objective.done && !objective.claimed).reduce((sum, objective) => sum + objective.shards, 0);
}
