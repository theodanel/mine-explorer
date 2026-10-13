// Tableaux de docs/game-design/equilibrage.md calculés à partir de balance.ts.
// Lancement depuis frontend/ : node --import ./tools/register-ts.mjs tools/balance-tables.mts
import {
  expectedStatsAtPickaxe,
  MAX_PICKAXE_LEVEL,
  powerOf,
  recommendedPower,
  rockHp,
  segmentCost,
  sellPriceFor,
  STAGES_PER_ZONE,
  TIER_ORDER,
  upgradeDurationMs,
} from '../src/app/balance/balance.ts';
import { SLOT_IDS, SLOTS } from '../src/app/equipment/equipment.model.ts';

const slotMainStats = Object.fromEntries(SLOT_IDS.map((slot) => [slot, SLOTS[slot].mainStat])) as never;
const fr = (value: number): string => Math.round(value).toLocaleString('fr-FR');
const big = (value: number): string => {
  if (value >= 1e9) return `${(value / 1e9).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Md`;
  if (value >= 1e6) return `${(value / 1e6).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} M`;
  return fr(value);
};
const duration = (ms: number): string => {
  const minutes = ms / 60000;
  if (minutes < 60) return `${Math.round(minutes)} min`;
  return `${(minutes / 60).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} h`;
};

console.log('| Niveau | Segment | Niveau complet | Minuteur vers le suivant | Vente d\'un objet du palier de base |');
console.log('|---|---|---|---|---|');
for (const level of [1, 2, 3, 5, 8, 10, 12, 15, 18, 20, 22, 25, 28, 29]) {
  const cost = segmentCost(level) ?? 0;
  const baseTier = TIER_ORDER[Math.floor((level - 1) / 3)];
  console.log(`| ${level} | ${big(cost)} | ${big(cost * 10)} | ${duration(upgradeDurationMs(level))} | ${big(sellPriceFor(baseTier, level))} |`);
}

const powers = Array.from({ length: MAX_PICKAXE_LEVEL }, (_, index) => powerOf(expectedStatsAtPickaxe(index + 1, slotMainStats)));
console.log('\n| Zone | 1er filon | Dernier filon | Puissance recommandée (1er → dernier) | Pioche pour la finir (sans évolution) |');
console.log('|---|---|---|---|---|');
for (const zone of [1, 2, 3, 5, 7, 9, 11, 13, 15]) {
  const needed = powers.findIndex((power) => power >= recommendedPower(zone, STAGES_PER_ZONE)) + 1;
  console.log(
    `| ${zone} | ${big(rockHp(zone, 1))} PV | ${big(rockHp(zone, STAGES_PER_ZONE))} PV | ` +
      `${big(recommendedPower(zone, 1))} → ${big(recommendedPower(zone, STAGES_PER_ZONE))} | ${needed > 0 ? needed : '> 30'} |`,
  );
}
