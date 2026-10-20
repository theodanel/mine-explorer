import { computed, inject, Injectable, signal } from '@angular/core';

import { outfitCollectionBonus } from '../balance/outfits';
import { NO_BONUSES } from '../balance/skill-tree';
import { Progression } from '../progression/progression';
import { readStorage, writeStorage } from '../shared/local-storage';
import { isValidOutfitChoice, ownedOutfits } from './outfit-rules';

const STORAGE_KEY = 'mine-explorer.tenues';

/**
 * Tenues du dragon : une par zone terminée. Aucune stat par tenue ; la collection donne +1 % de Frappe par tranche de
 * 5, +4 % au plus. La tenue portée est retenue pour le jour où ses visuels arrivent.
 */
@Injectable({ providedIn: 'root' })
export class Outfits {
  private readonly progression = inject(Progression);
  private readonly wornState = signal<string | null>(loadWorn());

  /** Zones terminées : celles avant la frontière de la mine. */
  readonly owned = computed(() => ownedOutfits(this.progression.progress().zone - 1));
  readonly worn = this.wornState.asReadonly();
  readonly collectionBonus = computed(() => outfitCollectionBonus(this.owned().length));
  /** La collection, comme une famille de bonus du mineur. */
  readonly bonuses = computed(() => ({ ...NO_BONUSES, strikePct: this.collectionBonus() }));

  wear(id: string | null): void {
    if (id !== null && !this.owned().some((outfit) => outfit.id === id)) {
      return;
    }
    this.wornState.set(id);
    writeStorage(STORAGE_KEY, JSON.stringify({ worn: id }));
  }
}

function loadWorn(): string | null {
  const raw = readStorage(STORAGE_KEY);
  if (raw === null) {
    return null;
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (isValidOutfitChoice(value)) {
      return value.worn;
    }
  } catch {
    // JSON illisible : traité comme une sauvegarde invalide juste en dessous
  }
  console.warn('Sauvegarde des tenues invalide ignorée');
  return null;
}
