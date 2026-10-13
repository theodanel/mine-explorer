import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { Navigation } from '../navigation/navigation';
import { Overlays } from './overlays';

describe('Overlays', () => {
  function setup(): { overlays: Overlays; navigation: Navigation } {
    TestBed.resetTestingModule();
    return { overlays: TestBed.inject(Overlays), navigation: TestBed.inject(Navigation) };
  }

  it('montre une seule fenêtre automatique, la plus prioritaire', () => {
    const { overlays } = setup();
    const compare = signal(true);
    const artifact = signal(true);
    overlays.register('itemCompare', compare);
    overlays.register('artifactFound', artifact);
    expect(overlays.shown()).toBe('artifactFound');
    artifact.set(false);
    expect(overlays.shown()).toBe('itemCompare');
  });

  it('attend le retour à la mine, sauf pour une fenêtre déclenchée depuis la page', () => {
    const { overlays, navigation } = setup();
    overlays.register('itemCompare', signal(true));
    navigation.open('skills');
    expect(overlays.shown()).toBeNull();
    overlays.register('companionHatched', signal(true));
    navigation.open('companions');
    expect(overlays.shown()).toBe('companionHatched');
    navigation.open('mine');
    expect(overlays.shown()).toBe('companionHatched');
  });

  it('laisse passer les fenêtres ouvertes par le joueur avant tout', () => {
    const { overlays } = setup();
    overlays.register('galleryChoice', signal(true));
    const close = overlays.openUserDialog();
    expect(overlays.shown()).toBeNull();
    close();
    close();
    expect(overlays.userDialogOpen()).toBe(false);
    expect(overlays.shown()).toBe('galleryChoice');
  });
});
