import { Container, Graphics, Text } from 'pixi.js';

const FLOATING_TEXT_DURATION_MS = 700;
const FLOATING_TEXT_RISE_PX = 110;
const FLOATING_TEXT_OFFSET_Y = -40;
const CHIP_COUNT = 7;
const CHIP_DURATION_MS = 450;
const CHIP_COLORS = [0x8a6a4f, 0x6e5440, 0xb0a090] as const;
const CHIP_GRAVITY_PX_PER_MS2 = 0.0025;

/** Un effet vit dans le temps et se retire tout seul une fois terminé. */
interface Effect {
  readonly view: Container;
  /** Avance l'effet et renvoie false quand il est fini. */
  update(elapsedMs: number): boolean;
}

class FloatingText implements Effect {
  readonly view: Text;
  private ageMs = 0;
  private readonly startY: number;

  constructor(x: number, y: number, label: string) {
    this.view = new Text({
      text: label,
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: 56,
        fontWeight: 'bold',
        fill: 0xffd34d,
        stroke: { color: 0x3b2410, width: 8 },
      },
    });
    this.view.anchor.set(0.5);
    this.view.position.set(x, y);
    this.startY = y;
  }

  update(elapsedMs: number): boolean {
    this.ageMs += elapsedMs;
    const progress = Math.min(this.ageMs / FLOATING_TEXT_DURATION_MS, 1);
    this.view.y = this.startY - FLOATING_TEXT_RISE_PX * progress;
    this.view.alpha = 1 - progress;
    return progress < 1;
  }
}

class RockChip implements Effect {
  readonly view: Graphics;
  private ageMs = 0;
  private readonly velocityX: number;
  private velocityY: number;

  constructor(x: number, y: number) {
    const radius = 4 + Math.random() * 5;
    const color = CHIP_COLORS[Math.floor(Math.random() * CHIP_COLORS.length)];
    this.view = new Graphics().circle(0, 0, radius).fill(color);
    this.view.position.set(x, y);
    // Éclats projetés vers le haut, en éventail
    this.velocityX = (Math.random() - 0.5) * 0.7;
    this.velocityY = -0.4 - Math.random() * 0.5;
  }

  update(elapsedMs: number): boolean {
    this.ageMs += elapsedMs;
    this.velocityY += CHIP_GRAVITY_PX_PER_MS2 * elapsedMs;
    this.view.x += this.velocityX * elapsedMs;
    this.view.y += this.velocityY * elapsedMs;
    this.view.alpha = Math.max(1 - this.ageMs / CHIP_DURATION_MS, 0);
    return this.ageMs < CHIP_DURATION_MS;
  }
}

/** Effets visuels d'un coup de pioche : éclats de roche et gain flottant. */
export class HitEffects {
  private readonly effects: Effect[] = [];

  constructor(private readonly layer: Container) {}

  spawn(x: number, y: number, gain: number): void {
    for (let i = 0; i < CHIP_COUNT; i++) {
      this.add(new RockChip(x, y));
    }
    this.add(new FloatingText(x, y + FLOATING_TEXT_OFFSET_Y, `+${gain}`));
  }

  update(elapsedMs: number): void {
    // Parcours à l'envers pour retirer pendant l'itération sans sauter d'élément
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const effect = this.effects[i];
      if (!effect.update(elapsedMs)) {
        this.effects.splice(i, 1);
        effect.view.destroy();
      }
    }
  }

  private add(effect: Effect): void {
    this.effects.push(effect);
    this.layer.addChild(effect.view);
  }
}
