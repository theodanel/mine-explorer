import { Component, DestroyRef, DOCUMENT, ElementRef, inject, signal } from '@angular/core';

import { Sound } from '../audio/sound';
import { FlightKind, pieceCount, Point, RewardFlight } from './reward-flight';

/** Durée du vol d'une pièce, et écart entre deux départs : une traînée plutôt qu'un bloc. */
const FLIGHT_MS = 850;
const STAGGER_MS = 70;
/** Les pièces jaillissent d'abord autour du bouton, dans ce rayon (px), avant de filer au compteur. */
const SCATTER_PX = 60;

const ICONS: Readonly<Record<FlightKind, string>> = {
  coins: 'assets/ui/refonte/coin-small.webp',
  shards: 'assets/ui/refonte/shard-small.webp',
};
const LANDING_SOUNDS = { coins: 'sell', shards: 'shard' } as const;

interface Piece {
  readonly id: number;
  readonly icon: string;
  readonly x: number;
  readonly y: number;
  readonly dx: number;
  readonly dy: number;
  readonly sx: number;
  readonly sy: number;
  readonly delayMs: number;
}

/** Couche au-dessus de tout le jeu où volent les pièces et les éclats gagnés. */
@Component({
  selector: 'app-reward-flight-layer',
  templateUrl: './reward-flight-layer.html',
  styleUrl: './reward-flight-layer.scss',
  host: { 'aria-hidden': 'true' },
})
export class RewardFlightLayer {
  private readonly document = inject(DOCUMENT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly sound = inject(Sound);
  protected readonly pieces = signal<readonly Piece[]>([]);
  private nextId = 0;

  constructor() {
    const flight = inject(RewardFlight);
    flight.attach((kind, origin, amount) => this.launch(kind, origin, amount));
    inject(DestroyRef).onDestroy(() => flight.attach(null));
  }

  private launch(kind: FlightKind, origin: Point, amount: number): void {
    const target = this.document.querySelector<HTMLElement>(`[data-flight-target="${kind}"]`);
    if (target === null) {
      return;
    }
    if (this.document.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.land(kind, target);
      return;
    }
    // Coordonnées relatives à la couche : le conteneur du jeu peut décaler les éléments « fixed »
    const layer = this.host.nativeElement.getBoundingClientRect();
    const goal = target.getBoundingClientRect();
    const start = { x: origin.x - layer.left, y: origin.y - layer.top };
    const end = { x: goal.left + goal.width / 2 - layer.left, y: goal.top + goal.height / 2 - layer.top };
    const added = Array.from({ length: pieceCount(amount) }, (_, index) => ({
      id: ++this.nextId,
      icon: ICONS[kind],
      ...start,
      dx: end.x - start.x,
      dy: end.y - start.y,
      sx: (Math.random() - 0.5) * 2 * SCATTER_PX,
      sy: (Math.random() - 0.5) * 2 * SCATTER_PX,
      delayMs: index * STAGGER_MS,
    }));
    this.pieces.update((pieces) => [...pieces, ...added]);
    const ids = new Set(added.map((piece) => piece.id));
    setTimeout(() => this.land(kind, target), FLIGHT_MS);
    setTimeout(
      () => this.pieces.update((pieces) => pieces.filter((piece) => !ids.has(piece.id))),
      FLIGHT_MS + added.length * STAGGER_MS,
    );
  }

  /** Le compteur sursaute à l'arrivée de la première pièce, avec un petit son de gain. */
  private land(kind: FlightKind, target: HTMLElement): void {
    this.sound.play(LANDING_SOUNDS[kind]);
    const counter = target.closest<HTMLElement>('.resource') ?? target;
    counter.classList.remove('counter-bump');
    // Relance l'animation même si la précédente n'est pas finie
    void counter.offsetWidth;
    counter.classList.add('counter-bump');
    counter.addEventListener('animationend', () => counter.classList.remove('counter-bump'), { once: true });
  }
}
