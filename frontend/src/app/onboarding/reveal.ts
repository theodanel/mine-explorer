import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';

import { Artifacts } from '../artifacts/artifacts';
import { Camp } from '../camp/camp';
import { Companions } from '../companions/companions';
import { Inventory } from '../equipment/inventory';
import { Forge } from '../forge/forge';
import { MissionCounters } from '../missions/mission-counters';
import { Progression } from '../progression/progression';
import { readStorage, writeStorage } from '../shared/local-storage';
import { Skills } from '../skills/skills';
import { Workshop } from '../workshop/workshop';
import {
  hintDone,
  isNewGame,
  newlyRevealed,
  parseRevealed,
  REVEAL_IDS,
  RevealFacts,
  RevealId,
  revealHint,
} from './reveal-rules';

const STORAGE_KEY = 'mine-explorer.devoilement';
/** Avant cette prise en main, ce drapeau marquait un joueur ayant vu l'ancien tutoriel : on ne lui présente rien. */
const LEGACY_TUTORIAL_KEY = 'mine-explorer.tutorial';

/**
 * Prise en main : les éléments du panneau du bas sont grisés et bloqués jusqu'à ce qu'une bulle les présente,
 * quand ils servent ; les onglets du menu du bas, grisés tant que leur menu est fermé, surgissent à son ouverture. Ce qui est présenté le reste, même si la condition retombe (l'or dépensé).
 */
@Injectable({ providedIn: 'root' })
export class Reveal {
  private readonly counters = inject(MissionCounters);
  private readonly inventory = inject(Inventory);
  private readonly forge = inject(Forge);
  private readonly progression = inject(Progression);
  private readonly skills = inject(Skills);
  private readonly companions = inject(Companions);
  private readonly artifacts = inject(Artifacts);
  private readonly workshop = inject(Workshop);
  private readonly camp = inject(Camp);
  private readonly revealed = signal<ReadonlySet<RevealId>>(this.load());
  /** Présentés pendant cette session : ils surgissent avec une animation. */
  private readonly fresh = signal<ReadonlySet<RevealId>>(new Set());
  private readonly hints = signal<readonly RevealId[]>([]);

  private readonly facts = computed<RevealFacts>(() => {
    const counters = this.counters.counters();
    return {
      itemsForged: counters.itemsForged,
      segmentsPaid: counters.segmentsPaid,
      pickaxeLevel: this.forge.level(),
      canForge: this.inventory.canForge(),
      canPaySegment: this.forge.canPaySegment(),
      skillsOpen: this.skills.unlocked(),
      companionsOpen: this.companions.unlocked(),
      artifactsOpen: this.artifacts.unlocked(),
      workshopOpen: this.workshop.unlocked(),
      adventuresOpen: this.camp.unlocked(),
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

  /** Élément du panneau du bas pas encore présenté : visible, mais grisé et bloqué (choix de Théo). */
  isLocked(id: RevealId): boolean {
    return !this.revealed().has(id);
  }

  /** Vient d'apparaître ou de se débloquer pendant cette session : il surgit avec une animation. */
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
      console.warn('Sauvegarde de la prise en main invalide : plus aucune bulle ne sera montrée');
      return new Set(REVEAL_IDS);
    }
    const { zone, stage } = this.progression.progress();
    const freshStart = isNewGame(zone, stage) && readStorage(LEGACY_TUTORIAL_KEY) === null;
    return freshStart ? new Set() : new Set(REVEAL_IDS);
  }
}
