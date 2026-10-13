import { Component, computed, inject, OnInit, signal } from '@angular/core';

import { ARTIFACT_IDS, ARTIFACT_MAX_LEVEL, ArtifactId, ARTIFACTS } from '../../balance/artifacts';
import { RARITY_LABELS } from '../../balance/skill-tree';
import { artifactIconUrl } from '../../loading/game-assets';
import { describeBonuses } from '../../miner/bonus-format';
import { Navigation } from '../../navigation/navigation';
import { artifactEffects } from '../artifact-rules';
import { Artifacts } from '../artifacts';

/** Vitrine des artefacts : ceux trouvés avec leur histoire, ceux qui restent à découvrir en silhouette. */
@Component({
  selector: 'app-artifacts-page',
  templateUrl: './artifacts-page.html',
  styleUrl: './artifacts-page.scss',
})
export class ArtifactsPage implements OnInit {
  protected readonly artifacts = inject(Artifacts);
  private readonly navigation = inject(Navigation);
  private readonly selectedId = signal<ArtifactId | null>(null);
  protected readonly total = ARTIFACT_IDS.length;

  protected readonly cells = computed(() => {
    const owned = this.artifacts.owned();
    return ARTIFACT_IDS.map((id) => {
      const level = owned[id];
      const def = ARTIFACTS[id];
      return {
        id,
        found: level !== undefined,
        label: level !== undefined ? def.label : 'Inconnu',
        icon: artifactIconUrl(id),
        rarity: def.rarity,
        level: level ?? 0,
        equipped: this.artifacts.equipped() === id,
        selected: this.selected()?.id === id,
      };
    });
  });

  protected readonly selected = computed(() => {
    const owned = this.artifacts.owned();
    const id = this.selectedId() ?? this.artifacts.equipped() ?? ARTIFACT_IDS.find((candidate) => owned[candidate] !== undefined) ?? null;
    if (id === null || owned[id] === undefined) {
      return null;
    }
    const level = owned[id] ?? 1;
    const def = ARTIFACTS[id];
    return {
      id,
      label: def.label,
      icon: artifactIconUrl(id),
      rarity: def.rarity,
      rarityLabel: RARITY_LABELS[def.rarity],
      lore: def.lore,
      level,
      maxLevel: ARTIFACT_MAX_LEVEL,
      effects: describeBonuses(artifactEffects(id, level)),
      nextEffects: level < ARTIFACT_MAX_LEVEL ? describeBonuses(artifactEffects(id, level + 1)) : null,
      equipped: this.artifacts.equipped() === id,
    };
  });

  ngOnInit(): void {
    this.artifacts.markSeen();
  }

  protected select(id: ArtifactId, found: boolean): void {
    if (found) {
      this.selectedId.set(id);
    }
  }

  protected close(): void {
    this.navigation.open('mine');
  }
}
