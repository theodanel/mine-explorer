// Moteur pur de la Chasse au filon, en « Quitte ou double » : on casse les rochers un à un, la cagnotte grossit,
// et à chaque rocher il faut choisir entre encaisser et risquer l'éboulement.
import {
  caveInChance,
  CHEST_CHANCE,
  CHEST_FROM_ROCK,
  CHEST_ORES,
  CHEST_STAGES,
  COMPLETE_BONUS,
  rockGoldStages,
  rockOres,
  ROCKS_PER_RUN,
} from '../balance/minehunt';
import type { Random } from '../shared/random';

export type RockOutcome =
  | { readonly kind: 'loot'; readonly ores: number; readonly goldStages: number; readonly chest: boolean }
  /** Éboulement arrêté par un étai : ce rocher est perdu, la cagnotte reste. */
  | { readonly kind: 'propped' }
  /** Éboulement : toute la cagnotte est perdue. */
  | { readonly kind: 'caveIn' };

export type GambleStatus = 'playing' | 'cashed' | 'buried' | 'complete';

export interface Gamble {
  /** Rochers déjà cassés, et ce que chacun a donné. */
  readonly rocks: readonly RockOutcome[];
  readonly ores: number;
  /** Or de la cagnotte, compté en filons de la zone. */
  readonly goldStages: number;
  readonly chests: number;
  readonly props: number;
  readonly goldBonus: number;
  readonly status: GambleStatus;
}

export function startGamble(props: number, goldBonus: number): Gamble {
  return { rocks: [], ores: 0, goldStages: 0, chests: 0, props, goldBonus, status: 'playing' };
}

/** Risque d'éboulement du prochain rocher. */
export function nextRisk(gamble: Gamble): number {
  return caveInChance(gamble.rocks.length, gamble.goldBonus);
}

/** Casse le rocher suivant : du butin pour la cagnotte, ou un éboulement. */
export function breakRock(gamble: Gamble, random: Random): Gamble {
  if (gamble.status !== 'playing') {
    return gamble;
  }
  const index = gamble.rocks.length;
  if (random() < nextRisk(gamble)) {
    if (gamble.props > 0) {
      return finishIfLast({ ...gamble, props: gamble.props - 1, rocks: [...gamble.rocks, { kind: 'propped' }] });
    }
    return { ...gamble, rocks: [...gamble.rocks, { kind: 'caveIn' }], ores: 0, goldStages: 0, chests: 0, status: 'buried' };
  }
  const chest = index >= CHEST_FROM_ROCK && random() < CHEST_CHANCE;
  const ores = rockOres(index) + (chest ? CHEST_ORES : 0);
  const goldStages = rockGoldStages(index) + (chest ? CHEST_STAGES : 0);
  return finishIfLast({
    ...gamble,
    rocks: [...gamble.rocks, { kind: 'loot', ores, goldStages, chest }],
    ores: gamble.ores + ores,
    goldStages: gamble.goldStages + goldStages,
    chests: gamble.chests + (chest ? 1 : 0),
  });
}

/** Encaisse la cagnotte. */
export function cashOut(gamble: Gamble): Gamble {
  return gamble.status === 'playing' ? { ...gamble, status: 'cashed' } : gamble;
}

/** Toute la file cassée : la cagnotte est majorée. */
function finishIfLast(gamble: Gamble): Gamble {
  if (gamble.rocks.length < ROCKS_PER_RUN) {
    return gamble;
  }
  return {
    ...gamble,
    ores: Math.round(gamble.ores * (1 + COMPLETE_BONUS)),
    goldStages: gamble.goldStages * (1 + COMPLETE_BONUS),
    status: 'complete',
  };
}

export function isOver(gamble: Gamble): boolean {
  return gamble.status !== 'playing';
}
