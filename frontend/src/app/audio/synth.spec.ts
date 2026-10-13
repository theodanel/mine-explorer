import { SOUND_IDS } from './sound-catalog';
import { MUSIC_LOOP_SECONDS, renderMusic, renderSound } from './synth';

const RATE = 8000;

function peak(samples: Float32Array): number {
  return samples.reduce((max, sample) => Math.max(max, Math.abs(sample)), 0);
}

describe('synth', () => {
  it.each(SOUND_IDS)('fabrique un son « %s » audible, court et sans saturation', (id) => {
    const samples = renderSound(id, RATE);
    expect(samples.length).toBeGreaterThan(0);
    expect(samples.length / RATE).toBeLessThanOrEqual(2);
    expect(samples.every(Number.isFinite)).toBe(true);
    expect(peak(samples)).toBeCloseTo(0.9, 5);
  });

  it("rend toujours le même son, d'un appareil à l'autre", () => {
    expect(renderSound('blast', RATE)).toEqual(renderSound('blast', RATE));
  });

  it('garde le coup de pioche, entendu sans arrêt, très court', () => {
    expect(renderSound('strike', RATE).length / RATE).toBeLessThanOrEqual(0.15);
  });

  it('fabrique une boucle de musique de 32 secondes qui se referme sans claquement', () => {
    const music = renderMusic(RATE);
    expect(music.length).toBe(MUSIC_LOOP_SECONDS * RATE);
    expect(music.every(Number.isFinite)).toBe(true);
    expect(peak(music)).toBeCloseTo(0.9, 5);
    // Le dernier échantillon et le premier se suivent à l'oreille : l'écart reste celui de deux échantillons voisins
    expect(Math.abs(music[music.length - 1] - music[0])).toBeLessThan(0.1);
  });
});
