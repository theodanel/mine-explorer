import { computed, inject, Injectable, signal } from '@angular/core';

import { Progression } from '../progression/progression';
import { readStorage, writeStorage } from '../shared/local-storage';
import { Release, RELEASES } from './patch-notes-data';

const STORAGE_KEY = 'mine-explorer.patch-notes-seen';
/** Au-delà, les plus anciennes notes non lues sont tues : la fenêtre reste courte après une longue absence. */
const MAX_RELEASES_SHOWN = 3;
/** Une partie qui n'a pas dépassé le premier palier est neuve : rien n'a changé pour elle. */
const NEW_PLAYER_MAX_STAGES = 1;

/** Notes plus récentes que la dernière lue, les plus récentes d'abord. */
export function unseenReleases(releases: readonly Release[], seenId: string | null): readonly Release[] {
  const unseen = seenId === null ? releases.slice(0, 1) : releases.filter((release) => release.id > seenId);
  return unseen.slice(0, MAX_RELEASES_SHOWN);
}

/**
 * Nouveautés de la mise en production : montrées une seule fois, au premier lancement qui suit. Un nouveau joueur
 * ne les voit pas (il n'a rien connu d'autre) ; un joueur d'avant cette fenêtre voit la dernière note seulement.
 */
@Injectable({ providedIn: 'root' })
export class PatchNotes {
  private readonly pending = signal<readonly Release[]>(this.loadPending());

  readonly releases = this.pending.asReadonly();
  readonly hasNews = computed(() => this.pending().length > 0);

  dismiss(): void {
    this.markAllSeen();
    this.pending.set([]);
  }

  private loadPending(): readonly Release[] {
    const seenId = readStorage(STORAGE_KEY);
    if (seenId === null && inject(Progression).stagesReached() <= NEW_PLAYER_MAX_STAGES) {
      this.markAllSeen();
      return [];
    }
    return unseenReleases(RELEASES, seenId);
  }

  private markAllSeen(): void {
    const latest = RELEASES[0];
    if (latest !== undefined) {
      writeStorage(STORAGE_KEY, latest.id);
    }
  }
}
