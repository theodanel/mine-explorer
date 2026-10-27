import { Component, computed, inject, signal } from '@angular/core';

import { Journal } from '../journal/journal';
import { AssetLoader } from '../loading/asset-loader';
import { MissionCounters } from '../missions/mission-counters';
import { Progression } from '../progression/progression';
import { readStorage, writeStorage } from '../shared/local-storage';

/** Délai entre deux lettres qui s'allument, en ms. */
const LETTER_DELAY_MS = 35;
/** Conte vu (ou passé) : il ne revient plus. */
const SEEN_KEY = 'mine-explorer.intro-vue';

/**
 * Conte d'introduction (choix de Théo, 27/10/2026) : ses images se suivent comme dans un livre de contes, chacune avec
 * une phrase qui scintille par-dessus ; un toucher passe à la suivante. Il raconte Orvald et le carnet, puis le joueur
 * trouve le carnet, qui s'ouvre sur le chapitre 1. Seulement pour une partie toute neuve.
 */
export const TALE_PAGES: readonly { readonly image: string; readonly text: string }[] = [
  { image: 'assets/ui/intro/1.webp', text: 'On raconte qu’au plus profond de la mine, quelque chose bat.' },
  { image: 'assets/ui/intro/2.webp', text: 'Orvald est descendu le chercher. On ne l’a jamais revu.' },
  { image: 'assets/ui/intro/3.webp', text: 'Il n’a laissé qu’un carnet. Et une promesse : le Cœur attend le prochain.' },
  { image: 'assets/ui/intro/4.webp', text: 'À ton tour, petit mineur.' },
];

@Component({
  selector: 'app-intro-tale',
  templateUrl: './intro-tale.html',
  styleUrl: './intro-tale.scss',
})
export class IntroTale {
  private readonly loader = inject(AssetLoader);
  private readonly journal = inject(Journal);
  private readonly counters = inject(MissionCounters);
  private readonly progression = inject(Progression);

  /** Une partie toute neuve qui n'a pas vu le conte : rien de cassé ni de forgé, en zone 1. */
  private readonly wanted = signal(
    readStorage(SEEN_KEY) === null &&
      this.counters.counters().rocksBroken === 0 &&
      this.counters.counters().itemsForged === 0 &&
      this.progression.zone() === 1,
  );
  protected readonly index = signal(0);
  protected readonly pages = TALE_PAGES;
  /** Le conte attend la fin du chargement, pour ne pas commencer sous l'écran de chargement. */
  protected readonly visible = computed(() => this.wanted() && this.loader.state() !== 'loading');
  protected readonly page = computed(() => TALE_PAGES[this.index()]);
  /** Lettres de la phrase, chacune avec son délai : elles s'allument l'une après l'autre. */
  protected readonly letters = computed(() => Array.from(this.page().text, (char, position) => ({ char, delay: position * LETTER_DELAY_MS })));

  protected next(): void {
    if (this.index() < TALE_PAGES.length - 1) {
      this.index.update((index) => index + 1);
    } else {
      this.finish();
    }
  }

  /** Fin du conte (ou « Passer ») : le joueur a trouvé le carnet, qui s'ouvre sur son premier chapitre. */
  protected finish(): void {
    writeStorage(SEEN_KEY, '1');
    this.wanted.set(false);
    this.journal.openedByPlayer.set(true);
  }
}
