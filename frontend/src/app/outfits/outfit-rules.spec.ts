import { OUTFIT_BONUS_MAX, outfitCollectionBonus, OUTFITS } from '../balance/outfits';
import { isValidOutfitChoice, ownedOutfits, ownsOutfit } from './outfit-rules';

const NOTHING = { passClaimed: 0, dungeonBest: { crystal: 0, forge: 0 } };

describe('tenues', () => {
  it('compte 30 tenues aux identifiants uniques', () => {
    expect(OUTFITS).toHaveLength(30);
    expect(new Set(OUTFITS.map((outfit) => outfit.id)).size).toBe(OUTFITS.length);
  });

  it('donne la tenue d’une zone au dernier palier du passe de cette zone', () => {
    const first = OUTFITS.find((outfit) => outfit.source.kind === 'pass' && outfit.source.zone === 1);
    expect(first).toBeDefined();
    expect(ownsOutfit(first!, { ...NOTHING, passClaimed: 2 })).toBe(false);
    expect(ownsOutfit(first!, { ...NOTHING, passClaimed: 3 })).toBe(true);
  });

  it('donne une tenue tous les 10 niveaux de chaque donjon', () => {
    expect(ownedOutfits({ passClaimed: 0, dungeonBest: { crystal: 25, forge: 9 } })).toHaveLength(2);
  });

  it('donne 1 % de Frappe par tranche de 5 tenues, 5 % au plus', () => {
    expect(outfitCollectionBonus(4)).toBe(0);
    expect(outfitCollectionBonus(10)).toBeCloseTo(0.02);
    expect(outfitCollectionBonus(30)).toBe(OUTFIT_BONUS_MAX);
  });

  it('refuse de porter une tenue inconnue', () => {
    expect(isValidOutfitChoice({ worn: null })).toBe(true);
    expect(isValidOutfitChoice({ worn: OUTFITS[0].id })).toBe(true);
    expect(isValidOutfitChoice({ worn: 'cape-de-roi' })).toBe(false);
  });
});
