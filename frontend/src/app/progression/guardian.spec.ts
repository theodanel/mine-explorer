import { TestBed } from '@angular/core/testing';

import { GUARDIAN_SECONDS, guardianHp, guardianPower, recommendedPower, rockHp, STAGES_PER_ZONE } from '../balance/balance';
import { CLOCK } from '../shared/clock';
import { Progression } from './progression';
import {
  applyDamage,
  BEFORE_GUARDIAN_STAGE,
  challengeGuardian,
  failGuardian,
  GUARDIAN_STAGE,
  guardianTimeLeft,
  stageHp,
} from './progression-rules';

const SECOND = 1000;

describe('gardien de fin de zone, règles', () => {
  it('remplace le dernier filon par un gardien calculé sur 30 secondes', () => {
    expect(GUARDIAN_STAGE).toBe(STAGES_PER_ZONE);
    expect(stageHp(8, GUARDIAN_STAGE)).toBe(guardianHp(8));
    expect(stageHp(8, BEFORE_GUARDIAN_STAGE)).toBe(rockHp(8, BEFORE_GUARDIAN_STAGE));
    // Bien plus court qu'un filon : la Puissance conseillée le casse en moins de 30 s
    expect(guardianHp(8)).toBeLessThan(rockHp(8, GUARDIAN_STAGE));
    expect(guardianPower(8)).toBeLessThan(recommendedPower(8, GUARDIAN_STAGE));
  });

  it('mène au gardien, sauf quand il a été raté : le filon d’avant se reforme', () => {
    const before = { zone: 8, stage: BEFORE_GUARDIAN_STAGE, damage: 0 };
    expect(applyDamage(before, 1e30).progress.stage).toBe(GUARDIAN_STAGE);
    const blocked = applyDamage(before, 1e30, true);
    expect(blocked.rockBroken).toBe(true);
    expect(blocked.progress).toEqual(before);
  });

  it('retombe au filon d’avant en cas d’échec, et repart à pleins PV quand on le défie', () => {
    const fight = { zone: 8, stage: GUARDIAN_STAGE, damage: 123 };
    expect(failGuardian(fight)).toEqual({ zone: 8, stage: BEFORE_GUARDIAN_STAGE, damage: 0 });
    expect(challengeGuardian(failGuardian(fight))).toEqual({ zone: 8, stage: GUARDIAN_STAGE, damage: 0 });
  });

  it('compte 30 secondes de combat', () => {
    expect(guardianTimeLeft(0, 10 * SECOND)).toBe((GUARDIAN_SECONDS - 10) * SECOND);
    expect(guardianTimeLeft(0, 99 * SECOND)).toBe(0);
  });
});

describe('gardien de fin de zone, en jeu', () => {
  let now = 0;

  function setup(progress: object, blocked?: boolean): Progression {
    localStorage.clear();
    localStorage.setItem('mine-explorer.progress', JSON.stringify(progress));
    if (blocked !== undefined) {
      localStorage.setItem('mine-explorer.guardian-blocked', String(blocked));
    }
    now = 0;
    TestBed.configureTestingModule({ providers: [{ provide: CLOCK, useValue: () => now }] });
    return TestBed.inject(Progression);
  }

  afterEach(() => TestBed.resetTestingModule());

  it('lance le chrono en arrivant au gardien, et passe la zone s’il tombe à temps', () => {
    const progression = setup({ zone: 8, stage: BEFORE_GUARDIAN_STAGE, damage: 0 });
    progression.hit(1e30);
    expect(progression.guardianFight()).toBe(true);
    now = 20 * SECOND;
    expect(progression.hit(1e30).clearedZone).toBe(8);
    expect(progression.guardianFight()).toBe(false);
    expect(progression.progress()).toEqual({ zone: 9, stage: 1, damage: 0 });
  });

  it('se reforme au bout de 30 s : le joueur reste dans la zone, même en laissant tourner', () => {
    const progression = setup({ zone: 8, stage: GUARDIAN_STAGE, damage: 0 });
    progression.hit(1);
    now = 31 * SECOND;
    progression.hit(1);
    expect(progression.blocked()).toBe(true);
    expect(progression.progress().stage).toBe(BEFORE_GUARDIAN_STAGE);
    // Le filon d'avant se reforme à chaque fois
    expect(progression.hit(1e30).rockBroken).toBe(true);
    expect(progression.progress().stage).toBe(BEFORE_GUARDIAN_STAGE);
  });

  it('défie à nouveau le gardien sur demande', () => {
    const progression = setup({ zone: 8, stage: BEFORE_GUARDIAN_STAGE, damage: 0 }, true);
    expect(progression.blocked()).toBe(true);
    expect(progression.challengeGuardian()).toBe(true);
    expect(progression.blocked()).toBe(false);
    expect(progression.progress()).toEqual({ zone: 8, stage: GUARDIAN_STAGE, damage: 0 });
    expect(progression.guardianTimeLeft()).toBe(GUARDIAN_SECONDS * SECOND);
  });

  it('repart d’un combat neuf après un rechargement, sans garder les dégâts', () => {
    const progression = setup({ zone: 8, stage: GUARDIAN_STAGE, damage: 5 });
    expect(progression.progress().damage).toBe(0);
    expect(progression.guardianFight()).toBe(true);
  });

  it('ignore un blocage qui ne correspond pas au filon en cours', () => {
    expect(setup({ zone: 8, stage: 3, damage: 0 }, true).blocked()).toBe(false);
  });
});
