import { TestBed } from '@angular/core/testing';

import { AUDIO_CONTEXT_FACTORY, Sound } from './sound';

describe('Sound', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [{ provide: AUDIO_CONTEXT_FACTORY, useValue: () => null }] });
  });

  it('garde le volume choisi', () => {
    TestBed.inject(Sound).cycleVolume();
    expect(localStorage.getItem('mine-explorer.volume')).toBe('0.5');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: AUDIO_CONTEXT_FACTORY, useValue: () => null }] });
    expect(TestBed.inject(Sound).volume()).toBe(0.5);
  });

  it('reste muet sans Web Audio, sans planter', () => {
    const sound = TestBed.inject(Sound);
    document.dispatchEvent(new Event('pointerdown'));
    expect(() => sound.play('strike')).not.toThrow();
  });

  it('ignore un volume enregistré invalide', () => {
    localStorage.setItem('mine-explorer.volume', '7');
    expect(TestBed.inject(Sound).volume()).toBe(1);
  });
});
