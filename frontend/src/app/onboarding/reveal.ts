import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';

import { Inventory } from '../equipment/inventory';
import { Forge } from '../forge/forge';
import { MissionCounters } from '../missions/mission-counters';
import { Progression } from '../progression/progression';
import { readStorage, writeStorage } from '../shared/local-storage';
import { hintDone, isNewGame, newlyRevealed, parseRevealed, REVEAL_IDS, RevealFacts, RevealId, revealHint } from './reveal-rules';

const STORAGE_KEY = 'mine-explorer.devoilement';
/** Avant le dévoilement, ce drapeau marquait un joueur ayant vu l'ancien tutoriel : il garde toute l'interface. */
const LEGACY_TUTORIAL_KEY = 'mine-explorer.tutorial';

/**
 * Dévoilement progressif : l'interface d'une partie neuve se limite au mineur et à son filon, puis chaque élément
 * apparaît quand le jeu en a besoin. Les éléments dévoilés le restent, même si la condition retombe (l'or dépensé).
 */
@Injectable({ providedIn: 'root' })
export class Reveal {
  private readonly counters = inject(MissionCounters);
  private readonly inventory = inject(Inventory);
  private readonly forge = inject(Forge);
  private readonly progression = inject(Progression);
  private readonly revealed = signal<ReadonlySet<RevealId>>(this.load());
  /** Dévoilés pendant cette session : ils entrent à l'écran avec une animation. */
  private readonly fresh = signal<ReadonlySet<RevealId>>(new Set());
  private readonly hints = signal<readonly RevealId[]>([]);

  private readonly facts = computed<RevealFacts>(() => {
    const counters = this.counters.counters();
    return {
      rocksBroken: counters.rocksBroken,
      itemsForged: counters.itemsForged,
      segmentsPaid: counters.segmentsPaid,
      pickaxeLevel: this.forge.level(),
      canForge: this.inventory.canForge(),
      canPaySegment: this.forge.canPaySegment(),
      zone: this.progression.zone(),
    };
  });

  /** Prochaine bulle à montrer, une à la fois ; celles dont le joueur a déjà fait l'action sont sautées. */
  readonly hint = computed(() => {
    const facts = this.facts();
    const id = this.hints().find((queued) => !hintDone(queued, facts));
    return id === undefined ? null : { id, text: revealHint(id) };
  });

  constructor() {
    effect(() => {
      const found = newlyRevealed(this.facts(), this.revealed());
      if (found.length > 0) {
        untracked(() => this.add(found));
      }
    });
  }

  isRevealed(id: RevealId): boolean {
    return this.revealed().has(id);
  }

  isFresh(id: RevealId): boolean {
    return this.fresh().has(id);
  }

  /** Ferme la bulle affichée, et oublie au passage celles devenues inutiles avant elle. */
  dismissHint(): void {
    const shown = this.hint();
    this.hints.update((queue) => (shown === null ? [] : queue.slice(queue.indexOf(shown.id) + 1)));
  }

  private add(ids: readonly RevealId[]): void {
    const next = new Set([...this.revealed(), ...ids]);
    this.revealed.set(next);
    this.fresh.update((fresh) => new Set([...fresh, ...ids]));
    this.hints.update((queue) => [...queue, ...ids]);
    writeStorage(STORAGE_KEY, JSON.stringify([...next]));
  }

  private load(): ReadonlySet<RevealId> {
    const raw = readStorage(STORAGE_KEY);
    if (raw !== null) {
      try {
        const ids = parseRevealed(JSON.parse(raw));
        if (ids !== null) {
          return new Set(ids);
        }
      } catch {
        // JSON illisible : traité comme une sauvegarde invalide juste en dessous
      }
      console.warn('Sauvegarde du dévoilement invalide : toute l’interface est affichée');
      return new Set(REVEAL_IDS);
    }
    const { zone, stage } = this.progression.progress();
    const freshStart = isNewGame(zone, stage) && readStorage(LEGACY_TUTORIAL_KEY) === null;
    return freshStart ? new Set() : new Set(REVEAL_IDS);
  }
}
