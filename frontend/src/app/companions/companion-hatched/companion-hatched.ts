import { Component, computed, inject } from '@angular/core';

import { Overlays } from '../../shared/overlays';
import { COMPANIONS } from '../../balance/companions';
import { RARITY_LABELS } from '../../balance/skill-tree';
import { companionIconUrl } from '../../loading/game-assets';
import { Companions } from '../companions';

const HEADLINES = {
  new: 'Nouveau compagnon !',
  star: 'Une étoile de plus !',
  maxed: 'Déjà 5 étoiles',
} as const;

/** Fenêtre d'éclosion : le compagnon sorti de l'œuf, ou l'étoile gagnée par un doublon. */
@Component({
  selector: 'app-companion-hatched',
  templateUrl: './companion-hatched.html',
  styleUrl: './companion-hatched.scss',
})
export class CompanionHatched {
  protected readonly companions = inject(Companions);
  private readonly overlays = inject(Overlays);
  private readonly visible = this.overlays.isShown('companionHatched');

  constructor() {
    this.overlays.register('companionHatched', computed(() => this.companions.hatching() !== null));
  }

  protected readonly view = computed(() => {
    const hatching = this.companions.hatching();
    if (hatching === null || !this.visible()) {
      return null;
    }
    const def = COMPANIONS[hatching.id];
    return {
      ...hatching,
      headline: HEADLINES[hatching.kind],
      label: def.label,
      icon: companionIconUrl(hatching.id),
      rarity: def.rarity,
      rarityLabel: RARITY_LABELS[def.rarity],
      description: def.description,
    };
  });
}
