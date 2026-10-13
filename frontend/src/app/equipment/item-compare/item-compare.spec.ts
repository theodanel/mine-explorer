import { TestBed } from '@angular/core/testing';

import { CLOCK } from '../../shared/clock';
import { ID_FACTORY, RANDOM } from '../../shared/random';
import { FORGE_ANIMATION_MS, Inventory } from '../inventory';
import { ItemCompare } from './item-compare';

const SHARDS_KEY = 'mine-explorer.geode-shards';

describe('ItemCompare', () => {
  let now: number;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(SHARDS_KEY, '10');
    now = 1_000;
    TestBed.configureTestingModule({
      providers: [
        // Sans animation de forge : l'objet est montré tout de suite
        { provide: FORGE_ANIMATION_MS, useValue: 0 },
        // 0.2 → pioche en Bois à chaque tirage
        { provide: RANDOM, useValue: () => 0.2 },
        { provide: ID_FACTORY, useValue: () => 'item-1' },
        { provide: CLOCK, useValue: () => now },
      ],
    });
  });

  async function openReview(): Promise<{ root: HTMLElement; inventory: Inventory; settle: () => Promise<void> }> {
    const fixture = TestBed.createComponent(ItemCompare);
    const inventory = TestBed.inject(Inventory);
    inventory.forge();
    await fixture.whenStable();
    return { root: fixture.nativeElement as HTMLElement, inventory, settle: () => fixture.whenStable() };
  }

  /** Un vrai toucher : appui puis clic sur le fond. */
  function tapBackdrop(root: HTMLElement): void {
    const backdrop = root.querySelector('.backdrop') as HTMLElement;
    backdrop.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    backdrop.click();
  }

  it('ignore un second appui sur le fond juste après l\'ouverture', async () => {
    const { root, inventory } = await openReview();
    now += 100;
    tapBackdrop(root);
    expect(inventory.reviewing()).toBe(true);
  });

  it('ignore un clic fantôme, sans appui sur le fond avant lui', async () => {
    const { root, inventory } = await openReview();
    now += 600;
    (root.querySelector('.backdrop') as HTMLElement).click();
    expect(inventory.reviewing()).toBe(true);
  });

  it('se ferme en touchant le fond, sans vendre ni équiper', async () => {
    const { root, inventory, settle } = await openReview();
    now += 600;
    tapBackdrop(root);
    await settle();
    expect(inventory.reviewing()).toBe(false);
    expect(inventory.pending()?.id).toBe('item-1');
    expect(root.querySelector('.backdrop')).toBeNull();
  });

  it('reste ouverte quand on touche la fenêtre elle-même', async () => {
    const { root, inventory } = await openReview();
    now += 600;
    (root.querySelector('.dialog') as HTMLElement).click();
    expect(inventory.reviewing()).toBe(true);
  });
});
