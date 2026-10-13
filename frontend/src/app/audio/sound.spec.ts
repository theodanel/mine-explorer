import { TestBed } from '@angular/core/testing';

import { AUDIO_CONTEXT_FACTORY, Sound } from './sound';

describe('Sound', () => {
  function create(): Sound {
    TestBed.configureTestingModule({ providers: [{ provide: AUDIO_CONTEXT_FACTORY, useValue: () => null }] });
    return TestBed.inject(Sound);
  }

  beforeEach(() => localStorage.clear());

  it('garde les volumes choisis, bruitages et musique séparément', () => {
    const sound = create();
    sound.setVolume(0.25);
    sound.setMusicVolume(0);
    TestBed.resetTestingModule();
    const reloaded = create();
    expect(reloaded.volume()).toBe(0.25);
    expect(reloaded.musicVolume()).toBe(0);
  });

  it('part fort pour les bruitages et moyen pour la musique', () => {
    const sound = create();
    expect(sound.volume()).toBe(1);
    expect(sound.musicVolume()).toBe(0.5);
  });

  it('reste muet sans Web Audio, sans planter', () => {
    const sound = create();
    document.dispatchEvent(new Event('pointerdown'));
    expect(() => sound.play('strike')).not.toThrow();
    expect(() => sound.setMusicVolume(1)).not.toThrow();
  });

  it("reprend le volume réglé avec l'ancienne version, et la musique par défaut", () => {
    localStorage.setItem('mine-explorer.volume', '0.5');
    const sound = create();
    expect(sound.volume()).toBe(0.5);
    expect(sound.musicVolume()).toBe(0.5);
  });

  it('ignore un volume enregistré invalide', () => {
    localStorage.setItem('mine-explorer.volume', '7');
    localStorage.setItem('mine-explorer.music-volume', 'fort');
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const sound = create();
    expect(sound.volume()).toBe(1);
    expect(sound.musicVolume()).toBe(0.5);
  });
});
