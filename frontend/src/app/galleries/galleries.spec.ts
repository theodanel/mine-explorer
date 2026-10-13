import { TestBed } from '@angular/core/testing';

import { RANDOM } from '../shared/random';
import { Galleries } from './galleries';

describe('Galleries', () => {
  function setup(stage = 1): Galleries {
    localStorage.clear();
    localStorage.setItem('mine-explorer.progress', JSON.stringify({ zone: 4, stage, damage: 0 }));
    TestBed.configureTestingModule({ providers: [{ provide: RANDOM, useValue: () => 0 }] });
    return TestBed.inject(Galleries);
  }

  it('démarre une zone ordinaire et propose deux galeries', () => {
    const galleries = setup();
    galleries.offerFor(4);
    expect(galleries.current()).toBe('neutral');
    expect(galleries.offer()).toHaveLength(2);
    expect(galleries.choosing()).toBe(true);
  });

  it('applique la galerie choisie à toute la zone', () => {
    const galleries = setup();
    galleries.offerFor(4);
    const [first] = galleries.offer() ?? [];
    galleries.choose(first);
    expect(galleries.current()).toBe(first);
    expect(galleries.offer()).toBeNull();
  });

  it('refuse une galerie qui n\'était pas proposée', () => {
    const galleries = setup();
    galleries.offerFor(4);
    const offered = galleries.offer() ?? [];
    const other = (['flooded', 'goldVein', 'unstable', 'crystal'] as const).find((id) => !offered.includes(id));
    galleries.choose(other ?? 'crystal');
    expect(galleries.current()).toBe('neutral');
  });

  it('reprend la galerie ordinaire dans une autre zone', () => {
    const galleries = setup();
    galleries.offerFor(3);
    expect(galleries.offer()).toBeNull();
    expect(galleries.current()).toBe('neutral');
  });
});
