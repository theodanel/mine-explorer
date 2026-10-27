import { Component, computed, effect, inject, signal } from '@angular/core';

import { Sound } from '../../audio/sound';
import { Overlays } from '../../shared/overlays';
import { FIRST_LOOP, JournalChapter } from '../journal-chapters';
import { Journal } from '../journal';

/** Temps de l'animation de la page qui se tourne, en ms. */
const PAGE_TURN_MS = 700;

/**
 * Le carnet ouvert en grand : en haut, la page du journal d'Orvald ; en bas, les objectifs du joueur et le sceau.
 * Il s'ouvre depuis son icône, ou de lui-même quand un chapitre est rempli. On peut feuilleter les chapitres scellés.
 */
@Component({
  selector: 'app-journal-book',
  templateUrl: './journal-book.html',
  styleUrl: './journal-book.scss',
})
export class JournalBook {
  protected readonly journal = inject(Journal);
  private readonly overlays = inject(Overlays);
  private readonly sound = inject(Sound);
  private readonly autoShown = this.overlays.isShown('journal');

  protected readonly visible = computed(() => this.journal.openedByPlayer() || this.autoShown());
  /** Chapitre scellé que le joueur relit, ou null pour le chapitre en cours. */
  protected readonly reading = signal<number | null>(null);
  protected readonly turning = signal(false);

  protected readonly page = computed(() => {
    const reading = this.reading();
    if (reading !== null) {
      return this.view(FIRST_LOOP[reading], reading, true);
    }
    const chapter = this.journal.chapter();
    return chapter === null ? null : this.view(chapter, this.journal.index(), false);
  });

  protected readonly canGoBack = computed(() => (this.reading() ?? this.journal.readChapters().length) > 0);
  protected readonly canGoForward = computed(() => this.reading() !== null);

  constructor() {
    this.overlays.register('journal', this.journal.wantsToOpen);
    // Le joueur ouvre le carnet lui-même : les fenêtres automatiques attendent qu'il le referme
    effect((onCleanup) => {
      if (this.journal.openedByPlayer()) {
        onCleanup(this.overlays.openUserDialog());
      }
    });
    effect(() => {
      if (this.autoShown()) {
        this.sound.play('upgrade');
      }
    });
  }

  protected seal(): void {
    if (!this.journal.seal()) {
      return;
    }
    this.sound.play('forgeLegendary');
    // Ouvert de lui-même, le carnet reste ouvert pour montrer le chapitre suivant
    this.journal.openedByPlayer.set(true);
    // La page se tourne vers le chapitre suivant
    this.turning.set(true);
    setTimeout(() => this.turning.set(false), PAGE_TURN_MS);
  }

  protected previous(): void {
    const current = this.reading() ?? this.journal.readChapters().length;
    if (current > 0) {
      this.reading.set(current - 1);
    }
  }

  protected next(): void {
    const reading = this.reading();
    if (reading === null) {
      return;
    }
    this.reading.set(reading + 1 < this.journal.readChapters().length ? reading + 1 : null);
  }

  protected close(): void {
    this.reading.set(null);
    this.journal.openedByPlayer.set(false);
    this.journal.markAutoShown();
  }

  private view(chapter: JournalChapter, index: number, sealed: boolean) {
    const objectives = sealed
      ? chapter.objectives.map((objective) => ({ label: objective.label, current: 1, target: 1, done: true }))
      : this.journal.objectives();
    return {
      number: index + 1,
      title: chapter.title,
      lore: chapter.lore,
      objectives,
      unlocks: chapter.unlocks,
      shards: chapter.shards,
      sealed,
      ready: !sealed && this.journal.ready(),
    };
  }
}
