import { Component, computed, DestroyRef, DOCUMENT, effect, inject, signal } from '@angular/core';

import { AssetLoader } from '../../loading/asset-loader';
import { Navigation } from '../../navigation/navigation';
import { Overlays } from '../../shared/overlays';
import { Reveal } from '../reveal';

/** L'écran de chargement reste au moins 1,2 s puis s'efface en 0,5 s : la bulle attend qu'il soit parti. */
const AFTER_SPLASH_MS = 1800;
/** Les éléments bougent un peu (badges, minuteurs, animation d'entrée) : la cible est remesurée régulièrement. */
const REMEASURE_MS = 300;
/** La bulle s'efface d'elle-même : elle accompagne le jeu, elle ne le bloque pas. */
const HINT_MS = 7000;
const RING_PADDING_PX = 8;
/** La bulle passe sous la cible quand celle-ci est dans la moitié haute de l'écran. */
const HALF = 0.5;

/** Cadre autour de l'élément, marge comprise. */
interface Spot {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Bulle d'une ligne à côté de l'élément qui vient d'apparaître, avec un cadre qui pulse autour.
 * Rien n'est flouté ni bloqué : un toucher n'importe où la ferme et fait aussi son action normale.
 */
@Component({
  selector: 'app-reveal-hint',
  templateUrl: './reveal-hint.html',
  styleUrl: './reveal-hint.scss',
})
export class RevealHint {
  protected readonly reveal = inject(Reveal);
  private readonly loader = inject(AssetLoader);
  private readonly navigation = inject(Navigation);
  private readonly overlays = inject(Overlays);
  private readonly document = inject(DOCUMENT);
  private readonly splashGone = signal(false);
  private readonly spot = signal<Spot | null>(null);

  /** Écran libre seulement : jamais devant l'objet forgé, une fenêtre ou une page du menu. */
  private readonly screenFree = computed(
    () =>
      this.splashGone() &&
      this.loader.state() === 'ready' &&
      this.navigation.page() === 'mine' &&
      !this.overlays.userDialogOpen() &&
      this.overlays.shown() === null,
  );
  protected readonly shown = computed(() => this.screenFree() && this.reveal.hint() !== null && this.spot() !== null);
  protected readonly ring = computed(() => this.spot());
  protected readonly below = computed(() => {
    const spot = this.spot();
    return spot !== null && spot.top + spot.height / 2 < (this.document.defaultView?.innerHeight ?? 0) * HALF;
  });
  protected readonly bubbleTop = computed(() => {
    const spot = this.spot();
    if (spot === null) {
      return 0;
    }
    return this.below() ? spot.top + spot.height + RING_PADDING_PX : spot.top - RING_PADDING_PX;
  });

  constructor() {
    const destroyRef = inject(DestroyRef);
    const splashTimer = setTimeout(() => this.splashGone.set(true), AFTER_SPLASH_MS);
    const measureTimer = setInterval(() => this.measure(), REMEASURE_MS);
    // Capture sans arrêter l'évènement : le toucher ferme la bulle et atteint quand même le jeu
    const dismiss = (): void => {
      if (this.shown()) {
        this.reveal.dismissHint();
      }
    };
    this.document.addEventListener('pointerdown', dismiss, true);
    destroyRef.onDestroy(() => {
      clearTimeout(splashTimer);
      clearInterval(measureTimer);
      this.document.removeEventListener('pointerdown', dismiss, true);
    });

    effect(() => {
      this.reveal.hint();
      this.screenFree();
      this.measure();
    });
    // Chaque bulle reste quelques secondes à l'écran, puis laisse la place à la suivante
    effect((onCleanup) => {
      const hint = this.reveal.hint();
      if (hint === null || !this.shown()) {
        return;
      }
      const timer = setTimeout(() => this.reveal.dismissHint(), HINT_MS);
      onCleanup(() => clearTimeout(timer));
    });
  }

  private measure(): void {
    const hint = this.reveal.hint();
    const element = hint === null ? null : this.document.querySelector(`[data-reveal="${hint.id}"]`);
    const rect = element?.getBoundingClientRect();
    if (!rect || (rect.width === 0 && rect.height === 0)) {
      this.spot.set(null);
      return;
    }
    const next: Spot = {
      left: Math.round(rect.left - RING_PADDING_PX),
      top: Math.round(rect.top - RING_PADDING_PX),
      width: Math.round(rect.width + 2 * RING_PADDING_PX),
      height: Math.round(rect.height + 2 * RING_PADDING_PX),
    };
    const current = this.spot();
    if (current === null || current.left !== next.left || current.top !== next.top || current.width !== next.width || current.height !== next.height) {
      this.spot.set(next);
    }
  }
}
