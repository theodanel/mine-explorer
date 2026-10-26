import { computed, inject, Injectable, signal } from '@angular/core';

import { AWAKENING_UNLOCK_FORM, awakeningCost, awakeningSockets } from '../balance/awakening';
import { EVOLUTION_FORMS } from '../balance/balance';
import { Evolution } from '../evolution/evolution';
import { HeartForge } from '../heart-forge/heart-forge';
import { Rebirth } from '../rebirth/rebirth';
import { readStorage, writeStorage } from '../shared/local-storage';
import {
  addDuplicates,
  AwakeningBlocker,
  awakeningBlocker,
  awaken,
  AwakeningState,
  EMPTY_AWAKENING,
  parseAwakening,
  recordDuplicate,
} from './awakening-rules';
import { Item, SlotId } from './equipment.model';

const STORAGE_KEY = 'mine-explorer.eveil';
const UNLOCK_INDEX = EVOLUTION_FORMS.findIndex((form) => form.id === AWAKENING_UNLOCK_FORM);

/**
 * Éveil des pièces Divin (le « Divin corrompu ») : dès la Légende du Cœur du monde, chaque pièce Divin vendue met un
 * doublon de côté pour son emplacement, et doublons + ressources du Cœur font monter l'emplacement d'un palier.
 * L'Inventaire lit les paliers pour ses stats : ce service ne dépend donc pas de lui, la pièce portée lui est passée.
 */
@Injectable({ providedIn: 'root' })
export class Awakening {
  private readonly evolution = inject(Evolution);
  private readonly heartForge = inject(HeartForge);
  private readonly rebirth = inject(Rebirth);
  private readonly state = signal<AwakeningState>(loadState());

  readonly unlocked = computed(() => this.evolution.index() >= UNLOCK_INDEX);
  readonly levels = computed(() => this.state().levels);
  readonly duplicates = computed(() => this.state().duplicates);
  /** Renaissances faites : elles débloquent les paliers et font grandir leur bonus. */
  readonly rebirths = computed(() => this.rebirth.count());

  level(slot: SlotId): number {
    return this.state().levels[slot] ?? 0;
  }

  /** Châsses de rune de plus sur l'emplacement, ouvertes par les paliers 2 et 4. */
  extraSockets(slot: SlotId): number {
    return awakeningSockets(this.level(slot));
  }

  /** Une pièce vendue : si elle est Divin, elle devient un doublon de son emplacement. */
  onSold(item: Item): void {
    if (this.unlocked()) {
      this.save(recordDuplicate(this.state(), item));
    }
  }

  /** Outils de test : des doublons Divin sur chaque emplacement. */
  addDuplicates(amount: number): void {
    this.save(addDuplicates(this.state(), amount));
  }

  blocker(item: Item | undefined): AwakeningBlocker | null {
    const cost = item === undefined ? null : awakeningCost(item.slot, this.level(item.slot));
    return awakeningBlocker(this.state(), item, cost === null ? 0 : this.heartForge.essences()[cost.essence], this.rebirths());
  }

  /** Éveille la pièce portée d'un palier, si tout est payé. */
  awaken(item: Item | undefined): boolean {
    if (!this.unlocked() || item === undefined || this.blocker(item) !== null) {
      return false;
    }
    const cost = awakeningCost(item.slot, this.level(item.slot));
    if (cost === null || !this.heartForge.spendEssences({ [cost.essence]: cost.essences })) {
      return false;
    }
    this.save(awaken(this.state(), item.slot));
    return true;
  }

  private save(next: AwakeningState): void {
    this.state.set(next);
    writeStorage(STORAGE_KEY, JSON.stringify(next));
  }
}

function loadState(): AwakeningState {
  const raw = readStorage(STORAGE_KEY);
  if (raw === null) {
    return EMPTY_AWAKENING;
  }
  const state = parseAwakening(raw);
  if (state === null) {
    console.warn("Sauvegarde de l'Éveil invalide ignorée");
    return EMPTY_AWAKENING;
  }
  return state;
}
