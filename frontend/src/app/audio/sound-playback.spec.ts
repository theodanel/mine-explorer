import { TestBed } from '@angular/core/testing';

import { CLOCK } from '../shared/clock';
import { AUDIO_CONTEXT_FACTORY, Sound } from './sound';
import { SOUND_IDS, SOUND_MIN_INTERVAL_MS } from './sound-catalog';

/** Contexte audio factice : compte les sons lancés, sans haut-parleur. */
function fakeContext() {
  const started: number[] = [];
  const gainNode = () => ({ gain: { value: 1 }, connect: (target: unknown) => target });
  const context = {
    state: 'running',
    destination: {},
    resume: vi.fn(() => Promise.resolve()),
    createGain: vi.fn(gainNode),
    createBufferSource: vi.fn(() => ({
      buffer: null as unknown,
      playbackRate: { value: 1 },
      connect: () => gainNode(),
      start: () => started.push(1),
    })),
    decodeAudioData: vi.fn(() => Promise.resolve({})),
  };
  return { context, started };
}

describe('Sound, lecture', () => {
  let now = 0;

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  async function setup(missing: readonly string[] = []) {
    localStorage.clear();
    now = 0;
    const { context, started } = fakeContext();
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) =>
        Promise.resolve({
          ok: !missing.some((id) => url.includes(id)),
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
        }),
      ),
    );
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    TestBed.configureTestingModule({
      providers: [
        { provide: AUDIO_CONTEXT_FACTORY, useValue: () => context },
        { provide: CLOCK, useValue: () => now },
      ],
    });
    const sound = TestBed.inject(Sound);
    // Le premier toucher crée le contexte et charge les sons
    document.dispatchEvent(new Event('pointerdown'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));
    return { sound, context, started };
  }

  it('joue un son chargé, pas deux fois dans le même instant', async () => {
    const { sound, started } = await setup();
    sound.play('strike');
    sound.play('strike');
    expect(started).toHaveLength(1);
    now += SOUND_MIN_INTERVAL_MS;
    sound.play('strike');
    expect(started).toHaveLength(2);
  });

  it('reste muet quand le volume est coupé', async () => {
    const { sound, started } = await setup();
    sound.setVolume(0);
    sound.play('crit');
    expect(started).toHaveLength(0);
  });

  it('reste muet pour un fichier absent et le signale une seule fois', async () => {
    const { sound, started } = await setup(['blast']);
    sound.play('blast');
    expect(started).toHaveLength(0);
    expect(console.info).toHaveBeenCalledTimes(1);
  });

  it('relance un contexte suspendu au toucher suivant', async () => {
    const { context } = await setup();
    context.state = 'suspended';
    document.dispatchEvent(new Event('pointerdown'));
    expect(context.resume).toHaveBeenCalled();
  });

  it('connaît un fichier pour chaque son', () => {
    expect(new Set(SOUND_IDS).size).toBe(SOUND_IDS.length);
  });
});
