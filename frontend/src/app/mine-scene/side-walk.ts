// Le héros avance dans la galerie : quand un filon cède, il marche sur place pendant la fin du geste, le décor défile
// vers la gauche et le filon suivant arrive par la droite. Seul l'affichage bouge : les coups gardent leur cadence.

/** Pas du héros : ce que le décor défile pendant la fenêtre de marche, borné pour rester lisible. */
const WALK_SPEED_PX_PER_SECOND = 420;
const MIN_STEP_PX = 200;
const MAX_STEP_PX = 450;
const MS_PER_SECOND = 1000;

/** Distance parcourue en une marche. Plus le joueur frappe vite, plus le filon suivant pousse près. */
export function walkDistance(walkWindowMs: number): number {
  const reach = (WALK_SPEED_PX_PER_SECOND * walkWindowMs) / MS_PER_SECOND;
  return Math.min(Math.max(reach, MIN_STEP_PX), MAX_STEP_PX);
}

/**
 * Une marche d'un filon au suivant, à vitesse lissée. Elle dure la fenêtre de marche ; si le métronome reprend l'élan
 * avant (tick lent, Frénésie lancée en route), le héros est arrivé d'office : l'impact suivant n'attend jamais.
 */
export class SideWalk {
  private distance = 0;
  private elapsedMs = 0;
  private durationMs = 1;
  private active = false;
  /** Défilement total depuis le début de la partie, en pixels de scène. */
  private scrolledBefore = 0;

  get walking(): boolean {
    return this.active;
  }

  /** Avancée de 0 à 1, pour le sautillement et les pas. */
  get progress(): number {
    return this.active ? Math.min(this.elapsedMs / this.durationMs, 1) : 1;
  }

  /** Défilement du décor, en pixels de scène : il ne fait que croître, le héros ne revient jamais en arrière. */
  get scrolled(): number {
    return this.scrolledBefore + this.distance * easeInOut(this.progress);
  }

  /** Chemin qui reste au filon suivant avant d'arriver sous la pioche. */
  get remaining(): number {
    return this.distance * (1 - easeInOut(this.progress));
  }

  start(distance: number, durationMs: number): void {
    this.finish();
    this.distance = distance;
    this.elapsedMs = 0;
    this.durationMs = Math.max(durationMs, 1);
    this.active = true;
  }

  /** Avance la marche. `windingUp` : le métronome a repris l'élan, le héros doit être arrivé. */
  update(elapsedMs: number, windingUp: boolean): void {
    if (!this.active) {
      return;
    }
    this.elapsedMs += elapsedMs;
    if (windingUp || this.elapsedMs >= this.durationMs) {
      this.finish();
    }
  }

  /** Arrivée immédiate (fin de marche, changement de zone, réglage coupé). */
  finish(): void {
    if (!this.active) {
      return;
    }
    this.scrolledBefore += this.distance;
    this.distance = 0;
    this.active = false;
  }
}

function easeInOut(progress: number): number {
  return progress < 0.5 ? 2 * progress * progress : 1 - (-2 * progress + 2) ** 2 / 2;
}
