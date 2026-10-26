import { Component, computed, effect, inject, OnDestroy, signal } from '@angular/core';

import { Sound } from '../../audio/sound';
import { CAVE_COLUMNS, CAVE_ROWS } from '../../balance/torchlight';
import { pageBackground, TORCHLIGHT_IMAGES } from '../../loading/game-assets';
import { Navigation } from '../../navigation/navigation';
import { Torchlight } from '../torchlight';
import { canStep, CellContent, distance, Expedition, isLit, StepEvent } from '../torchlight-game';
import { compactNumber } from '../../shared/format-number';

/** Durée de la petite annonce au-dessus de la grotte (« +1 pierre », « −2 pas »…). */
const TOAST_MS = 1100;
/** Au-dessous, le compteur de pas passe au rouge. */
const LOW_STEPS = 6;

const TOASTS: Readonly<Record<StepEvent['kind'], string>> = {
  walk: '',
  monster: 'Un monstre ! ',
  stones: "+1 pierre d'éveil",
  chest: 'Un coffre !',
  oil: 'Huile : +4 pas',
  treasure: 'Le trésor !',
};

type CellView = { readonly kind: 'dark' } | { readonly kind: 'lit'; readonly content: CellContent };

/** Expédition aux flambeaux : la grotte dans le noir, la torche, les pas, et le bilan. */
@Component({
  selector: 'app-torchlight-page',
  templateUrl: './torchlight-page.html',
  styleUrl: './torchlight-page.scss',
})
export class TorchlightPage implements OnDestroy {
  protected readonly torchlight = inject(Torchlight);
  private readonly navigation = inject(Navigation);
  private readonly sound = inject(Sound);
  private timer: ReturnType<typeof setTimeout> | null = null;

  protected readonly images = TORCHLIGHT_IMAGES;
  protected readonly columns = CAVE_COLUMNS;
  protected readonly rows = CAVE_ROWS;
  protected readonly floor = `url(${TORCHLIGHT_IMAGES.floor})`;
  protected readonly scene = pageBackground(TORCHLIGHT_IMAGES.background);
  protected readonly expedition = this.torchlight.expedition;
  protected readonly lowSteps = computed(() => (this.expedition()?.stepsLeft ?? 0) <= LOW_STEPS);
  protected readonly cells = computed(() => {
    const expedition = this.expedition();
    if (expedition === null) {
      return [];
    }
    return expedition.cells.map((content, index) => ({
      index,
      here: index === expedition.position,
      reachable: canStep(expedition, index),
      // Plus la case est loin du mineur, plus la lumière faiblit
      glow: Math.max(1 - distance(expedition.position, index) / (expedition.radius + 1), 0.25),
      view: viewOf(expedition, content, index),
    }));
  });
  protected readonly toast = signal<{ readonly text: string; readonly key: number } | null>(null);
  protected readonly hurt = signal(false);

  constructor() {
    let key = 0;
    effect(() => {
      const event = this.expedition()?.lastEvent ?? null;
      if (event !== null) {
        this.react(event, ++key);
      }
    });
  }

  protected start(): void {
    if (this.torchlight.start()) {
      this.sound.play('upgrade');
    }
  }

  protected step(index: number): void {
    this.torchlight.stepTo(index);
  }

  protected goBack(): void {
    this.torchlight.goBack();
    this.sound.play('artifact');
  }

  protected leave(): void {
    this.torchlight.leave();
  }

  protected replay(): void {
    this.torchlight.leave();
    this.start();
  }

  protected compact(value: number): string {
    return compactNumber(value);
  }

  protected back(): void {
    this.torchlight.leave();
    this.navigation.open('adventures');
  }

  ngOnDestroy(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
    }
  }

  private react(event: StepEvent, key: number): void {
    switch (event.kind) {
      case 'walk':
        this.sound.play('strike');
        return;
      case 'monster':
        this.sound.play('blast');
        this.hurt.set(true);
        this.show(`${TOASTS.monster}−${event.steps} pas, +1 pierre`, key);
        return;
      case 'treasure':
        this.sound.play('artifact');
        break;
      default:
        this.sound.play('shard');
    }
    this.show(TOASTS[event.kind], key);
  }

  private show(text: string, key: number): void {
    this.toast.set({ text, key });
    if (this.timer !== null) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => {
      this.toast.set(null);
      this.hurt.set(false);
    }, TOAST_MS);
  }
}

/** Hors de la torche, tout est noir : la grotte ne garde aucun souvenir, et les monstres y rôdent sans être vus. */
function viewOf(expedition: Expedition, content: CellContent, index: number): CellView {
  return isLit(expedition, index) ? { kind: 'lit', content } : { kind: 'dark' };
}
