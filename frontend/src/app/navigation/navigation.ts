import { Injectable, signal } from '@angular/core';

/** Pages ouvertes depuis la barre du bas. La mine reste affichée et continue de tourner derrière les autres. */
export type PageId = 'mine' | 'skills' | 'artifacts' | 'companions' | 'challenge' | 'workshop';

@Injectable({ providedIn: 'root' })
export class Navigation {
  private readonly current = signal<PageId>('mine');

  readonly page = this.current.asReadonly();

  open(page: PageId): void {
    this.current.set(page);
  }
}
