import { BASE_STATS, SET_BONUSES } from '../balance/balance';
import { gearStrikeMultiplier } from '../balance/rebirth';
import { EquippedItems, Item, SLOT_IDS, SlotId, TierId } from './equipment.model';
import {
  compareItems,
  computePower,
  computeStats,
  gearSet,
  hasAffix,
  powerDelta,
  rebirthMark,
  resolveHit,
  rollItem,
  sellPrice,
  speedMultiplier,
} from './equipment-rules';

/** Rejoue une suite de tirages connue, puis échoue si le code en demande plus que prévu. */
function sequence(...values: number[]): () => number {
  let index = 0;
  return () => {
    if (index >= values.length) {
      throw new Error('Tirage aléatoire non prévu par le test');
    }
    return values[index++];
  };
}

const createId = () => 'item-1';

function item(overrides: Partial<Item>): Item {
  return { id: 'x', slot: 'pickaxe', tier: 'wood', level: 1, stats: {}, ...overrides };
}

describe('rollItem', () => {
  // Ordre des tirages : emplacement, palier, variation de la Frappe de base, puis pour chaque affixe sa stat et sa variation
  it('forge un objet en Bois de niveau 1 : une Frappe de base et un affixe', () => {
    // pioche (2e emplacement), Bois, Frappe de base sans variation, affixe Vitesse sans variation. Poids de la pioche :
    // Frappe 3, Vitesse 1, Critique 1, Dégâts crit. 3, Or 1 (affinités Frappe et Dégâts crit.) : 0,39 tombe dans la Vitesse
    expect(rollItem(sequence(0.2, 0, 0.5, 0.39, 0.5), createId, 1)).toEqual({
      id: 'item-1',
      slot: 'pickaxe',
      tier: 'wood',
      level: 1,
      stats: { strikePower: 1, miningSpeed: 0.055 },
    });
  });

  it("porte n'importe quelle stat, quel que soit l'emplacement", () => {
    // des bottes (dernier emplacement) avec un affixe de Dégâts crit., hors de leurs affinités (Vitesse et Or)
    const result = rollItem(sequence(0.99, 0, 0.5, 0.6, 0.5), createId, 1);
    expect(result.slot).toBe('boots');
    expect(Object.keys(result.stats)).toEqual(['strikePower', 'critDamage']);
  });

  it("ajoute un affixe de Frappe à la Frappe de base", () => {
    const result = rollItem(sequence(0.2, 0, 0.5, 0, 0.5), createId, 10);
    expect(result.stats.strikePower).toBeGreaterThan(rollItem(sequence(0.2, 0, 0.5, 0.39, 0.5), createId, 10).stats.strikePower ?? 0);
  });

  it("donne à l'objet le niveau de la pioche et le palier de sa fenêtre", () => {
    // niveau 7 : Pierre 25 %, Cuivre 72 %, Fer 3 % ; 0.5 tombe dans le Cuivre
    const result = rollItem(sequence(0.2, 0.5, 0.5, 0.5, 0.5), createId, 7);
    expect(result.level).toBe(7);
    expect(result.tier).toBe('copper');
  });

  it('multiplie la seule Frappe des pièces de la famille de la phase, puis par renaissance après la phase 5', () => {
    const plain = rollItem(sequence(0.2, 0.5, 0.5, 0.5, 0.5), createId, 7);
    const corrupted = rollItem(sequence(0.2, 0.5, 0.5, 0.5, 0.5), createId, 7, undefined, { family: 2, stars: 0 });
    expect(corrupted.stats.strikePower).toBe(Math.round((plain.stats.strikePower ?? 0) * gearStrikeMultiplier(2, 0)));
    expect(corrupted.stats.critChance).toBe(plain.stats.critChance);
    expect(corrupted.stats.critDamage).toBe(plain.stats.critDamage);
    expect(hasAffix(corrupted, 'strikePower')).toBe(hasAffix(plain, 'strikePower'));
    expect(rebirthMark(corrupted)).toBe(' corrompu II');
    const starred = rollItem(sequence(0.2, 0.5, 0.5, 0.5, 0.5), createId, 7, undefined, { family: 5, stars: 2 });
    expect(rebirthMark(starred)).toBe(' corrompu V ✦2');
    expect(rebirthMark(plain)).toBe('');
    expect(gearStrikeMultiplier(1, 0)).toBe(1000);
    expect(gearStrikeMultiplier(5, 2)).toBe(1000 ** 5 * 100);
  });

  it('atteint le dernier palier non nul de la table, jamais au-delà', () => {
    // 0.9999 tombe tout en haut de la table du niveau 2 : la Pierre (8 %), jamais le Cuivre à 0 %
    expect(rollItem(sequence(0.2, 0.9999, 0.5, 0.5, 0.5), createId, 2).tier).toBe('stone');
  });

  it('donne 4 affixes distincts au palier Divin : avec la Frappe de base, les 5 stats sont présentes', () => {
    const result = rollItem(sequence(0.2, 0.5, 0.5, 0.99, 0.5, 0.99, 0.5, 0.99, 0.5, 0.99, 0.5), createId, 30);
    expect(result.tier).toBe('divine');
    expect(Object.keys(result.stats).sort()).toEqual(['critChance', 'critDamage', 'goldBonus', 'miningSpeed', 'strikePower']);
  });
});

describe('computeStats', () => {
  it('renvoie les stats de base sans équipement', () => {
    expect(computeStats({})).toEqual(BASE_STATS);
  });

  it('additionne les stats de tous les emplacements', () => {
    const stats = computeStats({
      pickaxe: item({ stats: { strikePower: 7 } }),
      gloves: item({ slot: 'gloves', stats: { strikePower: 2, critChance: 0.05 } }),
    });
    expect(stats.strikePower).toBe(14);
    expect(stats.critChance).toBeCloseTo(0.1);
  });

  it('plafonne la vitesse et la chance de critique', () => {
    const stats = computeStats({
      boots: item({ slot: 'boots', stats: { miningSpeed: 5 } }),
      gloves: item({ slot: 'gloves', stats: { critChance: 3 } }),
    });
    expect(stats.miningSpeed).toBe(2);
    expect(stats.critChance).toBe(1);
  });
});

describe('resolveHit', () => {
  const stats = { ...BASE_STATS, strikePower: 10, critChance: 0.5, critDamage: 0.5 };

  it('inflige la Frappe sur un coup normal', () => {
    expect(resolveHit(stats, sequence(0.9))).toEqual({ damage: 10, critical: false });
  });

  it('multiplie les dégâts sur un critique', () => {
    expect(resolveHit(stats, sequence(0.1))).toEqual({ damage: 15, critical: true });
  });
});

describe('autres règles', () => {
  it('affiche une Puissance égale au DPS × 100', () => {
    // 5 × (1 + 5 % × 50 %) × 12/23 coups par seconde ≈ 2,67 DPS
    expect(computePower(BASE_STATS)).toBe(267);
  });

  it('accélère l\'animation selon la vitesse', () => {
    expect(speedMultiplier({ ...BASE_STATS, miningSpeed: 0.25 })).toBeCloseTo(1.25);
  });

  it('vend selon le niveau et le palier', () => {
    expect(sellPrice(item({ tier: 'wood', level: 1 }))).toBe(5);
    expect(sellPrice(item({ tier: 'iron', level: 10 }))).toBeGreaterThan(sellPrice(item({ tier: 'copper', level: 10 })));
    expect(sellPrice(item({ tier: 'iron', level: 11 }))).toBeGreaterThan(sellPrice(item({ tier: 'iron', level: 10 })));
  });

  it("mesure le gain de Puissance d'un objet par rapport à celui porté", () => {
    const equipped = { pickaxe: item({ stats: { strikePower: 4 } }) };
    expect(powerDelta(equipped, item({ stats: { strikePower: 8 } }))).toBeGreaterThan(0);
    expect(powerDelta(equipped, item({ stats: { strikePower: 2 } }))).toBeLessThan(0);
    expect(powerDelta(equipped, item({ stats: { strikePower: 4 } }))).toBe(0);
  });

  it('compare toutes les stats présentes sur l\'un ou l\'autre objet', () => {
    const current = item({ stats: { strikePower: 2 } });
    const candidate = item({ stats: { strikePower: 3, critChance: 0.02 } });
    expect(compareItems(current, candidate)).toEqual([
      { stat: 'strikePower', current: 2, candidate: 3 },
      { stat: 'critChance', current: 0, candidate: 0.02 },
    ]);
  });

  it('compare avec un emplacement vide', () => {
    expect(compareItems(undefined, item({ stats: { strikePower: 1 } }))).toEqual([
      { stat: 'strikePower', current: 0, candidate: 1 },
    ]);
  });
});

describe('panoplie', () => {
  const piece = (slot: SlotId, tier: TierId): Item => ({ id: slot, slot, tier, level: 1, stats: { strikePower: 10 } });
  const wear = (tiers: readonly TierId[]): EquippedItems =>
    Object.fromEntries(tiers.map((tier, index) => [SLOT_IDS[index], piece(SLOT_IDS[index], tier)]));

  it('compte le palier le plus porté, le plus haut à égalité', () => {
    expect(gearSet({})).toBeNull();
    expect(gearSet(wear(['iron', 'iron', 'gold', 'gold']))).toEqual({ tier: 'gold', pieces: 2, strikePct: 0 });
  });

  it('donne de la Frappe à 3 pièces du même palier, davantage aux 5, sans cumul', () => {
    const three = gearSet(wear(['iron', 'iron', 'iron', 'gold', 'stone']));
    const five = gearSet(wear(['iron', 'iron', 'iron', 'iron', 'iron']));
    expect(three?.strikePct).toBe(SET_BONUSES[1].strikePct);
    expect(five?.strikePct).toBe(SET_BONUSES[0].strikePct);
    const raw = BASE_STATS.strikePower + 50;
    expect(computeStats(wear(['iron', 'iron', 'iron', 'iron', 'iron'])).strikePower).toBeCloseTo(raw * (1 + SET_BONUSES[0].strikePct));
    expect(computeStats(wear(['iron', 'gold', 'stone', 'wood', 'copper'])).strikePower).toBe(raw);
  });
});

