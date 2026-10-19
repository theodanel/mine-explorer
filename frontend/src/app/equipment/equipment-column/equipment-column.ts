import { Component, computed, inject, input } from '@angular/core';

import { ARTIFACTS } from '../../balance/artifacts';
import { tierIndex } from '../../balance/balance';
import { COMPANIONS } from '../../balance/companions';
import { companionEffects } from '../../companions/companion-rules';
import { Companions } from '../../companions/companions';
import { RARITY_LABELS } from '../../balance/skill-tree';
import { artifactEffects } from '../../artifacts/artifact-rules';
import { Artifacts } from '../../artifacts/artifacts';
import { artifactIconUrl, companionIconUrl, itemIconUrl } from '../../loading/game-assets';
import { describeBonuses } from '../../miner/bonus-format';
import { Navigation } from '../../navigation/navigation';
import { Tooltip, TooltipContent } from '../../shared/tooltip/tooltip';
import { formatStatDelta } from '../equipment-format';
import { gearSet, sellPrice } from '../equipment-rules';
import { Item, SLOT_IDS, SlotId, SLOTS, STAT_IDS, STATS, TIER_LABELS } from '../equipment.model';
import { Inventory } from '../inventory';

/** Emplacement d'objet, case d'artefact ou de compagnon, ou null pour une case verrouillée réservée à plus tard. */
export type ColumnSlot = SlotId | 'artifact' | 'companion' | null;

/** La pastille de panoplie apparaît dès 2 pièces du même palier, avant le premier bonus (3 pièces). */
const SET_HINT_PIECES = 2;

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
  /** En ligne : le panneau d'équipement du bas de l'écran, façon Legend of Mushroom. */
  readonly row = input(false);
  private readonly companions = inject(Companions);

  /** Emplacement de la meilleure pièce portée (le palier le plus haut) : elle respire pour attirer l'œil. */
  private readonly bestSlot = computed(() => {
    let best: { slot: string; rank: number } | null = null;
    for (const [slot, item] of Object.entries(this.inventory.equipped())) {
      const rank = item === undefined ? -1 : tierIndex(item.tier) * 100 + item.level;
      if (item !== undefined && (best === null || rank > best.rank)) {
        best = { slot, rank };
      }
    }
    return best?.slot ?? null;
  });

  protected readonly cells = computed(() => {
    const equipped = this.inventory.equipped();
    const bestSlot = this.bestSlot();
    return this.slots().map((slot, index) => {
      if (slot === null) {
        return { key: `locked-${index}`, kind: 'locked' as const, tooltip: 'Emplacement bientôt disponible.' };
      }
      if (slot === 'artifact') {
        return this.artifactCell();
      }
      if (slot === 'companion') {
        return this.companionCell();
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
        best: slot === bestSlot,
        tooltip: item ? itemCard(label, item) : `${label} : vide. Forge un objet pour l'équiper ici.`,
      };
    });
  });

  /** Panoplie portée, affichée dès 2 pièces du même palier : le joueur voit ce qu'il lui manque pour le bonus. */
  protected readonly setBadge = computed(() => {
    const set = gearSet(this.inventory.equipped());
    if (set === null || set.pieces < SET_HINT_PIECES) {
      return null;
    }
    const bonus = set.strikePct > 0 ? ` · +${Math.round(set.strikePct * 100)} % Frappe` : '';
    return { tier: set.tier, text: `Panoplie ${TIER_LABELS[set.tier]} ${set.pieces}/${SLOT_IDS.length}${bonus}`, active: set.strikePct > 0 };
  });

  protected openArtifacts(): void {
    this.navigation.open('artifacts');
  }

  protected openCompanions(): void {
    if (this.companions.unlocked()) {
      this.navigation.open('companions');
    }
  }

  /** Case du compagnon qui accompagne le mineur, à côté de l'artefact. */
  private companionCell() {
    const id = this.companions.active();
    const owned = id === null ? undefined : this.companions.owned()[id];
    if (id === null || owned === undefined) {
      return {
        key: 'companion',
        kind: 'companion' as const,
        empty: true as const,
        tooltip: (this.companions.unlocked() ? 'Compagnon : fais éclore un œuf pour en avoir un.' : null) as TooltipContent | null,
      };
    }
    const def = COMPANIONS[id];
    const tooltip: TooltipContent = {
      title: def.label,
      badge: { label: `${RARITY_LABELS[def.rarity]} · ${owned.stars} ★`, tier: '' },
      lines: [...describeBonuses(companionEffects(id, owned)), 'Touche pour voir tes compagnons.'],
    };
    return {
      key: 'companion',
      kind: 'companion' as const,
      empty: false as const,
      label: def.label,
      icon: companionIconUrl(id),
      rarity: def.rarity,
      stars: owned.stars,
      tooltip,
    };
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
