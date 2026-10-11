import { Container, Graphics, Text } from 'pixi.js';

import type { StrikeOutcome } from '../mining/mining';

const FLOATING_TEXT_DURATION_MS = 700;
const FLOATING_TEXT_RISE_PX = 110;
const FLOATING_TEXT_OFFSET_Y = -40;
const TEXT_SIZE = 52;
const HIGHLIGHT_TEXT_SIZE = 68;
const REWARD_TEXT_SIZE = 38;
const DAMAGE_COLOR = 0xffffff;
const CRITICAL_COLOR = 0xff7a2e;
const GOLD_COLOR = 0xffd34d;
const SHARD_COLOR = 0xc98bff;
/** Le butin s'affiche sous les dégâts pour ne pas les recouvrir. */
const REWARD_TEXT_OFFSET_Y = 20;
const SHARD_TEXT_OFFSET_Y = 70;
const ZONE_CLEARED_OFFSET_Y = -160;
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

  constructor(x: number, y: number, label: string, color: number, fontSize: number) {
    this.view = new Text({
      text: label,
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize,
        fontWeight: 'bold',
        fill: color,
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

/** Effets visuels d'un coup de pioche : éclats de roche, dégâts infligés et butin quand le rocher casse. */
export class HitEffects {
  private readonly effects: Effect[] = [];

  constructor(private readonly layer: Container) {}

  spawn(x: number, y: number, outcome: StrikeOutcome): void {
    for (let i = 0; i < CHIP_COUNT; i++) {
      this.add(new RockChip(x, y));
    }
    const damageLabel = outcome.critical ? `${outcome.damage} !` : String(outcome.damage);
    const damageColor = outcome.critical ? CRITICAL_COLOR : DAMAGE_COLOR;
    const damageSize = outcome.critical ? HIGHLIGHT_TEXT_SIZE : TEXT_SIZE;
    this.add(new FloatingText(x, y + FLOATING_TEXT_OFFSET_Y, damageLabel, damageColor, damageSize));

    // L'or tombe à chaque coup : texte discret pour ne pas noyer les dégâts
    this.add(new FloatingText(x, y + REWARD_TEXT_OFFSET_Y, `+${outcome.reward.gold}`, GOLD_COLOR, REWARD_TEXT_SIZE));
    const shards = outcome.reward.shards;
    if (shards > 0) {
      const shardLabel = shards === 1 ? '+1 éclat' : `+${shards} éclats`;
      this.add(new FloatingText(x, y + SHARD_TEXT_OFFSET_Y, shardLabel, SHARD_COLOR, HIGHLIGHT_TEXT_SIZE));
    }
    if (outcome.clearedZone !== null) {
      this.add(
        new FloatingText(x, y + ZONE_CLEARED_OFFSET_Y, `Zone ${outcome.clearedZone} terminée !`, GOLD_COLOR, HIGHLIGHT_TEXT_SIZE),
      );
    }
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
