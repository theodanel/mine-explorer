import { TestBed } from '@angular/core/testing';

import { CLOCK } from '../shared/clock';
import { AUDIO_CONTEXT_FACTORY, Sound } from './sound';
import { SOUND_MIN_INTERVAL_MS } from './sound-catalog';

interface FakeSource {
  buffer: unknown;
  loop: boolean;
  playbackRate: { value: number };
  connect: (target: unknown) => unknown;
  start: () => void;
  stop: () => void;
  disconnect: () => void;
}

/** Contexte audio factice : garde les sources lancées, sans haut-parleur. */
function fakeContext() {
  const sources: FakeSource[] = [];
  const gainNode = () => ({ gain: { value: 1 }, connect: (target: unknown) => target });
  const context = {
    state: 'running',
    sampleRate: 8000,
    destination: {},
    resume: vi.fn(() => Promise.resolve()),
    suspend: vi.fn(() => Promise.resolve()),
    close: vi.fn(() => Promise.resolve()),
    createGain: vi.fn(gainNode),
    createBuffer: vi.fn(() => ({ copyToChannel: vi.fn() })),
    createBufferSource: vi.fn(() => {
      const source: FakeSource = {
        buffer: null,
        loop: false,
        playbackRate: { value: 1 },
        connect: () => gainNode(),
        start: vi.fn(),
        stop: vi.fn(),
        disconnect: vi.fn(),
      };
      sources.push(source);
      return source;
    }),
  };
  return { context, sources };
}

/** Le premier toucher crée le contexte et fabrique les sons, puis la musique juste après. */
async function firstTouch(): Promise<void> {
  document.dispatchEvent(new Event('pointerdown'));
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('Sound, lecture', () => {
  let now = 0;

  afterEach(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
  });

  async function setup() {
    localStorage.clear();
    now = 0;
    const { context, sources } = fakeContext();
    TestBed.configureTestingModule({
      providers: [
        { provide: AUDIO_CONTEXT_FACTORY, useValue: () => context },
        { provide: CLOCK, useValue: () => now },
      ],
    });
    const sound = TestBed.inject(Sound);
    await firstTouch();
    const effects = () => sources.filter((source) => !source.loop);
    const music = () => sources.filter((source) => source.loop);
    return { sound, context, effects, music };
  }

  it('joue un bruitage, pas deux fois dans le même instant', async () => {
    const { sound, effects } = await setup();
    sound.play('strike');
    sound.play('strike');
    expect(effects()).toHaveLength(1);
    now += SOUND_MIN_INTERVAL_MS;
    sound.play('strike');
    expect(effects()).toHaveLength(2);
  });

  it('reste muet quand les bruitages sont coupés', async () => {
    const { sound, effects } = await setup();
    sound.setVolume(0);
    sound.play('crit');
    expect(effects()).toHaveLength(0);
  });

  it("lance la musique en boucle, l'arrête quand elle est coupée et la relance ensuite", async () => {
    const { sound, music } = await setup();
    expect(music()).toHaveLength(1);
    sound.setMusicVolume(0);
    expect(music()[0].stop).toHaveBeenCalled();
    sound.setMusicVolume(0.5);
    expect(music()).toHaveLength(2);
  });

  it('ne lance pas la musique quand elle est coupée dans les paramètres', async () => {
    localStorage.clear();
    localStorage.setItem('mine-explorer.music-volume', '0');
    const { context } = fakeContext();
    TestBed.configureTestingModule({ providers: [{ provide: AUDIO_CONTEXT_FACTORY, useValue: () => context }] });
    TestBed.inject(Sound);
    await firstTouch();
    expect(context.createBufferSource).not.toHaveBeenCalled();
  });

  it('relance un contexte suspendu au toucher suivant', async () => {
    const { context } = await setup();
    context.state = 'suspended';
    document.dispatchEvent(new Event('touchend'));
    expect(context.resume).toHaveBeenCalled();
  });

  it("se met en pause quand l'onglet est caché", async () => {
    const { context } = await setup();
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(context.suspend).toHaveBeenCalled();
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(context.resume).toHaveBeenCalled();
  });
});
