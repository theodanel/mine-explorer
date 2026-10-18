// Équilibrage du Puits sans fond : un mini-jeu de 30 s, à part de la mine, joué 3 fois par jour.
// Fichier pur, comme balance.ts, simulé par tools/simulate.mts. Voir docs/game-design/puits-sans-fond.md.
import { type EvolutionId, rockHp, stageTargetSeconds } from './balance';

/** Le Puits s'ouvre avec le Contremaître : à partir de là, le build compte et l'or commence à manquer. */
export const ABYSS_UNLOCK_FORM: EvolutionId = 'foreman';

/** Essais par jour, remis à 3 à minuit (heure du joueur). */
export const ABYSS_DAILY_RUNS = 3;

/** Durée d'une descente : courte, pour un moment intense sans lasser. */
export const ABYSS_RUN_MS = 30_000;

export type FloorKind = 'normal' | 'crystal' | 'trap' | 'guardian';

/** Tous les 10 étages, un gardien : un gros rocher avec sa propre barre de vie. */
export const GUARDIAN_EVERY = 10;
/** Les pièges n'arrivent qu'après les premiers étages, le temps de comprendre le jeu. */
const FIRST_TRAP_FLOOR = 3;
const CRYSTAL_SHARE = 0.3;
const TRAP_SHARE = 0.2;

/** Type d'un étage : gardien tous les 10, sinon normal 50 %, cristal 30 %, piégé 20 % (à partir de l'étage 3). */
export function floorKind(floor: number, roll: number): FloorKind {
  if (floor % GUARDIAN_EVERY === 0) {
    return 'guardian';
  }
  if (roll < CRYSTAL_SHARE) {
    return 'crystal';
  }
  return floor >= FIRST_TRAP_FLOOR && roll < CRYSTAL_SHARE + TRAP_SHARE ? 'trap' : 'normal';
}

/**
 * PV d'un étage. Ils ne suivent pas les filons de la mine (trop durs : tout le monde faisait 0 étage). L'étage 1
 * vaut 2 s d'une Puissance de référence, puis +15 % par étage. Cette référence est la moyenne géométrique de la
 * Puissance attendue dans la zone du joueur et de sa Puissance réelle : un joueur en retard sur sa zone descend
 * quand même, un build en avance descend plus bas, sans que l'écart devienne écrasant. Taper vite et viser le
 * point faible font le reste.
 */
const FLOOR_SECONDS = 2;
const FLOOR_HP_GROWTH = 1.15;
const KIND_HP_FACTOR: Readonly<Record<FloorKind, number>> = { normal: 1, crystal: 1.3, trap: 0.8, guardian: 4 };

/** PV de l'étage 1, pour un joueur de cette zone et de cette Puissance (dégâts par seconde). */
export function firstFloorHp(zone: number, playerDps: number): number {
  const zoneDps = rockHp(zone, 1) / stageTargetSeconds(zone);
  return FLOOR_SECONDS * Math.sqrt(zoneDps * Math.max(playerDps, 1));
}

export function floorHp(floor: number, firstFloor: number, kind: FloorKind): number {
  return Math.ceil(firstFloor * FLOOR_HP_GROWTH ** (floor - 1) * KIND_HP_FACTOR[kind]);
}

/** Combo : chaque toucher à moins de 0,6 s du précédent ajoute 10 % de dégâts, jusqu'à ×1,9. */
export const COMBO_WINDOW_MS = 600;
export const COMBO_STEP = 0.1;
export const COMBO_MAX = 10;

/** Point faible du rocher à cristal : un toucher dessus fait ×3, et il change de place toutes les 1,2 s. */
export const WEAK_POINT_MULTIPLIER = 3;
export const WEAK_POINT_MOVE_MS = 1200;

/** Rocher piégé : 3 s pour le casser, sinon il explose et coûte 3 s. */
export const TRAP_FUSE_MS = 3000;
export const TRAP_PENALTY_MS = 3000;

/** Cristal de temps : il tombe toutes les 6 à 10 s, reste 2,5 s, et donne 2 s de plus. */
export const CRYSTAL_SPAWN_MIN_MS = 6000;
export const CRYSTAL_SPAWN_MAX_MS = 10_000;
export const CRYSTAL_LIFETIME_MS = 2500;
export const CRYSTAL_BONUS_MS = 2000;

/**
 * Record personnel : chaque palier de 5 étages atteint pour la première fois donne une fois pour toutes
 * 30 éclats et 2 pierres d'éveil.
 */
export const RECORD_STEP = 5;
export const RECORD_SHARDS = 30;

/** Éclats par étage franchi : 2, ou 4 sous Filon doré ou Écho de géode (1 et 2 avant le 14/10/2026). */
export const FLOOR_SHARDS = 2;
export const RECORD_STONES = 2;
