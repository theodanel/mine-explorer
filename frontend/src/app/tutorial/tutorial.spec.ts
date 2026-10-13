import { TestBed } from '@angular/core/testing';

import { Inventory } from '../equipment/inventory';
import { Navigation } from '../navigation/navigation';
import { GeodeShards } from '../wallet/geode-shards';
import { Tutorial } from './tutorial';
import { isNewGame, nextStep, TUTORIAL_STEPS } from './tutorial-steps';

describe('tutorial-steps', () => {
  it('reste court : quatre étapes, la forge à toucher vraiment', () => {
    expect(TUTORIAL_STEPS.map((step) => step.target)).toEqual(['rock', 'forge', 'pickaxe', 'missions']);
    expect(TUTORIAL_STEPS.find((step) => step.target === 'forge')?.advance).toBe('target');
  });

  it('enchaîne les étapes puis se termine', () => {
    expect(nextStep(0)).toBe(1);
    expect(nextStep(TUTORIAL_STEPS.length - 1)).toBeNull();
  });

  it('ne se lance que sur une partie qui commence', () => {
    expect(isNewGame(1, 1)).toBe(true);
    expect(isNewGame(1, 2)).toBe(false);
    expect(isNewGame(3, 1)).toBe(false);
  });
});

describe('Tutorial', () => {
  beforeEach(() => localStorage.clear());

  it('démarre sur une nouvelle partie, au filon', () => {
    const tutorial = TestBed.inject(Tutorial);
    expect(tutorial.step()?.target).toBe('rock');
    expect(tutorial.visible()).toBe(true);
  });

  it('ne se lance pas pour un joueur qui a déjà avancé', () => {
    localStorage.setItem('mine-explorer.progress', JSON.stringify({ zone: 2, stage: 4, damage: 0 }));
    expect(TestBed.inject(Tutorial).step()).toBeNull();
  });

  it('attend les premiers éclats pour montrer la forge', () => {
    const tutorial = TestBed.inject(Tutorial);
    tutorial.advance();
    expect(tutorial.step()?.target).toBe('forge');
    expect(tutorial.visible()).toBe(false);
    TestBed.inject(GeodeShards).add(TestBed.inject(Inventory).forgeCost);
    expect(tutorial.visible()).toBe(true);
  });

  it("se cache quand le joueur ouvre une page du menu", () => {
    const tutorial = TestBed.inject(Tutorial);
    TestBed.inject(Navigation).open('profile');
    expect(tutorial.visible()).toBe(false);
  });

  it('ne revient plus une fois passé', () => {
    TestBed.inject(Tutorial).finish();
    TestBed.resetTestingModule();
    expect(TestBed.inject(Tutorial).step()).toBeNull();
  });
});
