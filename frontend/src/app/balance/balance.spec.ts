import { SLOT_IDS, SLOTS, SlotId, StatId, TIER_IDS } from '../equipment/equipment.model';
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
  zoneHp,
  zoneTargetSeconds,
} from './balance';

const SLOT_MAIN_STATS = Object.fromEntries(SLOT_IDS.map((slot) => [slot, SLOTS[slot].mainStat])) as Record<
  SlotId,
  StatId
>;

/** Premier niveau de pioche dont l'équipement moyen atteint la Puissance recommandée de la zone. */
function pickaxeNeededFor(zone: number): number | null {
  for (let level = 1; level <= MAX_PICKAXE_LEVEL; level++) {
    if (powerOf(expectedStatsAtPickaxe(level, SLOT_MAIN_STATS)) >= recommendedPower(zone)) {
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

  it('se vendent deux fois plus cher à chaque palier', () => {
    expect(sellPriceFor('wood', 1)).toBe(5);
    expect(sellPriceFor('stone', 1)).toBe(10);
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

  it('fait arriver les paliers supérieurs par petites touches', () => {
    expect(tierChances(2)).toMatchObject({ wood: 88, stone: 11.5, copper: 0.5, iron: 0 });
  });

  it('fait glisser la fenêtre d\'un palier tous les 3 niveaux', () => {
    expect(tierChances(4).stone).toBe(70);
    expect(tierChances(7).copper).toBe(70);
  });

  it('ne garde jamais plus de 4 paliers possibles', () => {
    for (let level = 1; level <= MAX_PICKAXE_LEVEL; level++) {
      const possible = Object.values(tierChances(level)).filter((chance) => chance > 0);
      expect(possible.length).toBeLessThanOrEqual(4);
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

  it("demande 2 minutes d'amélioration au niveau 1", () => {
    expect(upgradeDurationMs(1)).toBe(2 * 60 * 1000);
  });
});

describe('zones', () => {
  it('multiplient leur vie par 3,8 à chaque zone', () => {
    expect(zoneHp(2)).toBe(Math.round(zoneHp(1) * 3.8));
  });

  it('recommandent la Puissance qui mine la zone dans le temps visé', () => {
    expect(secondsToMine(zoneHp(3), recommendedPower(3))).toBeLessThanOrEqual(zoneTargetSeconds(3));
  });

  it('visent 10 minutes pour la première zone, puis deux fois plus à chaque zone', () => {
    expect(zoneTargetSeconds(1)).toBe(600);
    expect(zoneTargetSeconds(2)).toBe(1200);
  });

  it('rapportent un quart de pièce par PV miné, plus le bonus du sac', () => {
    expect(goldForDamage(100, 0)).toBe(25);
    expect(goldForDamage(100, 0.2)).toBe(30);
  });
});

describe('absence', () => {
  it('plafonne les gains à 4 h', () => {
    expect(offlineGains(BASE_STATS, 10 * OFFLINE_CAP_MS)).toEqual(offlineGains(BASE_STATS, OFFLINE_CAP_MS));
  });

  it("donne un éclat toutes les 10 minutes d'absence", () => {
    expect(offlineGains(BASE_STATS, OFFLINE_CAP_MS).shards).toBe(24);
  });
});

// Intentions de design : si un réglage les casse, le document d'équilibrage doit être revu en même temps
describe('courbe de progression', () => {
  it('cumule environ un mois de minuteurs pour atteindre la pioche 30', () => {
    let totalMs = 0;
    for (let level = 1; level < MAX_PICKAXE_LEVEL; level++) {
      totalMs += upgradeDurationMs(level);
    }
    const days = totalMs / (24 * 60 * 60 * 1000);
    expect(days).toBeGreaterThan(25);
    expect(days).toBeLessThan(35);
  });

  it('demande environ 3 niveaux de pioche de plus à chaque zone', () => {
    const needed = Array.from({ length: 11 }, (_, index) => pickaxeNeededFor(index + 1));
    expect(needed).toEqual([3, 7, 10, 13, 15, 18, 20, 22, 25, 27, 30]);
  });
});
