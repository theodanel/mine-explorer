import { computed, Injectable, signal } from '@angular/core';

import { readStorage, writeStorage } from '../shared/local-storage';
import {
  applyDamage,
  DamageResult,
  isValidProgress,
  Progress,
  remainingHp,
  START_PROGRESS,
  zoneHealth,
} from './progression-rules';

const STORAGE_KEY = 'mine-explorer.progress';

/** Avancée du joueur dans la mine : zone en cours et vie restante. */
@Injectable({ providedIn: 'root' })
export class Progression {
  private readonly state = signal<Progress>(loadProgress());

  readonly progress = this.state.asReadonly();
  readonly zone = computed(() => this.state().zone);
  readonly health = computed(() => zoneHealth(this.state()));
  readonly remainingHp = computed(() => remainingHp(this.state()));

  hit(damage: number): DamageResult {
    const result = applyDamage(this.state(), damage);
    this.state.set(result.progress);
    writeStorage(STORAGE_KEY, JSON.stringify(result.progress));
    return result;
  }
}

function loadProgress(): Progress {
  const raw = readStorage(STORAGE_KEY);
  if (raw === null) {
    return START_PROGRESS;
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (isValidProgress(value)) {
      return value;
    }
  } catch {
    // JSON illisible : traité comme une sauvegarde invalide juste en dessous
  }
  console.warn('Sauvegarde de progression invalide ignorée');
  return START_PROGRESS;
}
