import { AnimatedSprite, Assets, Container, Spritesheet } from 'pixi.js';

import { EvolutionForm } from '../balance/balance';

/** Aura sombre derrière le mineur : son intensité (0 à 1), sa taille et la vitesse de ses flammes. */
export interface AuraLook {
  readonly strength: number;
  readonly scale: number;
  readonly speed: number;
}

/** Boucle de flammes violet-noir, découpée de la vidéo par art-source/animations/decouper-aura.py. */
export const AURA_ATLAS_URL = 'assets/characters/effects/aura-sombre.json';
const AURA_ANIMATION = 'aura';
const MAX_STARS = 5;
/** À la première étoile, une aura plus petite et un peu transparente ; à 5 étoiles, pleine et vive. */
const FIRST_STAR_STRENGTH = 0.7;
const FIRST_STAR_SCALE = 0.95;
const FULL_SCALE = 1.25;
/** Les flammes s'agitent plus vite à chaque étoile (1 = la cadence de la vidéo). */
const FIRST_STAR_SPEED = 0.8;
const FULL_SPEED = 1.2;
/** Pixi avance d'une image par tick à 60 i/s quand animationSpeed vaut 1 : la boucle est à 12 i/s. */
const BASE_ANIMATION_SPEED = 12 / 60;
/** Le bas de l'anneau de flammes passe juste sous les pieds du mineur. */
const BELOW_FEET = 30;
/** Respiration : période et variation d'opacité. */
const PULSE_MS = 2400;
const PULSE_SHARE = 0.15;

/** Les étoiles de la Légende du Cœur du monde éveillent une aura sombre, plus grande et plus vive à chaque étoile. */
export function auraLook(form: EvolutionForm): AuraLook | null {
  if (form.stars === 0) {
    return null;
  }
  // 0 à la première étoile, 1 à la cinquième
  const progress = (Math.min(form.stars, MAX_STARS) - 1) / (MAX_STARS - 1);
  return {
    strength: FIRST_STAR_STRENGTH + (1 - FIRST_STAR_STRENGTH) * progress,
    scale: FIRST_STAR_SCALE + (FULL_SCALE - FIRST_STAR_SCALE) * progress,
    speed: FIRST_STAR_SPEED + (FULL_SPEED - FIRST_STAR_SPEED) * progress,
  };
}

/**
 * Anneau de flammes sombres animé derrière le mineur. L'atlas n'est téléchargé qu'à la première étoile : les autres
 * formes n'en ont pas besoin.
 */
export class MinerAura {
  private readonly root = new Container();
  private sprite: AnimatedSprite | null = null;
  private loading: Promise<void> | null = null;
  private look: AuraLook | null = null;
  private elapsedMs = 0;

  constructor(layer: Container, x: number, feetY: number) {
    this.root.position.set(x, feetY + BELOW_FEET);
    this.root.visible = false;
    layer.addChild(this.root);
  }

  show(look: AuraLook | null): void {
    this.look = look;
    if (look !== null && this.sprite === null) {
      this.loading ??= this.load();
    }
    this.apply();
  }

  update(elapsedMs: number): void {
    if (this.look === null || this.sprite === null) {
      return;
    }
    this.elapsedMs = (this.elapsedMs + elapsedMs) % PULSE_MS;
    const pulse = 1 - PULSE_SHARE * (0.5 + 0.5 * Math.sin((this.elapsedMs / PULSE_MS) * 2 * Math.PI));
    this.root.alpha = this.look.strength * pulse;
  }

  private async load(): Promise<void> {
    try {
      const sheet = await Assets.load<Spritesheet>(AURA_ATLAS_URL);
      const sprite = new AnimatedSprite(sheet.animations[AURA_ANIMATION]);
      sprite.anchor.set(0.5, 1);
      this.sprite = sprite;
      this.root.addChild(sprite);
      this.apply();
    } catch (error: unknown) {
      // Sans l'aura, le jeu reste jouable : on le signale sans bloquer la scène
      console.warn("Aura sombre non chargée : le mineur s'affiche sans", error);
      this.loading = null;
    }
  }

  private apply(): void {
    const look = this.look;
    const sprite = this.sprite;
    this.root.visible = look !== null && sprite !== null;
    if (look === null || sprite === null) {
      sprite?.stop();
      return;
    }
    sprite.scale.set(look.scale);
    sprite.animationSpeed = BASE_ANIMATION_SPEED * look.speed;
    sprite.play();
    this.update(0);
  }
}
