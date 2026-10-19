import { MAX_PICKAXE_LEVEL, SEGMENTS_PER_LEVEL, upgradeDurationMs, upgradeShortcutMs } from '../balance/balance';
import {
  addSegment,
  canBuySegment,
  completeUpgrade,
  isValidPickaxeState,
  migratePickaxeState,
  PickaxeState,
  shortenUpgrade,
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

  it('avance l’amélioration à chaque filon épuisé, bien plus pour un gardien, jamais au-delà de sa fin', () => {
    const level = 20;
    const duration = upgradeDurationMs(level);
    const upgrading = { level, segments: SEGMENTS_PER_LEVEL, upgradeEndsAt: duration };
    const rock = shortenUpgrade(upgrading, 0, false);
    expect(rock.savedMs).toBe(upgradeShortcutMs(level, false));
    expect(rock.state.upgradeEndsAt).toBe(duration - rock.savedMs);
    expect(shortenUpgrade(upgrading, 0, true).savedMs).toBe(Math.round(duration * 0.1));
    // Presque fini : on ne gagne que ce qu'il reste
    expect(shortenUpgrade(upgrading, duration - 1000, true)).toEqual({ state: { ...upgrading, upgradeEndsAt: duration - 1000 }, savedMs: 1000 });
    // Pas d'amélioration en cours : rien ne change
    expect(shortenUpgrade(START_PICKAXE, 0, true).state).toBe(START_PICKAXE);
  });

  it('retire au moins 5 secondes, même aux premiers niveaux', () => {
    expect(upgradeShortcutMs(1, false)).toBe(5000);
  });
});
