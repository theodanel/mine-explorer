import { computed, inject, Injectable } from '@angular/core';

import { gearSocketCount } from '../balance/gear-runes';
import type { SlotId } from '../equipment/equipment.model';
import { Evolution } from '../evolution/evolution';
import { gearRuneBonuses } from './gear-runes-rules';
import { HeartForge } from './heart-forge';
import type { Rune } from './heart-forge-rules';

/**
 * Runes d'équipement : dès la 1re étoile du Cœur du monde, chaque emplacement gagne une châsse par étoile (trois au
 * plus) où sertir une rune de la réserve de la Forge du Cœur. Leurs bonus forment une famille de plus pour le mineur.
 */
@Injectable({ providedIn: 'root' })
export class GearRunes {
  private readonly forge = inject(HeartForge);
  private readonly evolution = inject(Evolution);

  /** Châsses ouvertes sur chaque emplacement. */
  readonly socketCount = computed(() => gearSocketCount(this.evolution.form().stars));
  readonly unlocked = computed(() => this.socketCount() > 0);
  readonly gear = this.forge.gear;
  readonly bonuses = computed(() => gearRuneBonuses(this.forge.gear(), this.socketCount()));

  set(slot: SlotId, socket: number, rune: Rune): boolean {
    return this.forge.setGearRune(slot, socket, rune, this.socketCount());
  }

  remove(slot: SlotId, socket: number): void {
    this.forge.removeGearRune(slot, socket);
  }
}
