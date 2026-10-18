import { renderZoneMusic, themeLoopSeconds, ZONE_THEMES, zoneTheme } from './zone-music';

const RATE = 4000;

function peak(samples: Float32Array): number {
  return samples.reduce((max, sample) => Math.max(max, Math.abs(sample)), 0);
}

describe('zone-music', () => {
  it('donne une musique à chacune des 20 zones, puis garde celle du Cœur du monde', () => {
    expect(ZONE_THEMES).toHaveLength(20);
    expect(zoneTheme(25)).toBe(ZONE_THEMES[19]);
    expect(zoneTheme(0)).toBe(ZONE_THEMES[0]);
    expect(new Set(ZONE_THEMES.map((theme) => theme.mood)).size).toBe(20);
  });

  it.each(ZONE_THEMES.map((_, index) => index + 1))('fabrique une boucle propre pour la zone %i', (zone) => {
    const music = renderZoneMusic(zone, RATE);
    expect(music.length).toBe(Math.ceil(themeLoopSeconds(zoneTheme(zone)) * RATE));
    expect(music.every(Number.isFinite)).toBe(true);
    expect(peak(music)).toBeCloseTo(0.9, 5);
    // La fin et le début se suivent à l'oreille : pas de claquement à la reprise de la boucle
    expect(Math.abs(music[music.length - 1] - music[0])).toBeLessThan(0.15);
  });

  it("rend toujours la même musique, d'un appareil à l'autre", () => {
    expect(renderZoneMusic(8, RATE)).toEqual(renderZoneMusic(8, RATE));
  });

  it('change vraiment de musique entre deux zones', () => {
    expect(renderZoneMusic(5, RATE)).not.toEqual(renderZoneMusic(12, RATE));
  });
});
