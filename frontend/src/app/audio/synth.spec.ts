import { SOUND_IDS } from './sound-catalog';
import { renderSound } from './synth';

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
});
