import { GALLERIES, OFFERED_GALLERIES } from '../balance/galleries';
import { isValidGalleryState, rollOffer, scaleAmount } from './gallery-rules';

describe('gallery-rules', () => {
  it('propose deux galeries différentes, jamais l\'ordinaire', () => {
    const offer = rollOffer(() => 0.999999);
    expect(offer).toHaveLength(2);
    expect(new Set(offer).size).toBe(2);
    expect(offer.every((id) => OFFERED_GALLERIES.includes(id))).toBe(true);
  });

  it('garde la fraction en moyenne sans tirer quand il n\'y en a pas', () => {
    let draws = 0;
    const random = (): number => {
      draws++;
      return 0.4;
    };
    expect(scaleAmount(20, 1, random)).toBe(20);
    expect(draws).toBe(0);
    expect(scaleAmount(1, 1.5, random)).toBe(2);
    expect(scaleAmount(1, 1.5, () => 0.6)).toBe(1);
  });

  it('fait de chaque galerie proposée un échange', () => {
    for (const id of OFFERED_GALLERIES) {
      expect(GALLERIES[id].effects).toHaveLength(2);
    }
  });

  it('refuse une sauvegarde invalide', () => {
    expect(isValidGalleryState({ zone: 3, gallery: 'goldVein', offer: null })).toBe(true);
    expect(isValidGalleryState({ zone: 3, gallery: 'lava', offer: null })).toBe(false);
    expect(isValidGalleryState({ zone: 0, gallery: 'neutral', offer: [] })).toBe(false);
  });
});
