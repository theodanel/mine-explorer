import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';

import { EVOLUTION_FORMS, goldForDamage, rockHp, zoneMaterial } from '../balance/balance';
import { MERCHANT_UNLOCK_FORM, MerchantGoods } from '../balance/merchant';
import { Companions } from '../companions/companions';
import { Evolution } from '../evolution/evolution';
import { dayKey } from '../missions/mission-rules';
import { Ores } from '../ores/ores';
import { Progression } from '../progression/progression';
import { CLOCK } from '../shared/clock';
import { readStorage, writeStorage } from '../shared/local-storage';
import { RANDOM } from '../shared/random';
import { GeodeShards } from '../wallet/geode-shards';
import { Wallet } from '../wallet/wallet';
import {
  bluff,
  canHaggle,
  dailyOffers,
  daysUntilVisit,
  freshMerchantDay,
  haggle,
  isValidMerchantState,
  MerchantState,
  merchantPhase,
  offerState,
  Outcome,
  purchase,
} from './merchant-rules';

const STORAGE_KEY = 'mine-explorer.merchant';
/** Le jour est relu chaque minute : l'arrivée et le départ se font à minuit, même jeu ouvert. */
const DAY_CHECK_MS = 60_000;
/** Filon de milieu de zone, pour compter les prix en or. */
const PRICE_STAGE = 8;

export const MERCHANT_UNLOCK_INDEX = EVOLUTION_FORMS.findIndex((form) => form.id === MERCHANT_UNLOCK_FORM);

export type MerchantAction = 'haggle' | 'bluff' | 'buy';

/** Dernière réaction du marchand, pour sa bulle et son animation. */
export interface MerchantReaction {
  readonly id: number;
  readonly action: MerchantAction;
  readonly outcome: Outcome;
}

/**
 * Marchand nain : il passe 10 jours par mois tirés au hasard (les mêmes pour tous), annoncé par des indices les jours d'avant.
 * Ses trois offres du jour se marchandent ; son humeur décide si le marchandage et le bluff passent.
 */
@Injectable({ providedIn: 'root' })
export class Merchant {
  private readonly clock = inject(CLOCK);
  private readonly random = inject(RANDOM);
  private readonly evolution = inject(Evolution);
  private readonly progression = inject(Progression);
  private readonly wallet = inject(Wallet);
  private readonly shards = inject(GeodeShards);
  private readonly companions = inject(Companions);
  private readonly ores = inject(Ores);
  private readonly now = signal(this.clock());
  private readonly saved = signal<MerchantState | null>(loadMerchant());
  private reactionCount = 0;

  readonly unlocked = computed(() => this.evolution.index() >= MERCHANT_UNLOCK_INDEX);
  readonly unlockLabel = EVOLUTION_FORMS[MERCHANT_UNLOCK_INDEX].label;
  readonly phase = computed(() => merchantPhase(new Date(this.now())));
  readonly here = computed(() => this.phase().kind === 'here');
  readonly daysUntil = computed(() => daysUntilVisit(new Date(this.now())));
  /** Jour du joueur (« 2026-10-17 ») : la journée de marchandage et les indices s'y rattachent. */
  readonly today = computed(() => dayKey(this.now()));
  /** État du jour : humeur et offres marchandées. Un nouveau jour repart à neuf. */
  readonly state = computed(() => {
    const saved = this.saved();
    return saved !== null && saved.day === this.today() ? saved : freshMerchantDay(this.today());
  });
  readonly mood = computed(() => this.state().mood);
  readonly offers = computed(() => {
    const stageGold = goldForDamage(rockHp(this.progression.zone(), PRICE_STAGE), 0);
    return dailyOffers(this.today()).map((offer) => {
      const current = offerState(this.state(), offer.id);
      return {
        ...offer,
        price: Math.max(1, Math.round(offer.stages * stageGold * current.factor)),
        status: current.status,
        canHaggle: canHaggle(this.state(), offer.id),
      };
    });
  });
  readonly reaction = signal<MerchantReaction | null>(null);

  constructor() {
    const timer = setInterval(() => this.now.set(this.clock()), DAY_CHECK_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  haggle(id: string): void {
    this.attempt('haggle', haggle(this.state(), id, this.random()));
  }

  bluff(id: string): void {
    this.attempt('bluff', bluff(this.state(), id, this.random()));
  }

  buy(id: string): boolean {
    const offer = this.offers().find((candidate) => candidate.id === id);
    const next = purchase(this.state(), id);
    if (!this.here() || offer === undefined || next === null || !this.wallet.spend(offer.price)) {
      return false;
    }
    this.deliver(offer.goods);
    this.save(next);
    this.react('buy', 'success');
    return true;
  }

  private attempt(action: MerchantAction, result: { state: MerchantState; outcome: Outcome } | null): void {
    if (!this.here() || result === null) {
      return;
    }
    this.save(result.state);
    this.react(action, result.outcome);
  }

  private deliver(goods: MerchantGoods): void {
    switch (goods.kind) {
      case 'shards':
        this.shards.add(goods.amount);
        break;
      case 'stones':
        this.companions.addStones(goods.amount);
        break;
      case 'egg':
        this.companions.addEgg(goods.minRarity);
        break;
      case 'ores': {
        const tier = zoneMaterial(this.progression.zone());
        if (tier !== null) {
          this.ores.add(tier, goods.amount);
        }
        break;
      }
    }
  }

  private react(action: MerchantAction, outcome: Outcome): void {
    this.reaction.set({ id: ++this.reactionCount, action, outcome });
  }

  private save(next: MerchantState): void {
    this.saved.set(next);
    writeStorage(STORAGE_KEY, JSON.stringify(next));
  }
}

function loadMerchant(): MerchantState | null {
  const raw = readStorage(STORAGE_KEY);
  if (raw === null) {
    return null;
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (isValidMerchantState(value)) {
      return value;
    }
  } catch {
    // JSON illisible : traité comme une sauvegarde invalide juste en dessous
  }
  console.warn('Sauvegarde du marchand invalide ignorée');
  return null;
}
