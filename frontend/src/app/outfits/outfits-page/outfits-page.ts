import { Component, computed, inject } from '@angular/core';

import { OUTFIT_BONUS_MAX, OUTFITS, OUTFITS_PER_BONUS, OutfitPart } from '../../balance/outfits';
import { Navigation } from '../../navigation/navigation';
import { outfitSourceLabel } from '../outfit-rules';
import { Outfits } from '../outfits';

const PART_LABELS: Readonly<Record<OutfitPart, string>> = { scarf: 'Foulard', helmet: 'Casque', lamp: 'Lampe' };
const PERCENT = 100;

/**
 * Tenues du dragon : la collection, d'où vient chaque tenue, et laquelle porter. Les visuels arrivent plus tard
 * (prompts Gemini dans docs/game-design/tenues.md) : en attendant, chaque carte affiche « visuel à venir ».
 */
@Component({
  selector: 'app-outfits-page',
  templateUrl: './outfits-page.html',
  styleUrl: './outfits-page.scss',
})
export class OutfitsPage {
  protected readonly outfits = inject(Outfits);
  private readonly navigation = inject(Navigation);
  protected readonly total = OUTFITS.length;

  protected readonly summary = computed(() => {
    const owned = this.outfits.owned().length;
    const bonus = Math.round(this.outfits.collectionBonus() * PERCENT);
    const max = Math.round(OUTFIT_BONUS_MAX * PERCENT);
    return `+${bonus} % de Frappe (1 % toutes les ${OUTFITS_PER_BONUS} tenues, ${max} % au plus) · ${owned} / ${this.total}`;
  });

  protected readonly cards = computed(() => {
    const owned = new Set(this.outfits.owned().map((outfit) => outfit.id));
    const worn = this.outfits.worn();
    return OUTFITS.map((outfit) => ({
      ...outfit,
      partLabel: PART_LABELS[outfit.part],
      owned: owned.has(outfit.id),
      worn: worn === outfit.id,
      sourceLabel: outfitSourceLabel(outfit),
    }));
  });

  protected toggle(id: string, owned: boolean): void {
    if (owned) {
      this.outfits.wear(this.outfits.worn() === id ? null : id);
    }
  }

  protected close(): void {
    this.navigation.open('profile');
  }
}
