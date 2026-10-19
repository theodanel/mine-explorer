import { Component, computed, inject } from '@angular/core';

import { Sound } from '../../audio/sound';
import { ARTIFACT_IDS, ARTIFACT_MAX_LEVEL, ArtifactAffix, ArtifactId, ARTIFACTS } from '../../balance/artifacts';
import { NO_BONUSES, RARITY_LABELS } from '../../balance/skill-tree';
import { TierId } from '../../equipment/equipment.model';
import { artifactIconUrl, materialIconUrl } from '../../loading/game-assets';
import { describeBonuses } from '../../miner/bonus-format';
import { affixValue } from '../artifact-rules';
import { Artifacts } from '../artifacts';

/** Effet secondaire en texte : « +6 % de Frappe (Rare) ». */
function describeAffix(affix: ArtifactAffix): string {
  const [line] = describeBonuses({ ...NO_BONUSES, [affix.bonus]: affixValue(affix) });
  return `${line} (${RARITY_LABELS[affix.rarity]})`;
}

/**
 * Réforge des artefacts, à l'Atelier : un artefact au niveau maximum gagne un effet secondaire tiré au hasard. Après
 * le tirage, le joueur garde le nouvel effet ou revient à l'ancien.
 */
@Component({
  selector: 'app-artifact-reforge',
  templateUrl: './artifact-reforge.html',
  styleUrl: './artifact-reforge.scss',
})
export class ArtifactReforge {
  protected readonly artifacts = inject(Artifacts);
  private readonly sound = inject(Sound);

  protected readonly rows = computed(() => {
    const owned = this.artifacts.owned();
    const pending = this.artifacts.pending();
    return ARTIFACT_IDS.filter((id) => owned[id] === ARTIFACT_MAX_LEVEL).map((id) => {
      const affix = this.artifacts.affixes()[id];
      const { each, token, cost } = this.artifacts.reforgeCost(id);
      const tokens = this.artifacts.tokens()[id] ?? 0;
      return {
        id,
        label: ARTIFACTS[id].label,
        icon: artifactIconUrl(id),
        rarity: ARTIFACTS[id].rarity,
        current: affix === undefined ? null : describeAffix(affix),
        offer: pending?.id === id ? describeAffix(pending.affix) : null,
        tokens,
        ores:
          cost === null
            ? null
            : (Object.keys(cost) as TierId[]).map((tier) => ({ tier, icon: materialIconUrl(tier), amount: each })),
        each,
        affordable: token || cost !== null,
        blocked: pending !== null && pending.id !== id,
      };
    });
  });

  protected reforge(id: ArtifactId): void {
    if (this.artifacts.reforge(id)) {
      this.sound.play('forgeRare');
    }
  }

  protected resolve(keep: boolean): void {
    this.artifacts.resolveReforge(keep);
    if (keep) {
      this.sound.play('upgrade');
    }
  }
}
