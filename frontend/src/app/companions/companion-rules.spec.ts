import { HATCH_MS, LEGENDARY_PITY, MAX_STARS, STAR_OVERFLOW_SHARDS } from '../balance/companions';
import {
  activeCompanionBonuses,
  addEgg,
  canSend,
  collectExpedition,
  EMPTY_COMPANIONS,
  feed,
  hatch,
  isValidCompanionState,
  rollEggRarity,
  sendOnExpedition,
} from './companion-rules';

describe('companion-rules', () => {
  it('garantit le légendaire au bout de la série', () => {
    expect(rollEggRarity(() => 0, LEGENDARY_PITY - 1)).toBe('legendary');
    expect(rollEggRarity(() => 0, 0)).toBe('common');
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

  it('change un doublon en étoile, puis en éclats à 5 étoiles', () => {
    const full = { ...EMPTY_COMPANIONS, owned: { dragonling: { stars: MAX_STARS, level: 1 } }, active: 'dragonling' as const };
    const result = hatch(addEgg(full, 'legendary', 0), () => 0, HATCH_MS.legendary);
    expect(result?.hatching).toMatchObject({ kind: 'maxed', shards: STAR_OVERFLOW_SHARDS });
    const one = { ...EMPTY_COMPANIONS, owned: { dragonling: { stars: 1, level: 1 } } };
    expect(hatch(addEgg(one, 'legendary', 0), () => 0, HATCH_MS.legendary)?.state.owned.dragonling?.stars).toBe(2);
  });

  it('nourrit jusqu\'au niveau maximum seulement', () => {
    const state = { ...EMPTY_COMPANIONS, owned: { mole: { stars: 1, level: 10 } } };
    expect(feed(state, 'mole')).toBe(state);
  });

  it('envoie en expédition sauf le compagnon actif, deux au plus', () => {
    const state = {
      ...EMPTY_COMPANIONS,
      owned: { canary: { stars: 1, level: 1 }, mole: { stars: 1, level: 1 }, bat: { stars: 1, level: 1 }, golem: { stars: 1, level: 1 } },
      active: 'golem' as const,
    };
    expect(canSend(state, 'golem', 4)).toBe(false);
    const away = sendOnExpedition(sendOnExpedition(state, 'canary', 4, 0), 'mole', 4, 0);
    expect(canSend(away, 'bat', 4)).toBe(false);
    expect(collectExpedition(away, 'canary', 1000)).toBeNull();
    const back = collectExpedition(away, 'canary', 4 * 3600 * 1000);
    expect(back?.loot).toEqual({ shards: 4, ores: 2 });
    expect(back?.state.expeditions.canary).toBeUndefined();
  });

  it('refuse une sauvegarde incohérente', () => {
    expect(isValidCompanionState(EMPTY_COMPANIONS)).toBe(true);
    expect(isValidCompanionState({ ...EMPTY_COMPANIONS, active: 'canary' })).toBe(false);
    expect(isValidCompanionState({ ...EMPTY_COMPANIONS, owned: { canary: { stars: 9, level: 1 } } })).toBe(false);
  });
});
