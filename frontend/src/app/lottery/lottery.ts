import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';

import { Companions } from '../companions/companions';
import { dayKey } from '../missions/mission-rules';
import { Progression } from '../progression/progression';
import { CLOCK } from '../shared/clock';
import { readStorage, writeStorage } from '../shared/local-storage';
import { RANDOM } from '../shared/random';
import { GeodeShards } from '../wallet/geode-shards';
import { Wallet } from '../wallet/wallet';
import { canDraw, drawSlot, EMPTY_LOTTERY, isValidLotteryState, LotteryLot, lotteryBoard, LotteryPrize, LotteryState } from './lottery-rules';

const STORAGE_KEY = 'mine-explorer.lottery';
/** Le jour est relu chaque minute : le tirage revient à minuit même si le jeu reste ouvert. */
const DAY_CHECK_MS = 60_000;

export interface LotteryDraw {
  readonly index: number;
  readonly lot: LotteryLot;
}

/** Loterie du jour : un tirage gratuit par jour parmi six lots qui changent à minuit. */
@Injectable({ providedIn: 'root' })
export class Lottery {
  private readonly clock = inject(CLOCK);
  private readonly random = inject(RANDOM);
  private readonly progression = inject(Progression);
  private readonly companions = inject(Companions);
  private readonly wallet = inject(Wallet);
  private readonly shards = inject(GeodeShards);
  private readonly state = signal<LotteryState>(loadLottery());
  private readonly today = signal(dayKey(this.clock()));

  readonly available = computed(() => canDraw(this.state(), this.today()));
  readonly lots = computed(() =>
    lotteryBoard(this.today(), {
      zone: this.progression.zone(),
      stage: this.progression.progress().stage,
      companionsUnlocked: this.companions.unlocked(),
    }),
  );

  constructor() {
    const timer = setInterval(() => this.today.set(dayKey(this.clock())), DAY_CHECK_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  /** Tire un lot et le crédite tout de suite (rien n'est perdu si la fenêtre se ferme pendant l'animation). */
  draw(): LotteryDraw | null {
    const today = dayKey(this.clock());
    this.today.set(today);
    if (!canDraw(this.state(), today)) {
      return null;
    }
    const lots = this.lots();
    const index = drawSlot(this.random(), lots);
    this.save({ lastDraw: today });
    this.grant(lots[index].prize);
    return { index, lot: lots[index] };
  }

  private grant(prize: LotteryPrize): void {
    switch (prize.kind) {
      case 'gold':
        this.wallet.add(prize.amount);
        break;
      case 'shards':
        this.shards.add(prize.amount);
        break;
      case 'stones':
        this.companions.addStones(prize.amount);
        break;
      case 'egg':
        this.companions.addEgg(prize.minRarity);
        break;
    }
  }

  private save(next: LotteryState): void {
    this.state.set(next);
    writeStorage(STORAGE_KEY, JSON.stringify(next));
  }
}

function loadLottery(): LotteryState {
  const raw = readStorage(STORAGE_KEY);
  if (raw === null) {
    return EMPTY_LOTTERY;
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (isValidLotteryState(value)) {
      return value;
    }
  } catch {
    // JSON illisible : traité comme une sauvegarde invalide juste en dessous
  }
  console.warn('Sauvegarde de la loterie invalide ignorée');
  return EMPTY_LOTTERY;
}
