import { Component, computed, inject, input } from '@angular/core';

import { ARTIFACTS } from '../../balance/artifacts';
import { RARITY_LABELS } from '../../balance/skill-tree';
import { artifactEffects } from '../../artifacts/artifact-rules';
import { Artifacts } from '../../artifacts/artifacts';
import { artifactIconUrl, itemIconUrl } from '../../loading/game-assets';
import { describeBonuses } from '../../miner/bonus-format';
import { Navigation } from '../../navigation/navigation';
import { Tooltip, TooltipContent } from '../../shared/tooltip/tooltip';
import { formatStatDelta } from '../equipment-format';
import { sellPrice } from '../equipment-rules';
import { Item, SlotId, SLOTS, STAT_IDS, STATS, TIER_LABELS } from '../equipment.model';
import { Inventory } from '../inventory';

/** Emplacement d'objet, case d'artefact, ou null pour une case verrouillée réservée à plus tard. */
export type ColumnSlot = SlotId | 'artifact' | null;

@Component({
  selector: 'app-equipment-column',
  imports: [Tooltip],
  templateUrl: './equipment-column.html',
  styleUrl: './equipment-column.scss',
})
export class EquipmentColumn {
  private readonly inventory = inject(Inventory);
  private readonly artifacts = inject(Artifacts);
  private readonly navigation = inject(Navigation);

  readonly slots = input.required<readonly ColumnSlot[]>();

  protected readonly cells = computed(() => {
    const equipped = this.inventory.equipped();
    return this.slots().map((slot, index) => {
      if (slot === null) {
        return { key: `locked-${index}`, kind: 'locked' as const, tooltip: 'Emplacement bientôt disponible.' };
      }
      if (slot === 'artifact') {
        return this.artifactCell();
      }
      const { label, iconUrl } = SLOTS[slot];
      const item = equipped[slot];
      return {
        key: slot,
        kind: 'item' as const,
        label,
        iconUrl: itemIconUrl(slot, item?.tier ?? null, iconUrl),
        tier: item?.tier ?? 'empty',
        level: item?.level ?? null,
        tooltip: item ? itemCard(label, item) : `${label} : vide. Forge un objet pour l'équiper ici.`,
      };
    });
  });

  protected openArtifacts(): void {
    this.navigation.open('artifacts');
  }

  private artifactCell() {
    const id = this.artifacts.equipped();
    const level = id === null ? undefined : this.artifacts.owned()[id];
    if (id === null || level === undefined) {
      return {
        key: 'artifact',
        kind: 'artifact' as const,
        empty: true as const,
        tooltip: 'Artefact : termine une zone pour en découvrir un.' as TooltipContent,
      };
    }
    const def = ARTIFACTS[id];
    const tooltip: TooltipContent = {
      title: def.label,
      badge: { label: `${RARITY_LABELS[def.rarity]} · Niv. ${level}`, tier: '' },
      lines: [...describeBonuses(artifactEffects(id, level)), 'Touche pour voir ta collection.'],
    };
    return {
      key: 'artifact',
      kind: 'artifact' as const,
      empty: false as const,
      label: def.label,
      icon: artifactIconUrl(id),
      rarity: def.rarity,
      level,
      tooltip,
    };
  }
}

/** Carte affichée au survol d'un objet porté : matériau, niveau, effets et prix de revente. */
function itemCard(label: string, item: Item): TooltipContent {
  const effects = STAT_IDS.filter((stat) => item.stats[stat] !== undefined).map(
    (stat) => `${STATS[stat].label} ${formatStatDelta(stat, item.stats[stat] ?? 0)}`,
  );
  return {
    title: label,
    badge: { label: `${TIER_LABELS[item.tier]} · Niv. ${item.level}`, tier: item.tier },
    lines: [...effects, `Revente : ${sellPrice(item)} or`],
  };
}
