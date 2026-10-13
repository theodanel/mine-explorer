import { TestBed } from '@angular/core/testing';

import { Abyss } from '../../abyss/abyss';
import { AbyssPage } from '../../abyss/abyss-page/abyss-page';
import { AdventuresPage } from '../../adventures/adventures-page/adventures-page';
import { AUDIO_CONTEXT_FACTORY } from '../../audio/sound';
import { Navigation } from '../../navigation/navigation';
import { Camp } from '../camp';
import { buildingCost } from '../camp-rules';
import { CampPage } from './camp-page';

describe('Pages Aventures et Campement', () => {
  function startAt(zone: number, coins: number): void {
    localStorage.clear();
    localStorage.setItem('mine-explorer.progress', JSON.stringify({ zone, stage: 1, damage: 0 }));
    localStorage.setItem('mine-explorer.coins', String(coins));
    const stock = { wood: 0, stone: 0, copper: 0, iron: 40, steel: 0, gold: 0, mithril: 0, crystal: 0, magma: 0, divine: 0 };
    localStorage.setItem('mine-explorer.ores', JSON.stringify(stock));
    TestBed.configureTestingModule({ providers: [{ provide: AUDIO_CONTEXT_FACTORY, useValue: () => null }] });
  }

  it('montre le Campement verrouillé avant la zone 5', () => {
    startAt(3, 0);
    const fixture = TestBed.createComponent(AdventuresPage);
    fixture.detectChanges();
    const card = fixture.nativeElement.querySelector('.card') as HTMLButtonElement;
    expect(card.disabled).toBe(true);
    expect(card.textContent).toContain('Zone 5');
  });

  it('ouvre le Campement depuis les Aventures', () => {
    startAt(5, 0);
    const fixture = TestBed.createComponent(AdventuresPage);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.card') as HTMLButtonElement).click();
    expect(TestBed.inject(Navigation).page()).toBe('camp');
  });

  it('construit la Taverne depuis sa ligne', () => {
    startAt(5, buildingCost(0, 5).gold);
    const fixture = TestBed.createComponent(CampPage);
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('.slot-row') as NodeListOf<HTMLElement>;
    expect(rows).toHaveLength(3);
    expect(rows[0].textContent).toContain('Taverne');
    (rows[0].querySelector('button.upgrade') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(TestBed.inject(Camp).level('tavern')).toBe(1);
    expect(rows[0].textContent).toContain('niv. 1 / 10');
  });

  it('montre le Puits sans fond verrouillé avant le Contremaître', () => {
    startAt(5, 0);
    const fixture = TestBed.createComponent(AdventuresPage);
    fixture.detectChanges();
    const cards = fixture.nativeElement.querySelectorAll('.card') as NodeListOf<HTMLButtonElement>;
    expect(cards[1].textContent).toContain('Puits sans fond');
    expect(cards[1].disabled).toBe(true);
  });

  it('lance une descente depuis la page du Puits', () => {
    startAt(8, 0);
    localStorage.setItem('mine-explorer.evolution', '2');
    const fixture = TestBed.createComponent(AbyssPage);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('button.go') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Étage 1');
    expect(TestBed.inject(Abyss).runsLeft()).toBe(2);
    TestBed.resetTestingModule();
  });
});
