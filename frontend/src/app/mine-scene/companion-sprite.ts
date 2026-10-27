import { AnimatedSprite, Assets, Container, Rectangle, Sprite, Texture } from 'pixi.js';

import type { CompanionId } from '../balance/companions';
import { COMPANION_ANIMATIONS, companionIconUrl } from '../loading/game-assets';
import type { Point } from './top-down-path';

/** Largeur du compagnon dans la scène : celle de l'élément HTML de la vue de côté (18 % de l'écran). */
const WIDTH = 130;
/** Images par seconde des bandes d'animation des compagnons, comme en CSS dans companion-buddy. */
const FPS = 12;
const TICKS_PER_SECOND = 60;
/** Il suit avec retard : temps pour rattraper un peu plus de la moitié de l'écart. */
const LAG_MS = 260;
/** Place derrière le héros, par rapport à ses pieds. */
const BEHIND_PX = 150;
const BELOW_PX = 12;
/** Petits bonds tant qu'il court derrière le héros (plus loin que MOVING_PX de sa place). */
const HOP_PX = 14;
const HOP_MS = 320;
const MOVING_PX = 6;
/** Une image fixe respire, comme en CSS. */
const BREATHE_MS = 3200;
const BREATHE = 0.03;

/**
 * Le compagnon actif dans la scène PixiJS, pour la vue du dessus : il suit le héros avec un peu de retard en
 * sautillant. Animé s'il a sa bande d'images, sinon en image fixe qui respire.
 */
export class CompanionSprite {
  readonly view = new Container();
  private body: Sprite | null = null;
  private shown: CompanionId | null = null;
  private position: Point = { x: 0, y: 0 };
  private elapsedMs = 0;

  async show(id: CompanionId | null): Promise<void> {
    this.shown = id;
    if (id === null) {
      this.replaceBody(null);
      return;
    }
    try {
      const body = await loadBody(id);
      if (this.shown !== id || this.view.destroyed) {
        body.destroy();
        return;
      }
      this.replaceBody(body);
    } catch (error) {
      console.error(`Compagnon ${id} introuvable dans la scène`, error);
      this.replaceBody(null);
    }
  }

  /** Pose le compagnon sans délai (changement de vue). */
  snap(heroFeet: Point, facing: 1 | -1): void {
    this.position = target(heroFeet, facing);
    this.layout(0);
  }

  update(elapsedMs: number, heroFeet: Point, facing: 1 | -1, reducedMotion: boolean): void {
    this.elapsedMs += elapsedMs;
    const goal = target(heroFeet, facing);
    const share = 1 - Math.exp(-elapsedMs / LAG_MS);
    const dx = (goal.x - this.position.x) * share;
    const dy = (goal.y - this.position.y) * share;
    this.position = { x: this.position.x + dx, y: this.position.y + dy };
    const moving = Math.hypot(goal.x - this.position.x, goal.y - this.position.y) > MOVING_PX;
    this.layout(moving && !reducedMotion ? Math.abs(Math.sin((this.elapsedMs / HOP_MS) * Math.PI)) * HOP_PX : 0);
    if (this.body && !(this.body instanceof AnimatedSprite) && !reducedMotion) {
      const breath = Math.sin((this.elapsedMs / BREATHE_MS) * Math.PI * 2) * BREATHE;
      const base = WIDTH / this.body.texture.width;
      this.body.scale.set(base * (1 + breath), base * (1 - breath));
    }
  }

  get feetY(): number {
    return this.position.y;
  }

  private layout(hop: number): void {
    this.view.position.set(this.position.x, this.position.y - hop);
  }

  private replaceBody(body: Sprite | null): void {
    this.body?.destroy();
    this.body = body;
    if (body) {
      this.view.addChild(body);
    }
  }
}

function target(heroFeet: Point, facing: 1 | -1): Point {
  return { x: heroFeet.x - facing * BEHIND_PX, y: heroFeet.y + BELOW_PX };
}

async function loadBody(id: CompanionId): Promise<Sprite> {
  const animation = COMPANION_ANIMATIONS[id];
  if (!animation) {
    const sprite = new Sprite(await Assets.load<Texture>(companionIconUrl(id)));
    sprite.anchor.set(0.5, 1);
    sprite.scale.set(WIDTH / sprite.texture.width);
    return sprite;
  }
  // Bande horizontale d'images de même taille, découpée comme le fait le CSS de companion-buddy
  const strip = await Assets.load<Texture>(animation.url);
  const frames = Array.from(
    { length: animation.frames },
    (_, index) => new Texture({ source: strip.source, frame: new Rectangle(index * animation.frameWidth, 0, animation.frameWidth, animation.frameHeight) }),
  );
  const sprite = new AnimatedSprite(frames);
  sprite.anchor.set(0.5, 1);
  sprite.scale.set(WIDTH / animation.frameWidth);
  sprite.animationSpeed = FPS / TICKS_PER_SECOND;
  sprite.play();
  return sprite;
}
