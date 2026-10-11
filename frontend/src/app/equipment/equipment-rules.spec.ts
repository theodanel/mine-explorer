import { BASE_STATS } from '../balance/balance';
import { Item } from './equipment.model';
import {
  compareItems,
  computePower,
  computeStats,
  powerDelta,
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
  it('forge une pioche en Bois de niveau 1 avec la pioche au niveau 1', () => {
    // pioche (2e emplacement), Bois (70 % au niveau 1), valeur sans variation (0.5 → ±0 %)
    expect(rollItem(sequence(0.2, 0, 0.5), createId, 1)).toEqual({
      id: 'item-1',
      slot: 'pickaxe',
      tier: 'wood',
      level: 1,
      stats: { strikePower: 4 },
    });
  });

  it("donne à l'objet le niveau de la pioche et le palier de sa fenêtre", () => {
    // niveau 7 : Pierre 25 %, Cuivre 70 %, Fer 5 % ; 0.5 tombe dans le Cuivre
    const result = rollItem(sequence(0.2, 0.5, 0.5), createId, 7);
    expect(result.level).toBe(7);
    expect(result.tier).toBe('copper');
  });

  it('atteint le dernier palier non nul de la fenêtre, jamais au-delà', () => {
    // 0.9999 tombe tout en haut de la table du niveau 2 : Cuivre (0,5 %), jamais le Fer à 0 %
    expect(rollItem(sequence(0.2, 0.9999, 0.5), createId, 2).tier).toBe('copper');
  });

  it('donne 3 stats secondaires distinctes au palier Divin', () => {
    const result = rollItem(sequence(0.2, 0.5, 0.5, 0, 0.5, 0, 0.5, 0, 0.5), createId, 30);
    expect(result.tier).toBe('divine');
    expect(Object.keys(result.stats)).toHaveLength(4);
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

  it('vend selon le palier et le niveau', () => {
    expect(sellPrice(item({ tier: 'wood', level: 1 }))).toBe(5);
    expect(sellPrice(item({ tier: 'divine', level: 1 }))).toBe(2560);
    expect(sellPrice(item({ tier: 'wood', level: 11 }))).toBeGreaterThan(5);
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
