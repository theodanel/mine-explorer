import { forgeSound, nextVolume, VOLUME_STEPS } from './sound-catalog';

describe('sound-catalog', () => {
  it('sonne plus riche à mesure que le palier monte', () => {
    expect(forgeSound('wood')).toBe('forgeCommon');
    expect(forgeSound('iron')).toBe('forgeRare');
    expect(forgeSound('crystal')).toBe('forgeEpic');
    expect(forgeSound('divine')).toBe('forgeLegendary');
  });

  it('fait défiler fort, moyen, coupé puis revient à fort', () => {
    expect(VOLUME_STEPS.map(nextVolume)).toEqual([0.5, 0, 1]);
  });
});
