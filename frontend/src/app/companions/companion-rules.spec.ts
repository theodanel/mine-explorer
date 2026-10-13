import { DUPLICATE_STONES, HATCH_MS, LEGENDARY_PITY, MAX_STARS, starCost } from '../balance/companions';
import {
  activeCompanionBonuses,
  addEgg,
  canSend,
  collectExpedition,
  EMPTY_COMPANIONS,
  hatch,
  isValidCompanionState,
  migrateCompanionState,
  raiseStar,
  rollEggRarity,
  sendOnExpedition,
} from './companion-rules';

describe('companion-rules', () => {
  it('garantit le légendaire au bout de la série', () => {
    expect(rollEggRarity(() => 0, LEGENDARY_PITY - 1)).toBe('legendary');
    expect(rollEggRarity(() => 0, 0)).toBe('common');
  });

  it('respecte la rareté minimale d\'un œuf', () => {
    expect(rollEggRarity(() => 0, 0, 'rare')).toBe('rare');
  });

  it('couve le premier œuf tout de suite et range les suivants', () => {
    const state = addEgg(addEgg(EMPTY_COMPANIONS, 'common', 0), 'rare', 0);
    expect(state.incubating).toEqual({ rarity: 'common', endsAt: HATCH_MS.common });
    expect(state.eggs).toEqual(['rare']);
  });

  it('fait éclore un compagnon de la rareté de l\'œuf, qui accompagne le mineur', () => {
    const egg = addEgg(EMPTY_COMPANIONS, 'legendary', 0);
    expect(hatch(egg, () => 0, HATCH_MS.legendary - 1)).toBeNull();
    const result = hatch(egg, () => 0, HATCH_MS.legendary);
    expect(result?.hatching).toMatchObject({ id: 'dragonling', kind: 'new' });
    expect(result?.state.active).toBe('dragonling');
    expect(activeCompanionBonuses(result?.state ?? EMPTY_COMPANIONS).strikePct).toBeGreaterThan(0);
  });

  it('change un doublon en pierres d\'éveil', () => {
    const owned = { ...EMPTY_COMPANIONS, owned: { dragonling: { stars: 1 } }, active: 'dragonling' as const };
    const result = hatch(addEgg(owned, 'legendary', 0), () => 0, HATCH_MS.legendary);
    expect(result?.hatching).toMatchObject({ kind: 'duplicate', stones: DUPLICATE_STONES.legendary });
    expect(result?.state.stones).toBe(DUPLICATE_STONES.legendary);
  });

  it('monte une étoile contre des pierres, jusqu\'à 5', () => {
    const cost = starCost(1) ?? 0;
    const state = { ...EMPTY_COMPANIONS, owned: { mole: { stars: 1 } }, active: 'mole' as const, stones: cost };
    const raised = raiseStar(state, 'mole');
    expect(raised.owned.mole?.stars).toBe(2);
    expect(raised.stones).toBe(0);
    expect(raiseStar(raised, 'mole')).toBe(raised);
    const maxed = { ...state, owned: { mole: { stars: MAX_STARS } }, stones: 1000 };
    expect(raiseStar(maxed, 'mole')).toBe(maxed);
    expect(activeCompanionBonuses(raised).strikePct).toBeGreaterThan(activeCompanionBonuses(state).strikePct);
  });

  it('envoie en expédition sauf le compagnon actif, deux au plus', () => {
    const state = {
      ...EMPTY_COMPANIONS,
      owned: { canary: { stars: 1 }, mole: { stars: 1 }, bat: { stars: 1 }, golem: { stars: 1 } },
      active: 'golem' as const,
    };
    expect(canSend(state, 'golem', 4)).toBe(false);
    const away = sendOnExpedition(sendOnExpedition(state, 'canary', 4, 0), 'mole', 4, 0);
    expect(canSend(away, 'bat', 4)).toBe(false);
    expect(collectExpedition(away, 'canary', 1000)).toBeNull();
    const back = collectExpedition(away, 'canary', 8 * 3600 * 1000);
    expect(back?.loot).toEqual({ shards: 4, stones: 1 });
    expect(back?.state.stones).toBe(1);
    expect(back?.state.expeditions.canary).toBeUndefined();
  });

  it('rembourse en pierres les niveaux d\'une ancienne sauvegarde', () => {
    const { stones: _stones, ...withoutStones } = EMPTY_COMPANIONS;
    const legacy = { ...withoutStones, owned: { mole: { stars: 2, level: 4 } }, active: 'mole' };
    const migrated = migrateCompanionState(legacy);
    expect(isValidCompanionState(migrated)).toBe(true);
    expect(migrated).toMatchObject({ owned: { mole: { stars: 2 } }, stones: 6 });
  });

  it('refuse une sauvegarde incohérente', () => {
    expect(isValidCompanionState(EMPTY_COMPANIONS)).toBe(true);
    expect(isValidCompanionState({ ...EMPTY_COMPANIONS, active: 'canary' })).toBe(false);
    expect(isValidCompanionState({ ...EMPTY_COMPANIONS, owned: { canary: { stars: 9 } } })).toBe(false);
  });
});
