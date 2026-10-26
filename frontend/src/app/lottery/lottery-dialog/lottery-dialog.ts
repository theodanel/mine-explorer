import { Component, computed, DestroyRef, DOCUMENT, ElementRef, inject, output, signal } from '@angular/core';

import { Sound } from '../../audio/sound';
import { RARITY_LABELS } from '../../balance/skill-tree';
import { eggIconUrl, REFONTE_IMAGES } from '../../loading/game-assets';
import { RewardFlight } from '../../reward-flight/reward-flight';
import { holdUserDialog } from '../../shared/overlays';
import { Lottery, LotteryDraw } from '../lottery';
import { LotteryPrize } from '../lottery-rules';
import { compactNumber } from '../../shared/format-number';

const PERCENT = new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: 0 });
/** La lumière fait au moins deux tours avant de ralentir sur le lot gagné. */
const SPIN_LAPS = 2;
const FIRST_STEP_MS = 60;
const LAST_STEP_MS = 320;

const ICONS = {
  gold: 'assets/ui/coin.webp',
  shards: 'assets/ui/geode-shard.webp',
  stones: REFONTE_IMAGES.awakeningStone,
} as const;

function prizeIcon(prize: LotteryPrize): string {
  return prize.kind === 'egg' ? eggIconUrl(prize.minRarity) : ICONS[prize.kind];
}

function prizeLabel(prize: LotteryPrize): string {
  switch (prize.kind) {
    case 'gold':
      return `${compactNumber(prize.amount)} or`;
    case 'shards':
      return `${prize.amount} éclats`;
    case 'stones':
      return `${prize.amount} pierres d'éveil`;
    case 'egg':
      return prize.minRarity === 'common' ? 'Œuf' : `Œuf ${RARITY_LABELS[prize.minRarity].toLowerCase()}+`;
  }
}

/** Délai avant le pas suivant de la lumière : elle ralentit à l'approche du lot gagné. */
function stepDelay(step: number, total: number): number {
  const progress = step / total;
  return FIRST_STEP_MS + (LAST_STEP_MS - FIRST_STEP_MS) * progress ** 3;
}

/** Fenêtre de la loterie : les six lots du jour, leur chance, et la lumière qui tourne jusqu'au lot gagné. */
@Component({
  selector: 'app-lottery-dialog',
  templateUrl: './lottery-dialog.html',
  styleUrl: './lottery-dialog.scss',
})
export class LotteryDialog {
  protected readonly lottery = inject(Lottery);
  private readonly sound = inject(Sound);
  private readonly flight = inject(RewardFlight);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
  readonly closed = output();

  protected readonly lots = computed(() =>
    this.lottery.lots().map((lot) => ({
      ...lot,
      icon: prizeIcon(lot.prize),
      label: prizeLabel(lot.prize),
      chanceLabel: PERCENT.format(lot.chance),
      rarityLabel: RARITY_LABELS[lot.rarity],
    })),
  );
  /** Case éclairée pendant que la lumière tourne. */
  protected readonly lit = signal<number | null>(null);
  protected readonly spinning = signal(false);
  protected readonly won = signal<(LotteryDraw & { readonly label: string }) | null>(null);
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    holdUserDialog();
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  protected spin(): void {
    // Le lot est tiré et crédité avant l'animation : fermer la fenêtre en route ne fait rien perdre
    const draw = this.lottery.draw();
    if (draw === null) {
      return;
    }
    this.won.set(null);
    if (this.document.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.reveal(draw);
      return;
    }
    this.spinning.set(true);
    const count = this.lots().length;
    const total = SPIN_LAPS * count + draw.index;
    const step = (current: number) => {
      this.lit.set(current % count);
      if (current >= total) {
        this.reveal(draw);
        return;
      }
      this.timer = setTimeout(() => step(current + 1), stepDelay(current, total));
    };
    step(0);
  }

  private reveal(draw: LotteryDraw): void {
    this.spinning.set(false);
    this.lit.set(draw.index);
    this.won.set({ ...draw, label: prizeLabel(draw.lot.prize) });
    this.sound.play(draw.lot.rarity === 'epic' || draw.lot.rarity === 'legendary' ? 'artifact' : 'upgrade');
    this.flyFrom(draw);
  }

  /** L'or et les éclats gagnés filent de la case jusqu'aux compteurs. */
  private flyFrom(draw: LotteryDraw): void {
    const prize = draw.lot.prize;
    if (prize.kind !== 'gold' && prize.kind !== 'shards') {
      return;
    }
    const cell = this.host.nativeElement.querySelectorAll<HTMLElement>('.lot')[draw.index];
    if (cell === undefined) {
      return;
    }
    const box = cell.getBoundingClientRect();
    const origin = { x: box.left + box.width / 2, y: box.top + box.height / 2 };
    this.flight.launch(origin, prize.kind === 'gold' ? { coins: prize.amount } : { shards: prize.amount });
  }
}
