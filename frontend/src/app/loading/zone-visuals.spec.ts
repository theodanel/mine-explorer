import { rockUrl, zoneBackground } from './game-assets';

describe('décors des zones', () => {
  it('donne à chaque zone son décor et son rocher', () => {
    expect(zoneBackground(11).url).toBe('assets/backgrounds/zone11.webp');
    expect(rockUrl(20)).toBe('assets/rocks/zone20.webp');
  });

  it('reprend le rocher du magma tant que la zone 14 n’a pas le sien', () => {
    expect(zoneBackground(14).url).toBe('assets/backgrounds/zone14.webp');
    expect(rockUrl(14)).toBe('assets/rocks/zone9.webp');
  });

  it('reste dans le Cœur du monde au-delà de la zone 20', () => {
    expect(zoneBackground(25)).toEqual(zoneBackground(20));
    expect(rockUrl(0)).toBe('assets/rocks/zone1.webp');
  });
});
