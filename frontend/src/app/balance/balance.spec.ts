import { SLOT_IDS, SLOTS, SlotId, StatId, TIER_IDS, TierId } from '../equipment/equipment.model';
import {
  BASE_STATS,
  expectedStatsAtPickaxe,
  goldForDamage,
  MAX_PICKAXE_LEVEL,
  powerOf,
  recommendedPower,
  secondaryStatCount,
  secondsToMine,
  segmentCost,
  sellPriceFor,
  TIER_ORDER,
  tierChances,
  OFFLINE_CAP_MS,
  offlineGains,
  upgradeDurationMs,
  rockHp,
  STAGES_PER_ZONE,
  stageTargetSeconds,
} from './balance';

const SLOT_MAIN_STATS = Object.fromEntries(SLOT_IDS.map((slot) => [slot, SLOTS[slot].mainStat])) as Record<
  SlotId,
  StatId
>;

/** Premier niveau de pioche dont l'équipement moyen atteint la Puissance recommandée du dernier rocher de la zone. */
function pickaxeNeededFor(zone: number): number | null {
  for (let level = 1; level <= MAX_PICKAXE_LEVEL; level++) {
    if (powerOf(expectedStatsAtPickaxe(level, SLOT_MAIN_STATS)) >= recommendedPower(zone, STAGES_PER_ZONE)) {
      return level;
    }
  }
  return null;
}

describe('paliers', () => {
  it('suivent le même ordre que le modèle', () => {
    expect(TIER_ORDER).toEqual(TIER_IDS);
  });

  it('donnent plus de stats secondaires en montant', () => {
    expect(secondaryStatCount('wood')).toBe(0);
    expect(secondaryStatCount('iron')).toBe(1);
    expect(secondaryStatCount('divine')).toBe(3);
  });

  it('se vendent selon leur niveau, 50 % plus cher un palier au-dessus de la base', () => {
    expect(sellPriceFor('wood', 1)).toBe(5);
    expect(sellPriceFor('stone', 1)).toBe(8);
    expect(sellPriceFor('copper', 10)).toBeGreaterThan(sellPriceFor('iron', 10) / 2);
  });

  it('rapportent une part de segment qui baisse avec le niveau sans devenir négligeable', () => {
    const baseTier = (level: number): TierId => TIER_ORDER[Math.floor((level - 1) / 3)];
    const share = (level: number): number => sellPriceFor(baseTier(level), level) / (segmentCost(level) ?? Infinity);
    expect(share(10)).toBeGreaterThan(share(20));
    // Environ 0,07 % au niveau 29 : faible, mais une vente compte encore quand on en fait des centaines
    // (deux fois plus de forges depuis les éclats du 13/10/2026 : les ventes font 18 % de l'or d'une partie)
    expect(share(29)).toBeGreaterThan(0.0006);
  });
});

describe('table des chances de la pioche', () => {
  it.each(Array.from({ length: MAX_PICKAXE_LEVEL }, (_, index) => index + 1))('totalise 100 % au niveau %i', (level) => {
    const total = Object.values(tierChances(level)).reduce((sum, chance) => sum + chance, 0);
    expect(total).toBeCloseTo(100, 6);
  });

  it('ne forge que du Bois au niveau 1', () => {
    expect(tierChances(1).wood).toBe(100);
  });

  it('fait arriver le palier suivant par petites touches', () => {
    expect(tierChances(2)).toMatchObject({ wood: 92, stone: 8, copper: 0 });
  });

  it('ne donne pas de Fer avant le niveau 7', () => {
    expect(tierChances(5)).toMatchObject({ wood: 12, stone: 80, copper: 8, iron: 0 });
    expect(tierChances(6).iron).toBe(0);
    expect(tierChances(7).iron).toBe(3);
  });

  it('fait glisser la fenêtre d\'un palier tous les 3 niveaux', () => {
    expect(tierChances(4).stone).toBe(72);
    expect(tierChances(7).copper).toBe(72);
  });

  it('ne garde jamais plus de 3 paliers possibles', () => {
    for (let level = 1; level <= MAX_PICKAXE_LEVEL; level++) {
      const possible = Object.values(tierChances(level)).filter((chance) => chance > 0);
      expect(possible.length).toBeLessThanOrEqual(3);
    }
  });

  it('finit presque entièrement en Divin', () => {
    expect(tierChances(MAX_PICKAXE_LEVEL).divine).toBeGreaterThan(95);
  });
});

describe('pioche', () => {
  it("coûte de plus en plus cher par segment et s'arrête au niveau maximum", () => {
    expect(segmentCost(1)).toBe(15);
    expect(segmentCost(MAX_PICKAXE_LEVEL)).toBeNull();
  });

  it('coûte plus cher plus vite que la Puissance ne grandit', () => {
    const powerGrowth = powerOf(expectedStatsAtPickaxe(20, SLOT_MAIN_STATS)) / powerOf(expectedStatsAtPickaxe(10, SLOT_MAIN_STATS));
    const costGrowth = (segmentCost(20) ?? 0) / (segmentCost(10) ?? Infinity);
    expect(costGrowth).toBeGreaterThan(powerGrowth);
  });

  it("demande 1 minute d'amélioration au niveau 1", () => {
    expect(upgradeDurationMs(1)).toBe(60 * 1000);
  });
});

describe('étapes', () => {
  it('comptent 15 rochers par zone', () => {
    expect(STAGES_PER_ZONE).toBe(15);
  });

  it('donnent un peu plus de PV à chaque rocher, sans saut entre les zones', () => {
    expect(rockHp(1, 2)).toBeGreaterThan(rockHp(1, 1));
    expect(rockHp(2, 1) / rockHp(1, 15)).toBeCloseTo(rockHp(2, 2) / rockHp(2, 1), 2);
  });

  it('rendent les zones 1 à 4 tendres, puis rejoignent la courbe au 5-1', () => {
    // 1-1 : 10 % des 320 PV de la courbe, une dizaine de secondes sans équipement
    expect(rockHp(1, 1)).toBe(32);
    expect(rockHp(2, 15)).toBeLessThan(Math.round(320 * 1.073 ** 29) / 3);
    expect(rockHp(5, 1)).toBe(Math.round(320 * 1.073 ** 60));
  });

  it('recommandent la Puissance qui casse le rocher dans le temps visé', () => {
    expect(secondsToMine(rockHp(3, 5), recommendedPower(3, 5))).toBeLessThanOrEqual(stageTargetSeconds(3));
  });

  it('rapportent un quart de pièce par PV miné, plus le bonus du sac', () => {
    expect(goldForDamage(100, 0)).toBe(25);
    expect(goldForDamage(100, 0.2)).toBe(30);
  });
});

describe('absence', () => {
  it("donne un éclat toutes les 6 minutes d'absence", () => {
    expect(offlineGains(BASE_STATS, OFFLINE_CAP_MS).shards).toBe(40);
  });

  it('plafonne les gains à 4 h', () => {
    expect(offlineGains(BASE_STATS, 10 * OFFLINE_CAP_MS)).toEqual(offlineGains(BASE_STATS, OFFLINE_CAP_MS));
  });
});

// Intentions de design : si un réglage les casse, le document d'équilibrage doit être revu en même temps
describe('courbe de progression', () => {
  it("garde des minuteurs courts : l'or fixe le rythme, pas l'attente", () => {
    let totalMs = 0;
    for (let level = 1; level < MAX_PICKAXE_LEVEL; level++) {
      totalMs += upgradeDurationMs(level);
    }
    const days = totalMs / (24 * 60 * 60 * 1000);
    expect(days).toBeGreaterThan(1);
    expect(days).toBeLessThan(2);
  });

  it('ouvre vite les premières zones, puis demande environ 3 niveaux de pioche par zone, évolutions non comptées', () => {
    const needed = Array.from({ length: 7 }, (_, index) => pickaxeNeededFor(index + 1));
    expect(needed).toEqual([1, 8, 14, 19, 22, 25, 28]);
  });
});
