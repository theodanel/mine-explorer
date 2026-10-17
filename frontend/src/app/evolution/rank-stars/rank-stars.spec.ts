import { TestBed } from '@angular/core/testing';

import { RankStars } from './rank-stars';

describe('RankStars', () => {
  it('affiche les étoiles gagnées pleines, puis les autres vides', () => {
    const fixture = TestBed.createComponent(RankStars);
    fixture.componentRef.setInput('count', 2);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    const sources = [...element.querySelectorAll('img')].map((image) => image.getAttribute('src'));
    expect(sources).toEqual([
      'assets/ui/etoile-pleine.webp',
      'assets/ui/etoile-pleine.webp',
      'assets/ui/etoile-vide.webp',
      'assets/ui/etoile-vide.webp',
      'assets/ui/etoile-vide.webp',
    ]);
    expect(element.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe('2 étoiles sur 5');
  });
});
