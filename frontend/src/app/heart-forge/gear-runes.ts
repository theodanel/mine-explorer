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
import type { RuneType } from '../balance/heart-forge';

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

  /** Crée dans la châsse vide la rune d'un élément, avec 3 de ses ressources. */
  create(slot: SlotId, socket: number, type: RuneType): boolean {
    return this.forge.createGearRune(slot, socket, type, this.openSockets()[slot]);
  }

  canCreate(slot: SlotId, socket: number, type: RuneType): boolean {
    return this.forge.canCreateGearRune(slot, socket, type, this.openSockets()[slot]);
  }

  /** Nourrit la rune de la châsse : elle passe au rang suivant. */
  grow(slot: SlotId, socket: number): boolean {
    return this.forge.growGearRune(slot, socket);
  }

  canGrow(slot: SlotId, socket: number): boolean {
    return this.forge.canGrowGearRune(slot, socket);
  }

  /** Retire la rune : ce qu'elle a coûté revient en ressources. */
  remove(slot: SlotId, socket: number): void {
    this.forge.removeGearRune(slot, socket);
  }
}
