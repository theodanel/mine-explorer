import { Component, computed, inject, signal } from '@angular/core';

import { Sound } from '../../audio/sound';
import {
  COMPANION_IDS,
  CompanionId,
  COMPANIONS,
  COMPANIONS_UNLOCK_ZONE,
  EGG_RARITY_WEIGHTS,
  EXPEDITION_HOURS,
  LEGENDARY_PITY,
  MAX_COMPANION_LEVEL,
  MAX_STARS,
} from '../../balance/companions';
import { RARITY_IDS, RARITY_LABELS } from '../../balance/skill-tree';
import { TIER_LABELS } from '../../equipment/equipment.model';
import { companionIconUrl, eggIconUrl, materialIconUrl } from '../../loading/game-assets';
import { describeBonuses } from '../../miner/bonus-format';
import { Navigation } from '../../navigation/navigation';
import { formatDuration } from '../../shared/format-duration';
import { companionEffects, expeditionLoot } from '../companion-rules';
import { Companions } from '../companions';

/** Collection de compagnons : couveuse, vitrine, et pour chacun son bonus, sa nourriture et ses expéditions. */
@Component({
  selector: 'app-companions-page',
  templateUrl: './companions-page.html',
  styleUrl: './companions-page.scss',
})
export class CompanionsPage {
  protected readonly companions = inject(Companions);
  private readonly navigation = inject(Navigation);
  private readonly sound = inject(Sound);
  private readonly selectedId = signal<CompanionId | null>(null);

  protected readonly total = COMPANION_IDS.length;
  protected readonly unlockZone = COMPANIONS_UNLOCK_ZONE;
  protected readonly maxStars = Array.from({ length: MAX_STARS }, (_, index) => index);

  /** Chances affichées telles quelles, et le compte à rebours de la garantie. */
  protected readonly odds = computed(() => ({
    rarities: RARITY_IDS.map((rarity) => ({ rarity, label: RARITY_LABELS[rarity], chance: EGG_RARITY_WEIGHTS[rarity] })),
    pityLeft: LEGENDARY_PITY - this.companions.sinceLegendary(),
  }));

  protected readonly incubator = computed(() => {
    const incubating = this.companions.incubating();
    if (incubating === null) {
      return null;
    }
    return {
      icon: eggIconUrl(incubating.rarity),
      rarity: incubating.rarity,
      label: RARITY_LABELS[incubating.rarity],
      timeLeft: formatDuration(incubating.endsAt - this.companions.now()),
    };
  });
  protected readonly queue = computed(() => this.companions.eggs().map((rarity, index) => ({ index, rarity, icon: eggIconUrl(rarity) })));

  protected readonly cells = computed(() => {
    const owned = this.companions.owned();
    return COMPANION_IDS.map((id) => {
      const entry = owned[id];
      const expedition = this.companions.expeditions()[id];
      return {
        id,
        found: entry !== undefined,
        label: entry !== undefined ? COMPANIONS[id].label : 'Inconnu',
        icon: companionIconUrl(id),
        rarity: COMPANIONS[id].rarity,
        stars: entry?.stars ?? 0,
        level: entry?.level ?? 0,
        active: this.companions.active() === id,
        away: expedition !== undefined,
        back: expedition !== undefined && expedition.endsAt <= this.companions.now(),
        selected: this.selected()?.id === id,
      };
    });
  });

  protected readonly selected = computed(() => {
    const owned = this.companions.owned();
    const id = this.selectedId() ?? this.companions.active() ?? COMPANION_IDS.find((candidate) => owned[candidate] !== undefined) ?? null;
    const entry = id === null ? undefined : owned[id];
    if (id === null || entry === undefined) {
      return null;
    }
    const def = COMPANIONS[id];
    const expedition = this.companions.expeditions()[id];
    const material = this.companions.feedMaterial();
    return {
      id,
      label: def.label,
      icon: companionIconUrl(id),
      rarity: def.rarity,
      rarityLabel: RARITY_LABELS[def.rarity],
      description: def.description,
      stars: entry.stars,
      level: entry.level,
      maxLevel: MAX_COMPANION_LEVEL,
      effects: describeBonuses(companionEffects(id, entry)),
      nextEffects: entry.level < MAX_COMPANION_LEVEL ? describeBonuses(companionEffects(id, { ...entry, level: entry.level + 1 })) : null,
      active: this.companions.active() === id,
      feedCost: this.companions.feedCost(id),
      canFeed: this.companions.canFeed(id),
      materialIcon: materialIconUrl(material),
      materialLabel: TIER_LABELS[material],
      expedition:
        expedition === undefined
          ? null
          : { back: expedition.endsAt <= this.companions.now(), timeLeft: formatDuration(expedition.endsAt - this.companions.now()) },
      trips: EXPEDITION_HOURS.map((hours) => ({ hours, loot: expeditionLoot(id, hours), possible: this.companions.canSend(id, hours) })),
    };
  });

  protected select(id: CompanionId, found: boolean): void {
    if (found) {
      this.selectedId.set(id);
    }
  }

  protected hatch(): void {
    if (this.companions.hatch() !== null) {
      this.sound.play('artifact');
    }
  }

  protected feed(id: CompanionId): void {
    if (this.companions.feed(id)) {
      this.sound.play('upgrade');
    }
  }

  protected collect(id: CompanionId): void {
    if (this.companions.collect(id) !== null) {
      this.sound.play('shard');
    }
  }

  protected close(): void {
    this.navigation.open('mine');
  }
}
