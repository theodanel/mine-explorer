// Progrès visible (retours Discord du 18/10/2026) : quand le mineur devient plus fort, la mine le montre tout de suite,
// au-dessus de lui, avec ce qui a changé. Fichier pur : calcul du gain, sans Pixi.
import { powerOf } from '../balance/balance';
import { formatStat } from '../equipment/equipment-format';
import { MiningStats, STAT_IDS, STATS } from '../equipment/equipment.model';

/** Au plus deux lignes de détail : la plus parlante d'abord, sans couvrir la scène. */
const MAX_LINES = 2;
/** Écart relatif sous lequel une stat n'est pas citée (arrondis, bonus minuscules). */
const MIN_RELATIVE_CHANGE = 0.005;

export interface PowerGain {
  readonly from: number;
  readonly to: number;
  /** « Frappe 4 → 5 », pour les stats qui ont le plus monté. */
  readonly lines: readonly string[];
}

/** Ce que le joueur a gagné en passant de `before` à `after`, ou null si sa Puissance n'a pas monté. */
export function powerGain(before: MiningStats, after: MiningStats): PowerGain | null {
  const from = powerOf(before);
  const to = powerOf(after);
  if (to <= from) {
    return null;
  }
  const lines = STAT_IDS.map((stat) => ({ stat, change: relativeChange(before[stat], after[stat]) }))
    .filter(({ change }) => change >= MIN_RELATIVE_CHANGE)
    .sort((a, b) => b.change - a.change)
    .slice(0, MAX_LINES)
    // Une stat dont l'affichage arrondi ne bouge pas (« 4 → 4 ») n'apprend rien au joueur
    .map(({ stat }) => ({ label: STATS[stat].label, before: formatStat(stat, before[stat]), after: formatStat(stat, after[stat]) }))
    .filter(({ before: shownBefore, after: shownAfter }) => shownBefore !== shownAfter)
    .map(({ label, before: shownBefore, after: shownAfter }) => `${label} ${shownBefore} → ${shownAfter}`);
  return { from, to, lines };
}

function relativeChange(before: number, after: number): number {
  if (after <= before) {
    return 0;
  }
  return before === 0 ? 1 : (after - before) / before;
}
