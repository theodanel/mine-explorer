import { Component, computed, inject, OnDestroy, signal } from '@angular/core';

import { Sound } from '../../audio/sound';
import { zoneMaterial } from '../../balance/balance';
import { ROCKS_PER_RUN } from '../../balance/minehunt';
import { TIER_LABELS } from '../../equipment/equipment.model';
import { materialIconUrl, MINEHUNT_IMAGES, pageBackground, rockUrl } from '../../loading/game-assets';
import { Navigation } from '../../navigation/navigation';
import { Progression } from '../../progression/progression';
import { Minehunt } from '../minehunt';
import { nextRisk, RockOutcome } from '../minehunt-game';
import { compactNumber } from '../../shared/format-number';

/** Le rocher tremble un instant sous la pioche avant de livrer ce qu'il cache. */
const STRIKE_MS = 320;
/** Durée de l'annonce (butin, étai, éboulement) avant que le rocher suivant ne s'avance. */
const REVEAL_MS = 900;
/** Au-delà de ce risque, la jauge passe au rouge. */
const HIGH_RISK = 0.25;

interface Reveal {
  readonly outcome: RockOutcome;
  readonly key: number;
}

/** Chasse au filon, en « Quitte ou double » : la file de rochers, la cagnotte, et le bilan. */
@Component({
  selector: 'app-minehunt-page',
  templateUrl: './minehunt-page.html',
  styleUrl: './minehunt-page.scss',
})
export class MinehuntPage implements OnDestroy {
  protected readonly minehunt = inject(Minehunt);
  private readonly navigation = inject(Navigation);
  private readonly sound = inject(Sound);
  private readonly progression = inject(Progression);
  private readonly timers: ReturnType<typeof setTimeout>[] = [];

  protected readonly images = MINEHUNT_IMAGES;
  protected readonly scene = pageBackground(MINEHUNT_IMAGES.background);
  protected readonly ore = computed(() => {
    const tier = zoneMaterial(this.progression.zone());
    return tier === null ? null : { icon: materialIconUrl(tier), label: TIER_LABELS[tier] };
  });
  protected readonly gamble = this.minehunt.gamble;
  protected readonly over = computed(() => this.gamble()?.status !== 'playing');
  /** La file : un rocher par zone visitée, du plus tendre au plus dur, et ce que chacun a donné. */
  protected readonly row = computed(() => {
    const rocks = this.gamble()?.rocks ?? [];
    return Array.from({ length: ROCKS_PER_RUN }, (_, index) => ({
      image: rockUrl(index + 1),
      outcome: rocks[index] ?? null,
      kind: rocks[index]?.kind ?? '',
      current: index === rocks.length,
    }));
  });
  protected readonly currentRock = computed(() => rockUrl(Math.min((this.gamble()?.rocks.length ?? 0) + 1, ROCKS_PER_RUN)));
  protected readonly risk = computed(() => {
    const gamble = this.gamble();
    return gamble === null ? 0 : nextRisk(gamble);
  });
  protected readonly riskHigh = computed(() => this.risk() >= HIGH_RISK);
  protected readonly props = computed(() => {
    const gamble = this.gamble();
    return gamble === null ? [] : Array.from({ length: gamble.props }, (_, index) => index);
  });
  protected readonly striking = signal(false);
  protected readonly reveal = signal<Reveal | null>(null);
  protected readonly shake = signal(false);
  protected readonly busy = computed(() => this.striking() || this.reveal() !== null);

  protected start(): void {
    if (this.minehunt.start()) {
      this.reveal.set(null);
      this.sound.play('upgrade');
    }
  }

  /** Coup de pioche sur le rocher du moment : il tremble, puis livre son butin ou s'effondre. */
  protected strike(): void {
    if (this.busy() || this.over()) {
      return;
    }
    this.striking.set(true);
    this.sound.play('strike');
    this.later(STRIKE_MS, () => {
      this.striking.set(false);
      this.minehunt.breakNext();
      const rocks = this.gamble()?.rocks ?? [];
      const outcome = rocks[rocks.length - 1];
      if (outcome !== undefined) {
        this.announce(outcome, rocks.length);
      }
    });
  }

  protected cashOut(): void {
    if (!this.busy()) {
      this.minehunt.cashOut();
      this.sound.play('artifact');
    }
  }

  protected leave(): void {
    this.minehunt.leave();
  }

  protected replay(): void {
    this.minehunt.leave();
    this.start();
  }

  protected compact(value: number): string {
    return compactNumber(value);
  }

  protected percent(value: number): string {
    return `${Math.round(value * 100)} %`;
  }

  protected back(): void {
    this.minehunt.leave();
    this.navigation.open('adventures');
  }

  ngOnDestroy(): void {
    this.timers.forEach(clearTimeout);
  }

  private announce(outcome: RockOutcome, key: number): void {
    this.reveal.set({ outcome, key });
    if (outcome.kind === 'caveIn') {
      this.sound.play('blast');
      this.shake.set(true);
    } else if (outcome.kind === 'propped') {
      this.sound.play('rockBreak');
      this.shake.set(true);
    } else {
      this.sound.play(outcome.chest ? 'artifact' : 'shard');
    }
    // L'éboulement reste affiché sous le bilan ; le reste s'efface pour laisser place au rocher suivant
    if (outcome.kind !== 'caveIn') {
      this.later(REVEAL_MS, () => this.reveal.set(null));
    }
    this.later(REVEAL_MS / 2, () => this.shake.set(false));
  }

  private later(delay: number, action: () => void): void {
    this.timers.push(setTimeout(action, delay));
  }
}
