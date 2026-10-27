import type { Random } from '../shared/random';

// Déplacements de la vue du dessus : où pousse le filon suivant, comment le héros y marche, comment la caméra suit.
// Tout est en pixels de scène (720 de large), dans le repère du monde.

export interface Point {
  readonly x: number;
  readonly y: number;
}

/** Rectangle où le héros peut se poser, caméra fixe. */
export interface Bounds {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
}

/** 1 : le héros regarde à droite ; -1 : à gauche, frappe en miroir. */
export type Facing = 1 | -1;

/** Pas normal du héros : ce qu'il parcourt dans la fenêtre de marche, borné pour rester lisible. */
const WALK_SPEED_PX_PER_SECOND = 260;
const MIN_STEP_PX = 110;
const MAX_STEP_PX = 280;
const MS_PER_SECOND = 1000;
/** Cap général « toujours plus profond » : vers le bas de l'écran. */
const DEEPER = Math.PI / 2;
/** Écart maximal au cap général : le héros zigzague sans jamais revenir sur ses pas. */
const MAX_DEVIATION = 1.1;
/** Changement de direction maximal d'un filon au suivant. */
const MAX_TURN = 0.7;
/** Vue de trois quarts : un pas vers le fond paraît plus court qu'un pas de côté. */
const DEPTH_SQUASH = 0.6;
/** Sous ce déplacement horizontal, le héros garde son sens plutôt que de se retourner pour rien. */
const MIN_TURN_DX = 20;
/** Caméra fixe : essais de direction avant de viser le centre de la clairière. */
const FIXED_TRIES = 12;

/** Longueur du trajet vers le filon suivant. Plus le joueur frappe vite, plus le filon pousse près. */
export function stepDistance(walkWindowMs: number): number {
  const reach = (WALK_SPEED_PX_PER_SECOND * walkWindowMs) / MS_PER_SECOND;
  return Math.min(Math.max(reach, MIN_STEP_PX), MAX_STEP_PX);
}

export interface NextStand {
  readonly spot: Point;
  readonly heading: number;
  readonly facing: Facing;
}

/**
 * Emplacement du héros devant le filon suivant. Caméra qui suit : le cap dérive doucement autour de « plus profond ».
 * Caméra fixe : le héros reste dans la clairière (`bounds`), quitte à faire demi-tour.
 */
export function nextStand(from: Point, heading: number, facing: Facing, distance: number, random: Random, bounds: Bounds | null): NextStand {
  if (bounds === null) {
    const turned = heading + (random() * 2 - 1) * MAX_TURN;
    const clamped = Math.min(Math.max(turned, DEEPER - MAX_DEVIATION), DEEPER + MAX_DEVIATION);
    return stand(from, clamped, facing, distance);
  }
  for (let attempt = 0; attempt < FIXED_TRIES; attempt++) {
    // Les premiers essais restent proches du cap, les suivants s'autorisent à repartir dans tous les sens
    const spread = attempt < FIXED_TRIES / 2 ? MAX_TURN : Math.PI;
    const candidate = stand(from, heading + (random() * 2 - 1) * spread, facing, distance);
    if (isInside(candidate.spot, bounds)) {
      return candidate;
    }
  }
  const center = { x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2 };
  const towardCenter = Math.atan2((center.y - from.y) / DEPTH_SQUASH, center.x - from.x);
  const back = stand(from, towardCenter, facing, distance);
  return { ...back, spot: clampInside(back.spot, bounds) };
}

function stand(from: Point, heading: number, facing: Facing, distance: number): NextStand {
  const dx = Math.cos(heading) * distance;
  const dy = Math.sin(heading) * distance * DEPTH_SQUASH;
  const nextFacing: Facing = Math.abs(dx) < MIN_TURN_DX ? facing : dx > 0 ? 1 : -1;
  return { spot: { x: from.x + dx, y: from.y + dy }, heading, facing: nextFacing };
}

function isInside(point: Point, bounds: Bounds): boolean {
  return point.x >= bounds.minX && point.x <= bounds.maxX && point.y >= bounds.minY && point.y <= bounds.maxY;
}

function clampInside(point: Point, bounds: Bounds): Point {
  return {
    x: Math.min(Math.max(point.x, bounds.minX), bounds.maxX),
    y: Math.min(Math.max(point.y, bounds.minY), bounds.maxY),
  };
}

/**
 * Caméra amortie : immobile tant que le héros reste dans la zone morte, puis elle rattrape l'écart en douceur.
 * Un lissage exponentiel ne dépasse jamais sa cible : pas d'aller-retour de l'écran.
 */
export function followCamera(camera: Point, target: Point, deadZonePx: number, elapsedMs: number, smoothingMs: number): Point {
  const dx = target.x - camera.x;
  const dy = target.y - camera.y;
  const distance = Math.hypot(dx, dy);
  if (distance <= deadZonePx) {
    return camera;
  }
  const share = ((distance - deadZonePx) / distance) * (1 - Math.exp(-elapsedMs / smoothingMs));
  return { x: camera.x + dx * share, y: camera.y + dy * share };
}

/**
 * Marche du héros d'un filon au suivant, à vitesse lissée. Elle dure la fenêtre de marche ; si le métronome reprend
 * l'élan avant (tick lent, Frénésie lancée en route), le héros est posé d'office : l'impact suivant n'attend jamais.
 */
export class HeroWalk {
  private from: Point = { x: 0, y: 0 };
  private to: Point = { x: 0, y: 0 };
  private elapsedMs = 0;
  private durationMs = 0;
  private active = false;

  get walking(): boolean {
    return this.active;
  }

  /** Fin de la marche en cours, ou place du héros à l'arrêt. */
  get target(): Point {
    return this.to;
  }

  /** Avancée de 0 à 1, pour le sautillement. */
  get progress(): number {
    return this.active ? Math.min(this.elapsedMs / this.durationMs, 1) : 1;
  }

  start(from: Point, to: Point, durationMs: number): void {
    this.from = from;
    this.to = to;
    this.elapsedMs = 0;
    this.durationMs = Math.max(durationMs, 1);
    this.active = true;
  }

  /** Pose le héros à destination, sans marche (changement de vue, de zone). */
  stop(at: Point): void {
    this.to = at;
    this.active = false;
  }

  /** Position du héros après `elapsedMs`. `windingUp` : le métronome a repris l'élan, le héros doit être arrivé. */
  update(elapsedMs: number, windingUp: boolean): Point {
    if (!this.active) {
      return this.to;
    }
    this.elapsedMs += elapsedMs;
    if (windingUp || this.elapsedMs >= this.durationMs) {
      this.active = false;
      return this.to;
    }
    const eased = easeInOut(this.elapsedMs / this.durationMs);
    return { x: this.from.x + (this.to.x - this.from.x) * eased, y: this.from.y + (this.to.y - this.from.y) * eased };
  }
}

function easeInOut(progress: number): number {
  return progress < 0.5 ? 2 * progress * progress : 1 - (-2 * progress + 2) ** 2 / 2;
}
