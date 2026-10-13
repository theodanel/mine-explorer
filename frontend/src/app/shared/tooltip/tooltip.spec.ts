import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { Tooltip, TooltipContent } from './tooltip';

@Component({
  imports: [Tooltip],
  template: `<div class="game"><button type="button" [appTooltip]="content()">Cible</button><p class="ailleurs">Ailleurs</p></div>`,
})
class Host {
  readonly content = signal<TooltipContent | null>('Explication');
}

describe('Tooltip', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function setup(): { root: HTMLElement; host: Host } {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    return { root: fixture.nativeElement as HTMLElement, host: fixture.componentInstance };
  }

  const bubble = (root: HTMLElement): Element | null => root.querySelector('.tooltip');

  it('disparaît au bout de 2 s sans interaction', () => {
    const { root } = setup();
    root.querySelector('button')?.dispatchEvent(new MouseEvent('mouseenter'));
    expect(bubble(root)?.textContent).toBe('Explication');
    vi.advanceTimersByTime(1999);
    expect(bubble(root)).not.toBeNull();
    vi.advanceTimersByTime(1);
    expect(bubble(root)).toBeNull();
  });

  it('disparaît quand on touche ailleurs', () => {
    const { root } = setup();
    root.querySelector('button')?.dispatchEvent(new MouseEvent('mouseenter'));
    root.querySelector('.ailleurs')?.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(bubble(root)).toBeNull();
  });

  it('ne montre rien sans contenu', () => {
    const { root, host } = setup();
    host.content.set(null);
    TestBed.tick();
    root.querySelector('button')?.dispatchEvent(new MouseEvent('mouseenter'));
    expect(bubble(root)).toBeNull();
  });
});
