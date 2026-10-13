// Phrases affichées pour chaque bonus de l'arbre, des sorts et des artefacts.
import { BonusId, Bonuses, BONUS_IDS } from '../balance/skill-tree';

const NUMBER = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });

/** Pourcentage relatif (« +5 % de Frappe ») ou points absolus (« +2 points de Critique »). */
const BONUS_TEXT: Readonly<Record<BonusId, (value: number) => string>> = {
  strikePct: (value) => `${signed(value * 100)} % de Frappe`,
  critChance: (value) => `${signed(value * 100)} point${plural(value * 100)} de Critique`,
  critDamage: (value) => `${signed(value * 100)} % de Dégâts crit.`,
  speed: (value) => `${signed(value * 100)} point${plural(value * 100)} de Vitesse`,
  goldPct: (value) => `${signed(value * 100)} % d'or`,
  shardChance: (value) => `${signed(value * 100)} point${plural(value * 100)} de chance d'éclat par coup`,
  offlineEfficiency: (value) => `${signed(value * 100)} points d'or pendant l'absence`,
  cooldownPct: (value) => `−${NUMBER.format(value * 100)} % de recharge des sorts`,
  durationPct: (value) => `${signed(value * 100)} % de durée des sorts`,
  blastPct: (value) => `${signed(value * 100)} % de dégâts des explosions`,
};

export function describeBonus(id: BonusId, value: number): string {
  return BONUS_TEXT[id](value);
}

/** Toutes les lignes non nulles d'un ensemble de bonus. */
export function describeBonuses(bonuses: Bonuses): string[] {
  return BONUS_IDS.filter((id) => bonuses[id] !== 0).map((id) => describeBonus(id, bonuses[id]));
}

function signed(value: number): string {
  return `${value >= 0 ? '+' : '−'}${NUMBER.format(Math.abs(value))}`;
}

function plural(value: number): string {
  return Math.abs(value) >= 2 ? 's' : '';
}
