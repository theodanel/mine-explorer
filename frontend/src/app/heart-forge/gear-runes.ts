import { computed, inject, Injectable } from '@angular/core';

import { awakeningSockets } from '../balance/awakening';
import { gearSocketCount } from '../balance/gear-runes';
import { activeAwakening } from '../equipment/awakening-rules';
import { Awakening } from '../equipment/awakening';
import { SLOT_IDS, SlotId } from '../equipment/equipment.model';
import { Inventory } from '../equipment/inventory';
import { Evolution } from '../evolution/evolution';
import { gearRuneBonuses, OpenSockets } from './gear-runes-rules';
import { HeartForge } from './heart-forge';
import type { Rune } from './heart-forge-rules';

/**
 * Runes d'équipement : dès la 1re étoile du Cœur du monde, chaque emplacement gagne une châsse par étoile (trois au
 * plus) où sertir une rune de la réserve de la Forge du Cœur, et deux de plus avec l'Éveil d'une pièce Divin.
 * Leurs bonus forment une famille de plus pour le mineur.
 */
@Injectable({ providedIn: 'root' })
export class GearRunes {
  private readonly forge = inject(HeartForge);
  private readonly evolution = inject(Evolution);
  private readonly inventory = inject(Inventory);
  private readonly awakening = inject(Awakening);

  /** Châsses ouvertes par les étoiles, les mêmes sur chaque emplacement. */
  readonly socketCount = computed(() => gearSocketCount(this.evolution.form().stars));
  readonly unlocked = computed(() => this.socketCount() > 0);
  /** Châsses ouvertes sur chaque emplacement : celles des étoiles, plus celles de l'Éveil si la pièce est Divin. */
  readonly openSockets = computed<OpenSockets>(() => {
    const base = this.socketCount();
    const equipped = this.inventory.equipped();
    const levels = this.awakening.levels();
    return Object.fromEntries(
      SLOT_IDS.map((slot) => [slot, base === 0 ? 0 : base + awakeningSockets(activeAwakening(equipped, levels, slot))]),
    ) as Record<SlotId, number>;
  });
  readonly gear = this.forge.gear;
  readonly bonuses = computed(() => gearRuneBonuses(this.forge.gear(), this.openSockets()));

  set(slot: SlotId, socket: number, rune: Rune): boolean {
    return this.forge.setGearRune(slot, socket, rune, this.openSockets()[slot]);
  }

  remove(slot: SlotId, socket: number): void {
    this.forge.removeGearRune(slot, socket);
  }
}
