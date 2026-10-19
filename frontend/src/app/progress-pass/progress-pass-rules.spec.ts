import { PASS_TIER_COUNT, PASS_TIERS, passTier } from '../balance/progress-pass';
import { claimableTiers, EMPTY_PASS, isValidPassState, nextTier, reachedTiers, rocksBroken } from './progress-pass-rules';

describe('passe de progression', () => {
  it('compte 3 paliers par zone, 60 en tout', () => {
    expect(PASS_TIER_COUNT).toBe(60);
    expect(passTier(3)).toMatchObject({ zone: 1, rocks: 15, finale: true });
    expect(passTier(4)).toMatchObject({ zone: 2, rocks: 20, finale: false });
  });

  it('donne plus d’éclats plus loin, le double en fin de zone, et le minerai de la zone', () => {
    expect(passTier(4).shards).toBeLessThan(passTier(7).shards);
    expect(passTier(6).shards).toBe(2 * passTier(5).shards);
    expect(passTier(1).ore).toBeNull();
    expect(passTier(4).ore?.tier).toBe('stone');
  });

  it('atteint un palier tous les 5 filons épuisés', () => {
    expect(rocksBroken(1, 1)).toBe(0);
    expect(reachedTiers(1, 5)).toBe(0);
    expect(reachedTiers(1, 6)).toBe(1);
    expect(reachedTiers(2, 1)).toBe(3);
    expect(reachedTiers(40, 1)).toBe(PASS_TIER_COUNT);
  });

  it('rend récupérables les paliers atteints, une seule fois', () => {
    expect(claimableTiers(EMPTY_PASS, 2, 6)).toEqual(PASS_TIERS.slice(0, 4));
    expect(claimableTiers({ claimed: 4 }, 2, 6)).toEqual([]);
  });

  it('annonce le prochain palier, puis plus rien à la fin', () => {
    expect(nextTier(1, 3)?.index).toBe(1);
    expect(nextTier(40, 1)).toBeNull();
  });

  it('refuse une sauvegarde invalide', () => {
    expect(isValidPassState({ claimed: 3 })).toBe(true);
    expect(isValidPassState({ claimed: -1 })).toBe(false);
    expect(isValidPassState({ claimed: PASS_TIER_COUNT + 1 })).toBe(false);
  });
});
