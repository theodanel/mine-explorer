import { Component, computed, effect, inject } from '@angular/core';

import { Overlays } from '../../shared/overlays';
import { Sound } from '../../audio/sound';
import { ARTIFACTS } from '../../balance/artifacts';
import { RARITY_LABELS } from '../../balance/skill-tree';
import { artifactIconUrl } from '../../loading/game-assets';
import { describeBonuses } from '../../miner/bonus-format';
import { artifactEffects } from '../artifact-rules';
import { Artifacts } from '../artifacts';

const HEADLINES = {
  new: 'Artefact découvert !',
  levelUp: 'Artefact renforcé !',
  maxed: 'Artefact déjà parfait',
} as const;

/** Fenêtre de découverte : le moment « butin rare », avec l'histoire de l'objet. */
@Component({
  selector: 'app-artifact-found',
  templateUrl: './artifact-found.html',
  styleUrl: './artifact-found.scss',
})
export class ArtifactFound {
  protected readonly artifacts = inject(Artifacts);
  private readonly sound = inject(Sound);
  private readonly overlays = inject(Overlays);
  private readonly visible = this.overlays.isShown('artifactFound');

  constructor() {
    this.overlays.register('artifactFound', computed(() => this.artifacts.pendingFind() !== null));
    // Le moment « butin rare » a sa fanfare
    effect(() => {
      // La fanfare sonne quand la fenêtre apparaît vraiment, pas quand l'artefact attend son tour
      if (this.visible()) {
        this.sound.play('artifact');
      }
    });
  }

  protected readonly view = computed(() => {
    const find = this.artifacts.pendingFind();
    if (find === null || !this.visible()) {
      return null;
    }
    const def = ARTIFACTS[find.id];
    return {
      find,
      headline: HEADLINES[find.kind],
      label: def.label,
      icon: artifactIconUrl(find.id),
      rarity: def.rarity,
      rarityLabel: RARITY_LABELS[def.rarity],
      lore: def.lore,
      effects: describeBonuses(artifactEffects(find.id, find.level)),
      canEquip: find.kind !== 'maxed' && this.artifacts.equipped() !== find.id,
    };
  });

  protected equip(): void {
    const view = this.view();
    if (view !== null) {
      this.artifacts.equip(view.find.id);
    }
    this.artifacts.dismissFind();
  }
}
