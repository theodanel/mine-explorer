import { STATS, StatId } from './equipment.model';

// Espace insécable avant « % », comme le veut la typographie française
const PERCENT_SUFFIX = ' %';
const percentFormat = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });

/** Valeur totale d'une stat : « 3 » ou « 5,5 % ». */
export function formatStat(stat: StatId, value: number): string {
  if (STATS[stat].kind === 'integer') {
    // Le bonus d'évolution rend la Frappe fractionnaire : on affiche ce que le coup inflige vraiment, arrondi
    return String(Math.round(value));
  }
  return percentFormat.format(value * 100) + PERCENT_SUFFIX;
}

/** Bonus ou écart signé : « +3 », « −1,5 % ». */
export function formatStatDelta(stat: StatId, delta: number): string {
  const sign = delta < 0 ? '−' : '+';
  return sign + formatStat(stat, Math.abs(delta));
}
