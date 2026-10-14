// Équilibrage de la Forge express : 10 frappes en rythme à l'enclume, pour un objet bonus. Voir docs/game-design/forge-express.md.
import type { EvolutionId } from './balance';

/** La Forge express s'ouvre au Maître des profondeurs. */
export const FORGE_EXPRESS_UNLOCK_FORM: EvolutionId = 'master';
export const FORGE_EXPRESS_DAILY_RUNS = 3;

/** Dix frappes par partie. */
export const STRIKES_PER_RUN = 10;

/**
 * La chaleur du lingot monte et descend en continu : un aller-retour en 1,6 s au départ, 6 % plus vite à chaque
 * frappe. La zone dorée est au milieu de la jauge.
 */
export const HEAT_PERIOD_MS = 1600;
export const HEAT_SPEEDUP = 0.94;

/** Écart au centre de la jauge (0 à 0,5) : parfait, bien, juste ; au-delà, la frappe est ratée. */
export const PERFECT_WINDOW = 0.05;
export const GOOD_WINDOW = 0.12;
export const FAIR_WINDOW = 0.22;

export type StrikeGrade = 'perfect' | 'good' | 'fair' | 'miss';
export const GRADE_POINTS: Readonly<Record<StrikeGrade, number>> = { perfect: 3, good: 2, fair: 1, miss: 0 };

/** Chaque frappe parfaite d'affilée ajoute 1 point de combo, perdu au premier raté. */
export const COMBO_POINT = 1;

/**
 * Qualité de l'objet bonus selon le score (sur 30 frappes parfaites + combos) : au-dessus de 20, la meilleure
 * qualité que la forge peut sortir ; au-dessus de 32, une qualité de plus ; en dessous, un tirage de forge normal.
 */
export const BEST_TIER_SCORE = 20;
export const BONUS_TIER_SCORE = 32;
