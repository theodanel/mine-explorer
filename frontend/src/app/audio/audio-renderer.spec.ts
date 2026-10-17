import { AudioRenderer, renderRequest, requestKey } from './audio-renderer';
import { renderSound } from './synth';

const RATE = 4000;

describe('AudioRenderer', () => {
  it('calcule sur le fil principal quand le navigateur n’a pas de Worker', async () => {
    const renderer = new AudioRenderer();
    expect(renderer.usesWorker).toBe(false);
    expect(await renderer.render({ kind: 'sound', id: 'strike', rate: RATE })).toEqual(renderSound('strike', RATE));
  });

  it('distingue bruitages et musiques, zone par zone', () => {
    expect(requestKey({ kind: 'sound', id: 'strike', rate: RATE })).toBe('sound:strike');
    expect(requestKey({ kind: 'music', zone: 3, rate: RATE })).toBe('music:3');
    expect(renderRequest({ kind: 'music', zone: 3, rate: RATE }).length).toBeGreaterThan(0);
  });
});
