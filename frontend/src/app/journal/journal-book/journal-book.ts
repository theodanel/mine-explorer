import { Component, computed, effect, inject, signal } from '@angular/core';

import { Sound } from '../../audio/sound';
import { Overlays } from '../../shared/overlays';
import { environment } from '../../../environments/environment';
import { ALL_PAGES, JournalChapter } from '../journal-chapters';
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
  /** Page que le joueur relit, ou null pour le chapitre en cours. */
  protected readonly reading = signal<number | null>(null);
  /** Sur le site de test, on feuillette toutes les pages, même pas encore atteintes, pour juger la fin de jeu. */
  protected readonly browseAll = environment.testBanner;
  /** Dernière page qu'on peut ouvrir avec les flèches : les chapitres scellés, ou tout sur le site de test. */
  private readonly lastBrowsable = computed(() => (this.browseAll ? ALL_PAGES.length - 1 : this.journal.readChapters().length - 1));
  protected readonly turning = signal(false);

  protected readonly page = computed(() => {
    const reading = this.reading();
    if (reading !== null) {
      const sealed = reading < this.journal.readChapters().length;
      return this.view(ALL_PAGES[reading], reading, sealed, !sealed);
    }
    const chapter = this.journal.chapter();
    return chapter === null ? null : this.view(chapter, this.journal.index(), false);
  });

  protected readonly canGoBack = computed(() => (this.reading() ?? this.journal.index()) > 0);
  protected readonly canGoForward = computed(() => {
    const reading = this.reading();
    return reading !== null || (this.browseAll && this.journal.index() < ALL_PAGES.length - 1);
  });

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
    const current = this.reading() ?? this.journal.index();
    if (current > 0) {
      this.reading.set(current - 1);
    }
  }

  protected next(): void {
    const reading = this.reading();
    const from = reading ?? this.journal.index();
    if (reading === null && !this.browseAll) {
      return;
    }
    const target = from + 1;
    // Revenir sur le chapitre en cours le remet dans son état vivant (objectifs, sceau)
    this.reading.set(target > this.lastBrowsable() ? null : target === this.journal.index() ? null : target);
  }

  protected close(): void {
    this.reading.set(null);
    this.journal.openedByPlayer.set(false);
    this.journal.markAutoShown();
  }

  private view(chapter: JournalChapter, index: number, sealed: boolean, preview = false) {
    const facts = this.journal.facts();
    const objectives = sealed
      ? chapter.objectives.map((objective) => ({ label: objective.label, current: 1, target: 1, done: true }))
      : preview
        ? chapter.objectives.map((objective) => {
            const [current, target] = objective.progress(facts);
            return { label: objective.label, current, target, done: current >= target };
          })
        : this.journal.objectives();
    return {
      number: index + 1,
      title: chapter.title,
      lore: chapter.lore,
      objectives,
      unlocks: chapter.unlocks,
      shards: chapter.shards,
      sealed,
      preview,
      ready: !sealed && !preview && this.journal.ready(),
    };
  }
}
