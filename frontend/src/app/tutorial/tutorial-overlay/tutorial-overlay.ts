import { Component, computed, DestroyRef, DOCUMENT, effect, inject, signal } from '@angular/core';

import { AssetLoader } from '../../loading/asset-loader';
import { Tutorial } from '../tutorial';

/** L'écran de chargement reste au moins 1,2 s puis s'efface en 0,5 s : le tutoriel attend qu'il soit parti. */
const AFTER_SPLASH_MS = 1800;
/** Les éléments bougent un peu (badges, minuteurs) : la cible est remesurée régulièrement tant que l'étape est là. */
const REMEASURE_MS = 400;
/** Marge autour de l'élément, dans le cercle. */
const RING_PADDING_PX = 10;
/** La bulle passe sous la cible quand celle-ci est dans la moitié haute de l'écran. */
const HALF = 0.5;

interface Spot {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
}

/**
 * Tutoriel du premier lancement : l'écran est flouté et assombri, sauf un cercle autour de l'élément expliqué,
 * avec une bulle d'une phrase. Selon l'étape, un toucher n'importe où ou sur l'élément fait avancer.
 */
@Component({
  selector: 'app-tutorial-overlay',
  templateUrl: './tutorial-overlay.html',
  styleUrl: './tutorial-overlay.scss',
})
export class TutorialOverlay {
  protected readonly tutorial = inject(Tutorial);
  private readonly loader = inject(AssetLoader);
  private readonly document = inject(DOCUMENT);
  private readonly splashGone = signal(false);
  private readonly spot = signal<Spot | null>(null);

  protected readonly shown = computed(() => this.splashGone() && this.loader.state() === 'ready' && this.tutorial.visible() && this.spot() !== null);
  protected readonly targetStep = computed(() => this.tutorial.step()?.advance === 'target');
  protected readonly ring = computed(() => this.spot());
  /** Trou du flou : un dégradé radial transparent au centre, opaque autour. */
  protected readonly mask = computed(() => {
    const spot = this.spot();
    return spot === null ? 'none' : `radial-gradient(circle ${spot.radius}px at ${spot.x}px ${spot.y}px, transparent 96%, #000 100%)`;
  });
  protected readonly bubbleBelow = computed(() => (this.spot()?.y ?? 0) < (this.document.defaultView?.innerHeight ?? 0) * HALF);
  protected readonly bubbleTop = computed(() => {
    const spot = this.spot();
    if (spot === null) {
      return 0;
    }
    return this.bubbleBelow() ? spot.y + spot.radius + RING_PADDING_PX : spot.y - spot.radius - RING_PADDING_PX;
  });

  constructor() {
    const destroyRef = inject(DestroyRef);
    const splashTimer = setTimeout(() => this.splashGone.set(true), AFTER_SPLASH_MS);
    const measureTimer = setInterval(() => this.measure(), REMEASURE_MS);
    // Sur une étape « touche l'élément », les touchers ailleurs sont bloqués : seul l'élément ciblé répond
    const guard = (event: Event): void => this.guardClick(event);
    this.document.addEventListener('click', guard, true);
    destroyRef.onDestroy(() => {
      clearTimeout(splashTimer);
      clearInterval(measureTimer);
      this.document.removeEventListener('click', guard, true);
    });
    effect(() => {
      // Nouvelle étape, ou l'étape devient visible : on mesure tout de suite, sans attendre le minuteur
      this.tutorial.step();
      this.tutorial.visible();
      this.measure();
    });
  }

  /** Étape « touche n'importe où » : le fond reçoit le toucher. */
  protected onBackdropClick(): void {
    if (!this.targetStep()) {
      this.tutorial.advance();
    }
  }

  protected skip(event: Event): void {
    event.stopPropagation();
    this.tutorial.finish();
  }

  private guardClick(event: Event): void {
    if (!this.shown() || !this.targetStep() || !(event.target instanceof Node)) {
      return;
    }
    if (this.targetElement()?.contains(event.target)) {
      // Le toucher atteint l'élément (la forge forge vraiment), puis le tutoriel avance
      this.tutorial.advance();
      return;
    }
    if ((event.target as Element).closest?.('.tutorial-bubble')) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
  }

  private targetElement(): Element | null {
    const step = this.tutorial.step();
    return step === null ? null : this.document.querySelector(`[data-tuto="${step.target}"]`);
  }

  private measure(): void {
    const element = this.targetElement();
    if (element === null || !this.tutorial.visible()) {
      this.spot.set(null);
      return;
    }
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      this.spot.set(null);
      return;
    }
    const next: Spot = {
      x: Math.round(rect.left + rect.width / 2),
      y: Math.round(rect.top + rect.height / 2),
      radius: Math.round(Math.max(rect.width, rect.height) / 2 + RING_PADDING_PX),
    };
    const current = this.spot();
    if (current === null || current.x !== next.x || current.y !== next.y || current.radius !== next.radius) {
      this.spot.set(next);
    }
  }
}
