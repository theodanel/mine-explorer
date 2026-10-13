import { TestBed } from '@angular/core/testing';

import { EVOLUTION_FORMS, evolutionStrikeMultiplier } from '../balance/balance';
import { Inventory } from '../equipment/inventory';
import { GeodeShards } from '../wallet/geode-shards';
import { canEvolve, currentTier, objectivesFor } from './evolution-rules';
import { Evolution } from './evolution';

const MINER = EVOLUTION_FORMS[1];
/** Objectif du dernier palier pour cette mesure : le remplir remplit tous les paliers. */
const targetOf = (metric: string): number =>
  Math.max(0, ...MINER.objectives.filter((objective) => objective.metric === metric).map((objective) => objective.target));

describe('Evolution', () => {
  /** Joueur qui a rempli (ou non) les objectifs du Mineur. */
  function setup(done: boolean): Evolution {
    localStorage.clear();
    const factor = done ? 1 : 0.5;
    localStorage.setItem('mine-explorer.progress', JSON.stringify({ zone: Math.ceil(targetOf('zone') * factor), stage: 1, damage: 0 }));
    localStorage.setItem('mine-explorer.pickaxe', JSON.stringify({ level: Math.ceil(targetOf('pickaxeLevel') * factor), segments: 0, upgradeEndsAt: null }));
    localStorage.setItem(
      'mine-explorer.counters',
      JSON.stringify({
        itemsForged: Math.ceil(targetOf('itemsForged') * factor),
        itemsSold: 0,
        segmentsPaid: 0,
        eventsTouched: 0,
        rocksBroken: Math.ceil(targetOf('rocksBroken') * factor),
      }),
    );
    return TestBed.inject(Evolution);
  }

  it('commence en Apprenti', () => {
    const evolution = setup(false);
    expect(evolution.form().id).toBe('apprentice');
    expect(evolution.next()?.id).toBe('miner');
  });

  it('refuse la promotion tant qu\'un objectif manque', () => {
    const evolution = setup(false);
    expect(evolution.ready()).toBe(false);
    expect(evolution.evolve()).toBe(false);
  });

  it('donne les éclats d\'un objectif rempli, une seule fois', () => {
    const evolution = setup(true);
    const shards = TestBed.inject(GeodeShards);
    const before = shards.amount();
    expect(evolution.claim(0)).toBe(true);
    expect(shards.amount()).toBe(before + MINER.objectives[0].shards);
    expect(evolution.claim(0)).toBe(false);
  });

  it('promeut sans rien payer, et donne les récompenses oubliées', () => {
    const evolution = setup(true);
    const shards = TestBed.inject(GeodeShards);
    const before = shards.amount();
    evolution.claim(0);
    expect(evolution.evolve()).toBe(true);
    expect(evolution.form().id).toBe('miner');
    const total = MINER.objectives.reduce((sum, objective) => sum + objective.shards, 0);
    expect(shards.amount()).toBe(before + total);
    expect(evolution.claimable()).toBe(0);
  });

  it('augmente la Frappe de l\'inventaire', () => {
    const evolution = setup(true);
    const inventory = TestBed.inject(Inventory);
    const before = inventory.stats().strikePower;
    evolution.evolve();
    expect(inventory.stats().strikePower).toBeCloseTo(before * evolutionStrikeMultiplier(1));
  });
});

describe('Évolutions', () => {
  it('multiplient les bonus de Frappe entre eux', () => {
    expect(evolutionStrikeMultiplier(EVOLUTION_FORMS.length - 1)).toBeCloseTo(1.5 ** 4);
  });

  it("demandent des objectifs de plus en plus grands, d'un palier et d'une forme à l'autre", () => {
    for (let index = 1; index < EVOLUTION_FORMS.length; index++) {
      const objectives = EVOLUTION_FORMS[index].objectives;
      for (const objective of objectives) {
        const earlier = objectives.filter((candidate) => candidate.metric === objective.metric && candidate.tier < objective.tier);
        for (const candidate of earlier) {
          expect(objective.target).toBeGreaterThan(candidate.target);
        }
        const previousForm = EVOLUTION_FORMS[index - 1].objectives.filter((candidate) => candidate.metric === objective.metric);
        for (const candidate of previousForm) {
          expect(objective.target).toBeGreaterThanOrEqual(candidate.target);
        }
      }
    }
  });

  it("n'ouvre un palier qu'une fois le précédent rempli", () => {
    const form = EVOLUTION_FORMS[1];
    const tierOne = { zone: 2, pickaxeLevel: 4, itemsForged: 0, rocksBroken: 99 };
    const objectives = objectivesFor(form, tierOne, []);
    expect(objectives.filter((objective) => objective.tier === 2).every((objective) => !objective.unlocked)).toBe(true);
    expect(currentTier(form, { ...tierOne, itemsForged: 60 })).toBe(2);
  });

  it('ne promeut pas une forme sans objectif', () => {
    expect(canEvolve(objectivesFor(EVOLUTION_FORMS[0], { zone: 99, pickaxeLevel: 30, itemsForged: 1e6, rocksBroken: 1e6 }, []))).toBe(false);
  });
});
