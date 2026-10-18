// Règles pures de la reforge, à l'Atelier : on choisit un affixe d'une pièce portée et on le relance vers une autre
// stat, pour construire son build. Voir docs/game-design/atelier.md.
import { AFFIX_SHARE, expectedStatValue } from '../balance/balance';
import type { Random } from '../shared/random';
import { affinityWeight } from './equipment-rules';
import { type Item, type MiningStats, STAT_IDS, type StatId } from './equipment.model';

/**
 * Seuls les affixes en pourcentage se reforgent. La Frappe d'un affixe se fond dans la Frappe de base de la pièce :
 * la sauvegarde ne les distingue pas, on ne saurait donc pas quelle part relancer.
 */
export const REFORGEABLE_STATS: readonly StatId[] = STAT_IDS.filter((stat) => stat !== 'strikePower');

/** Affixes de la pièce qu'on peut relancer. */
export function reforgeableAffixes(item: Item): StatId[] {
  return REFORGEABLE_STATS.filter((stat) => item.stats[stat] !== undefined);
}

/** Stats vers lesquelles un affixe peut partir : celles en pourcentage que la pièce ne porte pas encore. */
export function reforgeTargets(item: Item): StatId[] {
  return REFORGEABLE_STATS.filter((stat) => item.stats[stat] === undefined);
}

/**
 * Relance l'affixe `stat` vers une autre stat, tirée parmi celles que la pièce ne porte pas, avec les affinités de
 * l'emplacement. La qualité du tirage est conservée : un affixe tiré à 90 % de sa valeur attendue le reste.
 * Renvoie null si l'affixe n'existe pas ou qu'aucune autre stat n'est libre.
 */
export function reforgeAffix(item: Item, stat: StatId, random: Random): Item | null {
  const value = item.stats[stat];
  const targets = reforgeTargets(item);
  if (value === undefined || !REFORGEABLE_STATS.includes(stat) || targets.length === 0) {
    return null;
  }
  const quality = value / expectedStatValue(stat, item.tier, item.level, AFFIX_SHARE[stat]);
  const target = pickTarget(item, targets, random);
  const stats: Partial<MiningStats> = { ...item.stats };
  delete stats[stat];
  stats[target] = roundPercent(expectedStatValue(target, item.tier, item.level, AFFIX_SHARE[target]) * quality);
  return { ...item, stats };
}

function pickTarget(item: Item, targets: readonly StatId[], random: Random): StatId {
  const total = targets.reduce((sum, target) => sum + affinityWeight(item.slot, target), 0);
  let threshold = random() * total;
  for (const target of targets) {
    threshold -= affinityWeight(item.slot, target);
    if (threshold < 0) {
      return target;
    }
  }
  return targets[targets.length - 1];
}

/** Les pourcentages sont gardés au millième, comme à la forge. */
const PERCENT_PRECISION = 1000;

function roundPercent(value: number): number {
  return Math.max(Math.round(value * PERCENT_PRECISION) / PERCENT_PRECISION, 1 / PERCENT_PRECISION);
}
