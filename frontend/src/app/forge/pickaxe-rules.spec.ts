import { MAX_PICKAXE_LEVEL, upgradeDurationMs } from '../balance/balance';
import {
  addSegment,
  canBuySegment,
  completeUpgrade,
  isValidPickaxeState,
  migratePickaxeState,
  PickaxeState,
  START_PICKAXE,
  upgradeTimeLeftMs,
} from './pickaxe-rules';

const NOW = 1_000_000;

function withSegments(segments: number): PickaxeState {
  return { level: 1, segments, upgradeEndsAt: null };
}

describe('segments et minuteur', () => {
  it('ajoute un segment sans lancer de minuteur', () => {
    expect(addSegment(START_PICKAXE, NOW)).toEqual(withSegments(1));
  });

  it('lance le minuteur au dixième segment', () => {
    expect(addSegment(withSegments(9), NOW)).toEqual({
      level: 1,
      segments: 10,
      upgradeEndsAt: NOW + upgradeDurationMs(1),
    });
  });

  it('bloque les segments pendant l\'amélioration', () => {
    const upgrading = addSegment(withSegments(9), NOW);
    expect(canBuySegment(upgrading)).toBe(false);
    expect(addSegment(upgrading, NOW)).toBe(upgrading);
  });

  it('attend la fin du minuteur, puis passe au niveau suivant', () => {
    const upgrading = addSegment(withSegments(9), NOW);
    const end = NOW + upgradeDurationMs(1);
    expect(completeUpgrade(upgrading, end - 1)).toBe(upgrading);
    expect(upgradeTimeLeftMs(upgrading, end - 1000)).toBe(1000);
    expect(completeUpgrade(upgrading, end)).toEqual({ level: 2, segments: 0, upgradeEndsAt: null });
  });

  it('valide une amélioration finie pendant que le jeu était fermé', () => {
    const upgrading = addSegment(withSegments(9), NOW);
    expect(completeUpgrade(upgrading, NOW + 10 * upgradeDurationMs(1)).level).toBe(2);
  });

  it('refuse les segments au niveau maximum', () => {
    expect(canBuySegment({ level: MAX_PICKAXE_LEVEL, segments: 0, upgradeEndsAt: null })).toBe(false);
  });
});

describe('sauvegarde', () => {
  it('complète une ancienne sauvegarde sans minuteur', () => {
    const migrated = migratePickaxeState({ level: 4, segments: 3 });
    expect(migrated).toEqual({ level: 4, segments: 3, upgradeEndsAt: null });
    expect(isValidPickaxeState(migrated)).toBe(true);
  });

  it.each([
    { level: 0, segments: 0, upgradeEndsAt: null },
    { level: 1, segments: 11, upgradeEndsAt: null },
    { level: 1, segments: 10, upgradeEndsAt: null },
    { level: 1, segments: 3, upgradeEndsAt: NOW },
  ])('rejette %j', (value: unknown) => {
    expect(isValidPickaxeState(value)).toBe(false);
  });
});
