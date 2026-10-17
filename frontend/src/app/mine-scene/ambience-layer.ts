import { Assets, Container, Graphics, Sprite, Texture } from 'pixi.js';

import type { Random } from '../shared/random';
import {
  AMBIENCE_AREA,
  AmbiencePreset,
  Particle,
  Passer,
  passerDelay,
  spawnParticle,
  stepParticle,
  zoneAmbience,
  zonePasser,
} from './ambience';

const MS_PER_SECOND = 1000;
/** La silhouette reste au fond de la grotte : assombrie et un peu transparente. */
const PASSER_TINT = 0x8a7466;
const PASSER_ALPHA = 0.8;
/** Petit tangage de la silhouette pendant sa traversée : amplitude (pixels de scène) et période (secondes). */
const PASSER_BOB_PX = 10;
const PASSER_BOB_SECONDS = 1.6;

interface Drawn {
  particle: Particle;
  readonly graphics: Graphics;
}

/** Ce qui traverse en ce moment : la silhouette, son sens et son avancée. */
interface Crossing {
  readonly sprite: Sprite;
  readonly passer: Passer;
  readonly towardsRight: boolean;
  elapsed: number;
}

/**
 * Couche d'ambiance entre le décor et le rocher : des particules propres à chaque zone (poussière, braises, neige…)
 * et, de temps en temps, une silhouette qui traverse le fond de la grotte.
 */
export class AmbienceLayer {
  readonly container = new Container();
  private readonly particles = new Container();
  private drawn: Drawn[] = [];
  private preset: AmbiencePreset | null = null;
  private passer: Passer | null = null;
  private crossing: Crossing | null = null;
  private secondsToPasser = 0;
  private zoneToken = 0;

  constructor(private readonly random: Random) {
    this.container.addChild(this.particles);
  }

  /** Nouvelle zone : nouvelles particules, et une silhouette qui passera un peu plus tard. */
  showZone(zone: number): void {
    this.zoneToken++;
    const preset = zoneAmbience(zone);
    this.preset = preset;
    this.particles.removeChildren().forEach((child) => child.destroy());
    this.drawn = Array.from({ length: preset.count }, () => this.draw(spawnParticle(preset, this.random, true), preset));
    this.endCrossing();
    this.passer = zonePasser(zone);
    this.secondsToPasser = passerDelay(this.random, true);
  }

  update(elapsedMs: number): void {
    const seconds = elapsedMs / MS_PER_SECOND;
    const preset = this.preset;
    if (preset !== null) {
      for (const item of this.drawn) {
        const next = stepParticle(item.particle, preset, seconds, this.random);
        if (next.color !== item.particle.color || next.size !== item.particle.size) {
          this.paint(item.graphics, next, preset);
        }
        item.particle = next;
        item.graphics.position.set(next.x, next.y);
        item.graphics.alpha = next.alpha;
      }
    }
    this.updatePasser(seconds);
  }

  private draw(particle: Particle, preset: AmbiencePreset): Drawn {
    const graphics = new Graphics();
    this.paint(graphics, particle, preset);
    graphics.position.set(particle.x, particle.y);
    graphics.alpha = particle.alpha;
    // Les points lumineux s'additionnent au décor, comme une vraie lueur
    graphics.blendMode = 'add';
    this.particles.addChild(graphics);
    return { particle, graphics };
  }

  private paint(graphics: Graphics, particle: Particle, preset: AmbiencePreset): void {
    const stretch = preset.stretch ?? 1;
    graphics.clear().ellipse(0, 0, particle.size, particle.size * stretch).fill(particle.color);
  }

  private updatePasser(seconds: number): void {
    const crossing = this.crossing;
    if (crossing !== null) {
      crossing.elapsed += seconds;
      const progress = crossing.elapsed / crossing.passer.seconds;
      if (progress >= 1) {
        this.endCrossing();
        this.secondsToPasser = passerDelay(this.random, false);
        return;
      }
      const { width } = crossing.passer;
      const span = AMBIENCE_AREA.right - AMBIENCE_AREA.left + width;
      const travelled = AMBIENCE_AREA.left - width / 2 + span * progress;
      crossing.sprite.x = crossing.towardsRight ? travelled : AMBIENCE_AREA.right - travelled;
      crossing.sprite.y = crossing.passer.y + Math.sin((crossing.elapsed / PASSER_BOB_SECONDS) * 2 * Math.PI) * PASSER_BOB_PX;
      return;
    }
    if (this.passer === null) {
      return;
    }
    this.secondsToPasser -= seconds;
    if (this.secondsToPasser <= 0) {
      this.secondsToPasser = passerDelay(this.random, false);
      void this.startCrossing(this.passer);
    }
  }

  private async startCrossing(passer: Passer): Promise<void> {
    const token = this.zoneToken;
    let texture: Texture;
    try {
      texture = await Assets.load<Texture>(passer.url);
    } catch (error) {
      // Sans son image, la silhouette ne passe plus dans cette zone ; l'ambiance continue
      console.error(`Silhouette de fond introuvable : ${passer.url}`, error);
      this.passer = null;
      return;
    }
    // La zone a changé pendant le chargement : cette silhouette n'a plus rien à faire ici
    if (token !== this.zoneToken || this.crossing !== null) {
      return;
    }
    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5);
    const scale = passer.width / texture.width;
    const towardsRight = this.random() < 0.5;
    // L'image regarde vers la droite : on la retourne pour un passage vers la gauche
    sprite.scale.set(towardsRight ? scale : -scale, scale);
    sprite.tint = passer.tint ?? PASSER_TINT;
    sprite.alpha = PASSER_ALPHA;
    sprite.position.set(towardsRight ? -passer.width : AMBIENCE_AREA.right + passer.width, passer.y);
    // Derrière les particules : la silhouette est plus loin, au fond de la grotte
    this.container.addChildAt(sprite, 0);
    this.crossing = { sprite, passer, towardsRight, elapsed: 0 };
  }

  private endCrossing(): void {
    this.crossing?.sprite.destroy();
    this.crossing = null;
  }
}
