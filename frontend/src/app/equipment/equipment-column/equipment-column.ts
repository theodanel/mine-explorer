import { Component, computed, inject, input } from '@angular/core';

import { SlotId, SLOTS } from '../equipment.model';
import { Inventory } from '../inventory';

/** null = case verrouillée, réservée à un futur emplacement. */
export type ColumnSlot = SlotId | null;

@Component({
  selector: 'app-equipment-column',
  templateUrl: './equipment-column.html',
  styleUrl: './equipment-column.scss',
})
export class EquipmentColumn {
  private readonly inventory = inject(Inventory);

  readonly slots = input.required<readonly ColumnSlot[]>();

  protected readonly cells = computed(() => {
    const equipped = this.inventory.equipped();
    return this.slots().map((slot, index) => {
      if (slot === null) {
        return { key: `locked-${index}`, locked: true as const };
      }
      const { label, iconUrl } = SLOTS[slot];
      const item = equipped[slot];
      return {
        key: slot,
        locked: false as const,
        label,
        iconUrl,
        tier: item?.tier ?? 'empty',
        level: item?.level ?? null,
      };
    });
  });
}
