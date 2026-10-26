import { compactNumber } from '../shared/format-number';
import { STATS, StatId } from './equipment.model';

// Espace insécable avant « % », comme le veut la typographie française
const PERCENT_SUFFIX = ' %';
const percentFormat = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });

/** Au-delà, les valeurs passent au format court : les pièces ✦ de fin de jeu ont des stats à 7 chiffres et plus. */
const COMPACT_FROM = 100_000;

/** Valeur totale d'une stat : « 3 », « 5,5 % », ou en court pour les grands nombres (« 8 M », « 279 k % »). */
export function formatStat(stat: StatId, value: number): string {
  if (STATS[stat].kind === 'integer') {
    // Le bonus d'évolution rend la Frappe fractionnaire : on affiche ce que le coup inflige vraiment, arrondi
    const rounded = Math.round(value);
    return rounded >= COMPACT_FROM ? compactNumber(rounded) : String(rounded);
  }
  const percent = value * 100;
  return (percent >= COMPACT_FROM ? compactNumber(percent) : percentFormat.format(percent)) + PERCENT_SUFFIX;
}

/** Bonus ou écart signé : « +3 », « −1,5 % ». */
export function formatStatDelta(stat: StatId, delta: number): string {
  const sign = delta < 0 ? '−' : '+';
  return sign + formatStat(stat, Math.abs(delta));
}
