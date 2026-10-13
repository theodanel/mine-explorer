import { rockHp, STAGES_PER_ZONE } from '../balance/balance';
import {
  applyDamage,
  isValidProgress,
  migrateProgress,
  remainingHp,
  rockHealth,
  stageLabel,
  stagesReached,
  START_PROGRESS,
} from './progression-rules';

describe('applyDamage', () => {
  it('entame le rocher', () => {
    expect(applyDamage(START_PROGRESS, 5)).toEqual({
      progress: { zone: 1, stage: 1, damage: 5 },
      rockBroken: false,
      clearedZone: null,
    });
  });

  it('passe à l\'étape suivante quand le rocher casse, en perdant les dégâts en trop', () => {
    expect(applyDamage({ zone: 1, stage: 3, damage: 0 }, 1e9)).toEqual({
      progress: { zone: 1, stage: 4, damage: 0 },
      rockBroken: true,
      clearedZone: null,
    });
  });

  it('passe de 1-15 à 2-1', () => {
    expect(applyDamage({ zone: 1, stage: STAGES_PER_ZONE, damage: 0 }, 1e9)).toEqual({
      progress: { zone: 2, stage: 1, damage: 0 },
      rockBroken: true,
      clearedZone: 1,
    });
  });
});

describe('affichage', () => {
  it('nomme l\'étape « zone-étape »', () => {
    expect(stageLabel({ zone: 2, stage: 7, damage: 0 })).toBe('2-7');
  });

  it('donne la résistance restante du rocher', () => {
    const half = { zone: 1, stage: 1, damage: rockHp(1, 1) / 2 };
    expect(remainingHp(half)).toBe(rockHp(1, 1) / 2);
    expect(rockHealth(half)).toBeCloseTo(0.5);
  });

  it('compte les étapes atteintes depuis le début', () => {
    expect(stagesReached({ zone: 2, stage: 1, damage: 0 })).toBe(STAGES_PER_ZONE + 1);
  });
});

describe('sauvegarde', () => {
  it('reprend une ancienne sauvegarde « vie de zone » au premier rocher de sa zone', () => {
    expect(migrateProgress({ zone: 7, damage: 123 })).toEqual({ zone: 7, stage: 1, damage: 0 });
  });

  it("garde la partie d'un joueur quand un rééquilibrage baisse les PV du filon en cours", () => {
    // Sauvegarde de la version en ligne : 2-10 bien entamé, avec les PV d'avant l'adoucissement des zones 1 à 4
    const before = { zone: 2, stage: 10, damage: 1500 };
    const migrated = migrateProgress(before);
    expect(isValidProgress(migrated)).toBe(true);
    expect(migrated).toEqual({ zone: 2, stage: 10, damage: rockHp(2, 10) - 1 });
  });

  it('ne touche pas aux dégâts qui tiennent dans le filon', () => {
    expect(migrateProgress({ zone: 2, stage: 10, damage: 5 })).toEqual({ zone: 2, stage: 10, damage: 5 });
  });

  it('accepte une progression cohérente', () => {
    expect(isValidProgress({ zone: 3, stage: 15, damage: 0 })).toBe(true);
  });

  it.each([
    null,
    { zone: 0, stage: 1, damage: 0 },
    { zone: 1, stage: 16, damage: 0 },
    { zone: 1, stage: 1, damage: -1 },
    { zone: 1, stage: 1, damage: rockHp(1, 1) },
  ])('rejette %j', (value: unknown) => {
    expect(isValidProgress(value)).toBe(false);
  });
});
