import { forgeSound, VOLUME_STEPS } from './sound-catalog';

describe('sound-catalog', () => {
  it('sonne plus riche à mesure que le palier monte', () => {
    expect(forgeSound('wood')).toBe('forgeCommon');
    expect(forgeSound('iron')).toBe('forgeRare');
    expect(forgeSound('crystal')).toBe('forgeEpic');
    expect(forgeSound('divine')).toBe('forgeLegendary');
  });

  it('propose les volumes du plus fort au coupé, en gardant le moyen des anciennes sauvegardes', () => {
    expect(VOLUME_STEPS).toEqual([1, 0.5, 0.25, 0]);
  });
});
