import { Component, computed, inject } from '@angular/core';

import { Overlays } from '../../shared/overlays';
import { PatchNotes } from '../patch-notes';

/** Fenêtre « Quoi de neuf ? » : les corrections de la dernière mise en production, une seule fois. */
@Component({
  selector: 'app-patch-notes-dialog',
  templateUrl: './patch-notes-dialog.html',
  styleUrl: './patch-notes-dialog.scss',
})
export class PatchNotesDialog {
  protected readonly notes = inject(PatchNotes);
  private readonly overlays = inject(Overlays);
  private readonly visible = this.overlays.isShown('patchNotes');

  protected readonly releases = computed(() => (this.visible() ? this.notes.releases() : []));

  constructor() {
    this.overlays.register('patchNotes', this.notes.hasNews);
  }
}
