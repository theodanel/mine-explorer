import { Component, inject } from '@angular/core';

import { Journal } from '../journal';

/** Icône du carnet, sous la roue de la loterie : elle s'anime quand un chapitre attend son sceau. */
@Component({
  selector: 'app-journal-button',
  template: `
    <button
      type="button"
      class="journal-link"
      [class.ready]="journal.ready()"
      [attr.aria-label]="journal.ready() ? 'Carnet d’aventure : chapitre terminé' : 'Carnet d’aventure'"
      (click)="journal.openedByPlayer.set(true)"
    >
      <img src="assets/ui/carnet/icone.webp" alt="" width="256" height="256" />
      @if (journal.ready()) {
        <span class="badge" aria-hidden="true">!</span>
      }
    </button>
  `,
  styleUrl: './journal-button.scss',
})
export class JournalButton {
  protected readonly journal = inject(Journal);
}
