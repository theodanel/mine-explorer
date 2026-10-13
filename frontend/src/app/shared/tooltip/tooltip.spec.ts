import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { Tooltip, TooltipCard, TooltipContent } from './tooltip';

const CARD: TooltipCard = { title: 'Pioche', badge: { label: 'Fer · Niv. 4', tier: 'iron' }, lines: ['Frappe +12'] };

@Component({
  imports: [Tooltip],
  template: `
    <div class="game">
      <span id="simple" appTooltip="Or : sert à améliorer la pioche"></span>
      <span id="card" [appTooltip]="card"></span>
      <button id="dynamic" type="button" [appTooltip]="content()">Cible</button>
      <p class="elsewhere">Ailleurs</p>
    </div>
  `,
})
class Host {
  readonly card = CARD;
  readonly content = signal<TooltipContent | null>('Explication');
}

describe('Tooltip', () => {
  function setup(): { root: HTMLElement; host: Host } {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    return { root: fixture.nativeElement as HTMLElement, host: fixture.componentInstance };
  }

  const bubble = (root: HTMLElement): Element | null => root.querySelector('.tooltip');
  const hover = (root: HTMLElement, selector: string): void => {
    root.querySelector(selector)?.dispatchEvent(new MouseEvent('mouseenter'));
  };

  it('affiche le texte au survol puis le retire', () => {
    const { root } = setup();
    hover(root, '#simple');
    expect(bubble(root)?.textContent).toBe('Or : sert à améliorer la pioche');
    root.querySelector('#simple')?.dispatchEvent(new MouseEvent('mouseleave'));
    expect(bubble(root)).toBeNull();
  });

  it('affiche une carte avec titre, étiquette et lignes', () => {
    const { root } = setup();
    root.querySelector('#card')?.dispatchEvent(new FocusEvent('focusin'));
    expect(root.querySelector('.tooltip-title')?.textContent).toBe('Pioche');
    expect(root.querySelector('.tooltip-badge')?.textContent).toBe('Fer · Niv. 4');
    expect(root.querySelector('.tooltip-line')?.textContent).toBe('Frappe +12');
  });

  it('insère le contenu en texte, jamais en HTML', () => {
    const { root } = setup();
    hover(root, '#simple');
    expect(bubble(root)?.children.length).toBe(0);
  });

  describe('fermeture', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('disparaît au bout de 2 s sans interaction', () => {
      const { root } = setup();
      hover(root, '#dynamic');
      vi.advanceTimersByTime(1999);
      expect(bubble(root)).not.toBeNull();
      vi.advanceTimersByTime(1);
      expect(bubble(root)).toBeNull();
    });

    it('disparaît quand on touche ailleurs', () => {
      const { root } = setup();
      hover(root, '#dynamic');
      root.querySelector('.elsewhere')?.dispatchEvent(new Event('pointerdown', { bubbles: true }));
      expect(bubble(root)).toBeNull();
    });
  });

  it('ne montre rien sans contenu', () => {
    const { root, host } = setup();
    host.content.set(null);
    TestBed.tick();
    hover(root, '#dynamic');
    expect(bubble(root)).toBeNull();
  });
});
