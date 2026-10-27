// Rythme du coup de pioche : l'animation de frappe est le métronome du minage, chaque passage sur l'image d'impact
// appelle mining.strike(). Ces chiffres ne changent pas avec la forme ni avec la vue.

/** Toutes les animations de frappe ont 23 images avec l'impact sur la même : la cadence ne change pas avec la forme. */
export const STRIKE_FRAME_COUNT = 23;
export const IMPACT_FRAME = 10;
/** Pixi avance une AnimatedSprite de `animationSpeed` image par tick, à 60 ticks par seconde. */
const TICKS_PER_SECOND = 60;
const MS_PER_SECOND = 1000;

/** Durée d'une image du métronome, en millisecondes. */
export function frameMs(animationSpeed: number): number {
  return MS_PER_SECOND / (animationSpeed * TICKS_PER_SECOND);
}

/** Temps entre deux impacts. */
export function strikeCycleMs(animationSpeed: number): number {
  return STRIKE_FRAME_COUNT * frameMs(animationSpeed);
}

/** Élan avant l'impact (images 0 à 9) : le héros le joue devant le filon, il doit donc être arrivé avant. */
export function windUpMs(animationSpeed: number): number {
  return IMPACT_FRAME * frameMs(animationSpeed);
}

/**
 * Fenêtre de marche vers le filon suivant : de l'impact qui casse le filon jusqu'à la reprise de l'élan, soit la fin du
 * geste (images 10 à 22) que le héros ne joue pas. 1,1 s au départ, 0,36 s à vitesse maximale.
 */
export function walkWindowMs(animationSpeed: number): number {
  return strikeCycleMs(animationSpeed) - windUpMs(animationSpeed);
}

/** Le métronome est dans l'élan : un héros encore en marche doit être posé devant le filon. */
export function isWindingUp(frame: number): boolean {
  return frame < IMPACT_FRAME;
}
