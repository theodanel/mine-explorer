import { Injectable, signal } from '@angular/core';

import { readStorage, writeStorage } from '../shared/local-storage';
import { completeCounters, CounterId, Counters, EMPTY_COUNTERS, isValidCounters } from './mission-rules';

const STORAGE_KEY = 'mine-explorer.counters';

/**
 * Compteurs d'actions du joueur (rochers cassés, objets forgés…). Service sans dépendance,
 * pour que la Forge, l'inventaire et le minage puissent l'alimenter sans dépendre des missions.
 */
@Injectable({ providedIn: 'root' })
export class MissionCounters {
  private readonly state = signal<Counters>(loadCounters());
  readonly counters = this.state.asReadonly();

  record(id: CounterId, amount = 1): void {
    this.state.update((counters) => ({ ...counters, [id]: counters[id] + amount }));
    writeStorage(STORAGE_KEY, JSON.stringify(this.state()));
  }
}

function loadCounters(): Counters {
  const raw = readStorage(STORAGE_KEY);
  if (raw === null) {
    return EMPTY_COUNTERS;
  }
  try {
    const value = completeCounters(JSON.parse(raw));
    if (isValidCounters(value)) {
      return value;
    }
  } catch {
    // JSON illisible : traité comme une sauvegarde invalide juste en dessous
  }
  console.warn('Compteurs de missions invalides ignorés');
  return EMPTY_COUNTERS;
}
