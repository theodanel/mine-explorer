import { computed, Injectable, signal } from '@angular/core';

import { RebirthBranch } from '../balance/rebirth';
import { readStorage, writeStorage } from '../shared/local-storage';
import { buy, canBuy, EMPTY_REBIRTH, offer, parseRebirth, rebirthEffects, RebirthState } from './rebirth-rules';

export const REBIRTH_STORAGE_KEY = 'mine-explorer.renaissance';

/**
 * Renaissance : nombre de vies, Braises du Cœur et arbre permanent. Ce service ne dépend d'aucun autre, pour que la
 * mine, la Forge et le mineur puissent lire ses effets (dureté des filons, Frappe…) sans dépendance circulaire. La
 * renaissance elle-même, qui remet la partie de mine à zéro, est faite par la page Renaissance.
 */
@Injectable({ providedIn: 'root' })
export class Rebirth {
  private readonly state = signal<RebirthState>(loadState());

  readonly snapshot = this.state.asReadonly();
  readonly count = computed(() => this.state().count);
  readonly embers = computed(() => this.state().embers);
  readonly effects = computed(() => rebirthEffects(this.state()));

  canBuy(branch: RebirthBranch): boolean {
    return canBuy(this.state(), branch);
  }

  buy(branch: RebirthBranch): boolean {
    if (!this.canBuy(branch)) {
      return false;
    }
    this.save(buy(this.state(), branch));
    return true;
  }

  /** Une Offrande au Cœur, déjà payée en or par la page. */
  offer(): void {
    this.save(offer(this.state()));
  }

  /** La renaissance préparée sur la page (Braises gagnées puis dépensées) devient l'état du compte. */
  commit(next: RebirthState): void {
    this.save(next);
  }

  private save(next: RebirthState): void {
    this.state.set(next);
    writeStorage(REBIRTH_STORAGE_KEY, JSON.stringify(next));
  }
}

function loadState(): RebirthState {
  const raw = readStorage(REBIRTH_STORAGE_KEY);
  if (raw === null) {
    return EMPTY_REBIRTH;
  }
  const state = parseRebirth(raw);
  if (state === null) {
    console.warn('Sauvegarde de la Renaissance invalide ignorée');
    return EMPTY_REBIRTH;
  }
  return state;
}
