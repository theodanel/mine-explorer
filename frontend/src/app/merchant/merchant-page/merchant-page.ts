import { Component, computed, effect, inject, signal } from '@angular/core';

import { Sound } from '../../audio/sound';
import { zoneMaterial } from '../../balance/balance';
import { MerchantGoods } from '../../balance/merchant';
import { RARITY_LABELS } from '../../balance/skill-tree';
import { TIER_LABELS } from '../../equipment/equipment.model';
import { eggIconUrl, materialIconUrl, MERCHANT_IMAGES, pageBackground, REFONTE_IMAGES } from '../../loading/game-assets';
import { Navigation } from '../../navigation/navigation';
import { Progression } from '../../progression/progression';
import { Merchant, MerchantAction } from '../merchant';
import { Outcome } from '../merchant-rules';
import { compactNumber } from '../../shared/format-number';

const BUBBLE_MS = 2600;

/** Ce que dit le marchand selon ce qu'on vient de tenter, et comment ça s'est passé. */
const LINES: Readonly<Record<MerchantAction, Readonly<Record<Outcome, string>>>> = {
  haggle: { success: 'Bon, bon… pour toi, je fais un effort.', failure: 'Tu me prends pour un débutant ? Ça sera plus cher !' },
  bluff: { success: 'Moins cher ailleurs ?! Bon, très bien, je m\'aligne…', failure: 'Menteur ! Cette affaire n\'est plus pour toi.' },
  buy: { success: 'Marché conclu ! Un plaisir de faire affaire.', failure: '' },
};

/** Humeur du marchand en mots, du plus fâché au plus ravi. */
function moodLabel(mood: number): string {
  if (mood >= 75) {
    return 'Ravi';
  }
  if (mood >= 50) {
    return 'Aimable';
  }
  if (mood >= 25) {
    return 'Agacé';
  }
  return 'Furieux';
}

/** Marchand nain : son étal, son humeur et ses trois offres du jour à marchander. */
@Component({
  selector: 'app-merchant-page',
  templateUrl: './merchant-page.html',
  styleUrl: './merchant-page.scss',
})
export class MerchantPage {
  protected readonly merchant = inject(Merchant);
  private readonly navigation = inject(Navigation);
  private readonly sound = inject(Sound);
  private readonly progression = inject(Progression);

  protected readonly images = MERCHANT_IMAGES;
  protected readonly scene = pageBackground(MERCHANT_IMAGES.stall);
  protected readonly moodLabel = computed(() => moodLabel(this.merchant.mood()));
  protected readonly offers = computed(() =>
    this.merchant.offers().map((offer) => ({ ...offer, ...this.describe(offer.goods), priceLabel: compactNumber(offer.price) })),
  );
  protected readonly bubble = signal<{ text: string; mood: Outcome } | null>(null);
  private bubbleTimer: ReturnType<typeof setTimeout> | undefined;
  protected readonly greeting = computed(() => {
    const phase = this.merchant.phase();
    return phase.kind === 'here' && phase.lastDay
      ? 'Je remballe mes affaires ce soir… dernière chance !'
      : 'Bienvenue, mineur ! Regarde-moi ces merveilles.';
  });

  constructor() {
    effect(() => {
      const reaction = this.merchant.reaction();
      if (reaction !== null) {
        this.say(LINES[reaction.action][reaction.outcome], reaction.outcome);
        this.sound.play(reaction.outcome === 'success' ? (reaction.action === 'buy' ? 'sell' : 'upgrade') : 'rockBreak');
      }
    });
  }

  protected buy(id: string): void {
    if (!this.merchant.buy(id)) {
      this.say('Reviens quand ta bourse sera plus lourde !', 'failure');
    }
  }

  protected haggle(id: string): void {
    this.merchant.haggle(id);
  }

  protected bluff(id: string): void {
    this.merchant.bluff(id);
  }

  protected back(): void {
    this.navigation.open('adventures');
  }

  private say(text: string, mood: Outcome): void {
    this.bubble.set({ text, mood });
    clearTimeout(this.bubbleTimer);
    this.bubbleTimer = setTimeout(() => this.bubble.set(null), BUBBLE_MS);
  }

  private describe(goods: MerchantGoods): { label: string; icon: string } {
    switch (goods.kind) {
      case 'shards':
        return { label: `${goods.amount} éclats`, icon: 'assets/ui/geode-shard.webp' };
      case 'stones':
        return { label: `${goods.amount} pierres d'éveil`, icon: REFONTE_IMAGES.awakeningStone };
      case 'egg':
        return { label: `Œuf ${RARITY_LABELS[goods.minRarity].toLowerCase()} ou mieux`, icon: eggIconUrl(goods.minRarity) };
      case 'ores': {
        const tier = zoneMaterial(this.progression.zone());
        return tier === null
          ? { label: `${goods.amount} minerais`, icon: 'assets/ui/geode-shard.webp' }
          : { label: `${goods.amount} ${TIER_LABELS[tier]}`, icon: materialIconUrl(tier) };
      }
    }
  }
}
