import { TestBed } from '@angular/core/testing';

import { HEART_STAR_ZONES, HeartCard } from './heart-card';

describe('HeartCard', () => {
  it('annonce une étoile par zone paire, de la 12 à la 20', () => {
    expect(HEART_STAR_ZONES).toEqual([12, 14, 16, 18, 20]);
  });

  it('allume les étoiles éveillées et fait palpiter la suivante', () => {
    const fixture = TestBed.createComponent(HeartCard);
    fixture.componentRef.setInput('stars', 2);
    fixture.detectChanges();
    const stars = [...(fixture.nativeElement as HTMLElement).querySelectorAll('.star')];
    expect(stars.map((star) => star.classList.contains('lit'))).toEqual([true, true, false, false, false]);
    expect(stars.findIndex((star) => star.classList.contains('next'))).toBe(2);
    expect(stars[4].textContent).toContain('Zone 20');
  });
});
