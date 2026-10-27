import { Component, computed, inject, input, output } from '@angular/core';

import { Sound } from '../../audio/sound';
import { awakeningCost, awakeningStatBonus, MAX_AWAKENING } from '../../balance/awakening';
import { ESSENCE_LABELS } from '../../balance/heart-forge';
import { HeartForge } from '../../heart-forge/heart-forge';
import { essenceIconUrl } from '../../heart-forge/heart-forge-page/heart-forge-page';
import { itemIconUrl } from '../../loading/game-assets';
import { holdUserDialog } from '../../shared/overlays';
import { Awakening } from '../awakening';
import { applyAwakening, AwakeningBlocker } from '../awakening-rules';
import { formatStat } from '../equipment-format';
import { rebirthMark } from '../equipment-rules';
import { SlotId, SLOTS, STAT_IDS, STATS, TIER_LABELS } from '../equipment.model';
import { Inventory } from '../inventory';

const NUMBER_FORMAT = new Intl.NumberFormat('fr-FR');

const BLOCKER_TEXT: Readonly<Record<AwakeningBlocker, string>> = {
  'not-divine': 'Seule une pièce Divin peut s’éveiller.',
  max: 'Éveil au maximum : la pièce est entièrement corrompue.',
  family: 'Cette phase se fait avec le Divin de la famille de ta vie en cours : renais, puis forge-le.',
  duplicates: 'Il manque des doublons Divin de cette pièce : chaque Divin vendu en met un de côté.',
  essences: 'Il manque des ressources du Cœur : récolte-les dans les Échos.',
};

function percent(value: number): string {
  return `+${Math.round(value * 100)} %`;
}

/**
 * Fiche d'une pièce portée : ses stats et, dès la Légende du Cœur du monde, son Éveil (le « Divin corrompu ») avec
 * un seul bouton « Éveiller ».
 */
@Component({
  selector: 'app-item-sheet',
  templateUrl: './item-sheet.html',
  styleUrl: './item-sheet.scss',
})
export class ItemSheet {
  private readonly inventory = inject(Inventory);
  private readonly awakening = inject(Awakening);
  private readonly heartForge = inject(HeartForge);
  private readonly sound = inject(Sound);

  readonly slot = input.required<SlotId>();
  readonly closed = output();

  constructor() {
    holdUserDialog();
  }

  protected readonly view = computed(() => {
    const slot = this.slot();
    const item = this.inventory.equipped()[slot];
    if (item === undefined) {
      return null;
    }
    const divine = item.tier === 'divine';
    // L'Éveil de l'emplacement compte sur toute pièce ; seule une pièce Divin prend l'apparence corrompue
    const level = this.awakening.level(slot);
    const shown = applyAwakening({ [slot]: item }, this.awakening.levels())[slot] ?? item;
    return {
      label: SLOTS[slot].label,
      tier: item.tier,
      tierLabel: `${TIER_LABELS[item.tier]}${rebirthMark(item)}`,
      level: item.level,
      icon: itemIconUrl(slot, item.tier, SLOTS[slot].iconUrl, level),
      awakening: level,
      stats: STAT_IDS.filter((stat) => shown.stats[stat] !== undefined).map((stat) => ({
        stat,
        label: STATS[stat].label,
        value: formatStat(stat, shown.stats[stat] ?? 0),
      })),
      awaken: this.awakening.unlocked() ? this.awakenView(slot, divine, level) : null,
    };
  });

  private awakenView(slot: SlotId, divine: boolean, level: number) {
    const cost = awakeningCost(slot, level);
    const blocker = this.awakening.blocker(this.inventory.equipped()[slot]);
    return {
      level,
      max: MAX_AWAKENING,
      bonus: level > 0 ? percent(awakeningStatBonus(level)) : null,
      nextBonus: cost === null ? null : percent(awakeningStatBonus(level + 1)),
      cost:
        cost === null || !divine
          ? null
          : {
              duplicates: `${NUMBER_FORMAT.format(this.awakening.duplicates()[slot] ?? 0)} / ${NUMBER_FORMAT.format(cost.duplicates)}`,
              essence: ESSENCE_LABELS[cost.essence],
              essenceIcon: essenceIconUrl(cost.essence),
              essences: `${NUMBER_FORMAT.format(this.heartForge.essences()[cost.essence])} / ${NUMBER_FORMAT.format(cost.essences)}`,
            },
      ready: blocker === null,
      hint: blocker === null ? null : BLOCKER_TEXT[blocker],
    };
  }

  protected awaken(): void {
    if (this.awakening.awaken(this.inventory.equipped()[this.slot()])) {
      this.sound.play('upgrade');
    }
  }
}
