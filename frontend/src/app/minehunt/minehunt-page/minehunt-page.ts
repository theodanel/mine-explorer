import { Component, computed, effect, inject, signal } from '@angular/core';

import { Sound } from '../../audio/sound';
import { zoneMaterial } from '../../balance/balance';
import { HUNT_COLUMNS } from '../../balance/minehunt';
import { TIER_LABELS } from '../../equipment/equipment.model';
import { materialIconUrl, MINEHUNT_IMAGES, pageBackground } from '../../loading/game-assets';
import { Navigation } from '../../navigation/navigation';
import { Progression } from '../../progression/progression';
import { Minehunt } from '../minehunt';
import { HuntEvent } from '../minehunt-game';

const COMPACT = new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 });
/** Délai entre deux cases ouvertes en cascade : la paroi s'ouvre en vague plutôt que d'un bloc. */
const CASCADE_MS = 35;
const SHAKE_MS = 400;

/** Couleur de l'indice selon le nombre de grisous voisins, comme au démineur (adoucie). */
const HINT_COLORS = ['', '#7fd4ff', '#8ee08a', '#ffb05c', '#ff7a6a', '#e08aff', '#ff6a9a', '#ffd34d', '#ffffff'];

/** Chasse au filon : la paroi à creuser, le butin, et le bilan. */
@Component({
  selector: 'app-minehunt-page',
  templateUrl: './minehunt-page.html',
  styleUrl: './minehunt-page.scss',
})
export class MinehuntPage {
  protected readonly minehunt = inject(Minehunt);
  private readonly navigation = inject(Navigation);
  private readonly sound = inject(Sound);
  private readonly progression = inject(Progression);

  protected readonly images = MINEHUNT_IMAGES;
  protected readonly columns = HUNT_COLUMNS;
  protected readonly scene = pageBackground(MINEHUNT_IMAGES.background);
  protected readonly ore = computed(() => {
    const tier = zoneMaterial(this.progression.zone());
    return tier === null ? null : { icon: materialIconUrl(tier), label: TIER_LABELS[tier] };
  });
  protected readonly hunt = this.minehunt.hunt;
  protected readonly over = computed(() => {
    const hunt = this.hunt();
    return hunt !== null && hunt.status !== 'digging';
  });
  /** Ordre d'ouverture des cases du dernier coup, pour animer la cascade. */
  private readonly opening = signal<ReadonlyMap<number, number>>(new Map());
  protected readonly cells = computed(() => {
    const hunt = this.hunt();
    if (hunt === null) {
      return [];
    }
    const opening = this.opening();
    return hunt.cells.map((cell, index) => ({
      index,
      dug: cell.dug,
      content: cell.content,
      hint: cell.dug && cell.content === 'empty' && cell.around > 0 ? cell.around : null,
      hintColor: HINT_COLORS[cell.around],
      delay: (opening.get(index) ?? 0) * CASCADE_MS,
    }));
  });
  protected readonly durability = computed(() => {
    const hunt = this.hunt();
    return hunt === null ? [] : Array.from({ length: hunt.maxDurability }, (_, index) => index < hunt.durability);
  });
  protected readonly shake = signal(false);

  constructor() {
    effect(() => {
      const events = this.hunt()?.events ?? [];
      if (events.length > 0) {
        this.react(events);
      }
    });
  }

  protected start(): void {
    if (this.minehunt.start()) {
      this.opening.set(new Map());
      this.sound.play('upgrade');
    }
  }

  protected dig(index: number): void {
    this.minehunt.dig(index);
  }

  protected stop(): void {
    this.minehunt.stop();
    this.sound.play('artifact');
  }

  protected leave(): void {
    this.minehunt.leave();
  }

  protected replay(): void {
    this.minehunt.leave();
    this.start();
  }

  protected compact(value: number): string {
    return COMPACT.format(value);
  }

  protected back(): void {
    this.minehunt.leave();
    this.navigation.open('adventures');
  }

  private react(events: readonly HuntEvent[]): void {
    const order = new Map<number, number>();
    for (const event of events) {
      if (event.kind === 'dug') {
        order.set(event.index, order.size);
      }
    }
    this.opening.set(order);
    const found = events.find((event) => event.kind === 'dug' && event.content !== 'empty');
    if (events.some((event) => event.kind === 'gas')) {
      this.sound.play('blast');
      this.shake.set(true);
      setTimeout(() => this.shake.set(false), SHAKE_MS);
    } else if (found?.kind === 'dug' && found.content === 'chest') {
      this.sound.play('artifact');
    } else if (found !== undefined) {
      this.sound.play('shard');
    } else if (order.size > 0) {
      this.sound.play('strike');
    }
  }
}
