import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';

import { Abyss } from '../abyss/abyss';
import { Achievement } from '../balance/achievements';
import { gearSet } from '../equipment/equipment-rules';
import { Inventory } from '../equipment/inventory';
import { Evolution } from '../evolution/evolution';
import { MissionCounters } from '../missions/mission-counters';
import { Outfits } from '../outfits/outfits';
import { Progression } from '../progression/progression';
import { readStorage, writeStorage } from '../shared/local-storage';
import { AchievementSnapshot, isValidUnlocked, knownAchievements, newlyMet, titleOf } from './achievement-rules';

const UNLOCKED_KEY = 'mine-explorer.succes';
const TITLE_KEY = 'mine-explorer.titre';

/**
 * Succès : lus dans l'état du jeu, gagnés une fois pour toutes (`mine-explorer.succes`, qui part avec la sauvegarde
 * cloud : le serveur y vérifie le titre choisi). Chaque succès donne un titre ; le joueur en porte un, affiché à côté
 * de son pseudo dans le classement et la discussion.
 */
@Injectable({ providedIn: 'root' })
export class Achievements {
  private readonly progression = inject(Progression);
  private readonly counters = inject(MissionCounters).counters;
  private readonly abyss = inject(Abyss);
  private readonly inventory = inject(Inventory);
  private readonly outfits = inject(Outfits);
  private readonly evolution = inject(Evolution);
  private readonly unlockedState = signal<readonly string[]>(loadUnlocked());
  private readonly titleState = signal<string | null>(loadTitle());

  readonly unlocked = this.unlockedState.asReadonly();
  /** Identifiant du titre porté, ou null. */
  readonly title = this.titleState.asReadonly();
  readonly titleLabel = computed(() => titleOf(this.titleState()));
  /** Derniers succès gagnés, pour les annoncer. */
  readonly latest = signal<readonly Achievement[]>([]);

  private readonly snapshot = computed<AchievementSnapshot>(() => {
    const { zone } = this.progression.progress();
    const counters = this.counters();
    const set = gearSet(this.inventory.equipped());
    return {
      zoneReached: zone,
      zonesCleared: zone - 1,
      itemsForged: counters.itemsForged,
      jackpots: counters.jackpots,
      abyssRecord: this.abyss.record(),
      setPieces: set?.pieces ?? 0,
      divineSet: set !== null && set.tier === 'divine' && set.pieces === 5 ? 1 : 0,
      outfits: this.outfits.owned().length,
      evolutionForm: this.evolution.index(),
      heartStars: this.evolution.form().stars,
    };
  });

  constructor() {
    effect(() => {
      const snapshot = this.snapshot();
      untracked(() => {
        const earned = newlyMet(this.unlockedState(), snapshot);
        if (earned.length > 0) {
          this.saveUnlocked([...this.unlockedState(), ...earned.map((achievement) => achievement.id)]);
          this.latest.set(earned);
        }
      });
    });
  }

  /** Porte un titre gagné, ou aucun (null). */
  wear(id: string | null): void {
    if (id !== null && !this.unlockedState().includes(id)) {
      return;
    }
    this.titleState.set(id);
    writeStorage(TITLE_KEY, JSON.stringify({ title: id }));
  }

  private saveUnlocked(next: readonly string[]): void {
    this.unlockedState.set(next);
    writeStorage(UNLOCKED_KEY, JSON.stringify(next));
  }
}

function loadUnlocked(): readonly string[] {
  const raw = readStorage(UNLOCKED_KEY);
  if (raw === null) {
    return [];
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (isValidUnlocked(value)) {
      return knownAchievements(value);
    }
  } catch {
    // JSON illisible : traité comme une sauvegarde invalide juste en dessous
  }
  console.warn('Sauvegarde des succès invalide ignorée');
  return [];
}

function loadTitle(): string | null {
  const raw = readStorage(TITLE_KEY);
  if (raw === null) {
    return null;
  }
  try {
    const value: unknown = JSON.parse(raw);
    const title = typeof value === 'object' && value !== null ? (value as Record<string, unknown>)['title'] : undefined;
    if (title === null || (typeof title === 'string' && titleOf(title) !== null)) {
      return title;
    }
  } catch {
    // JSON illisible : traité comme une sauvegarde invalide juste en dessous
  }
  console.warn('Titre porté invalide ignoré');
  return null;
}
