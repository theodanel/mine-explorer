import { OUTFIT_BONUS_MAX, outfitCollectionBonus, OUTFITS } from '../balance/outfits';
import { isValidOutfitChoice, ownedOutfits } from './outfit-rules';

describe('tenues', () => {
  it('compte une tenue par zone, aux identifiants uniques', () => {
    expect(OUTFITS).toHaveLength(20);
    expect(new Set(OUTFITS.map((outfit) => outfit.id)).size).toBe(OUTFITS.length);
  });

  it('donne la tenue d’une zone quand elle est terminée', () => {
    expect(ownedOutfits(0)).toHaveLength(0);
    expect(ownedOutfits(3).map((outfit) => outfit.zone)).toEqual([1, 2, 3]);
  });

  it('donne 1 % de Frappe par tranche de 5 tenues, 4 % au plus', () => {
    expect(outfitCollectionBonus(4)).toBe(0);
    expect(outfitCollectionBonus(10)).toBeCloseTo(0.02);
    expect(outfitCollectionBonus(20)).toBe(OUTFIT_BONUS_MAX);
  });

  it('refuse de porter une tenue inconnue', () => {
    expect(isValidOutfitChoice({ worn: null })).toBe(true);
    expect(isValidOutfitChoice({ worn: OUTFITS[0].id })).toBe(true);
    expect(isValidOutfitChoice({ worn: 'cape-de-roi' })).toBe(false);
  });
});
