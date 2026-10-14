import { Container, Graphics, Text } from 'pixi.js';

import { TIER_LABELS } from '../equipment/equipment.model';
import type { StrikeOutcome } from '../mining/mining';

const FLOATING_TEXT_DURATION_MS = 700;
const FLOATING_TEXT_RISE_PX = 110;
const FLOATING_TEXT_OFFSET_Y = -40;
const TEXT_SIZE = 52;
const HIGHLIGHT_TEXT_SIZE = 68;
const REWARD_TEXT_SIZE = 38;
const DAMAGE_COLOR = 0xffffff;
/** Critique : doré et plus gros, avec un petit coup de zoom, pour qu'on le sente passer. */
const CRITICAL_COLOR = 0xffd34d;
const POP_SCALE = 1.6;
const POP_SHARE = 0.18;
const GOLD_COLOR = 0xffd34d;
const SHARD_COLOR = 0xc98bff;
/** Le butin s'affiche sous les dégâts pour ne pas les recouvrir. */
const REWARD_TEXT_OFFSET_Y = 20;
const SHARD_TEXT_OFFSET_Y = 70;
const ORE_TEXT_OFFSET_Y = 120;
const ORE_COLOR = 0xe8c48a;
const ZONE_CLEARED_OFFSET_Y = -160;
const CHIP_COUNT = 7;
const CHIP_DURATION_MS = 450;
const CHIP_COLORS = [0x8a6a4f, 0x6e5440, 0xb0a090] as const;
const CHIP_GRAVITY_PX_PER_MS2 = 0.0025;
const BLAST_CHIPS = 14;
const BLAST_CHIPS_HUGE = 30;
const BLAST_COLOR = 0xff9a2e;
const BLAST_TEXT_SIZE = 76;
const BLAST_TEXT_SIZE_HUGE = 96;
const BLAST_LABEL_OFFSET_Y = -230;

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

  constructor(
    x: number,
    y: number,
    label: string,
    color: number,
    fontSize: number,
    private readonly pop = false,
  ) {
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
    if (this.pop) {
      const settle = Math.min(progress / POP_SHARE, 1);
      this.view.scale.set(POP_SCALE - (POP_SCALE - 1) * settle);
    }
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
    this.add(new FloatingText(x, y + FLOATING_TEXT_OFFSET_Y, damageLabel, damageColor, damageSize, outcome.critical));

    // L'or tombe à chaque coup : texte discret pour ne pas noyer les dégâts
    this.add(new FloatingText(x, y + REWARD_TEXT_OFFSET_Y, `+${outcome.reward.gold}`, GOLD_COLOR, REWARD_TEXT_SIZE));
    const shards = outcome.reward.shards;
    if (shards > 0) {
      const shardLabel = shards === 1 ? '+1 éclat' : `+${shards} éclats`;
      this.add(new FloatingText(x, y + SHARD_TEXT_OFFSET_Y, shardLabel, SHARD_COLOR, HIGHLIGHT_TEXT_SIZE));
    }
    if (outcome.ore !== null) {
      const oreLabel = `+${outcome.ore.amount} ${TIER_LABELS[outcome.ore.tier]}`;
      this.add(new FloatingText(x, y + ORE_TEXT_OFFSET_Y, oreLabel, ORE_COLOR, REWARD_TEXT_SIZE));
    }
    if (outcome.clearedZone !== null) {
      this.add(
        new FloatingText(x, y + ZONE_CLEARED_OFFSET_Y, `Zone ${outcome.clearedZone} terminée !`, GOLD_COLOR, HIGHLIGHT_TEXT_SIZE),
      );
    }
  }

  /** Explosion d'un sort : plus d'éclats de roche et un « BOUM » au-dessus des dégâts. */
  spawnBlast(x: number, y: number, outcome: StrikeOutcome, huge: boolean): void {
    const extraChips = huge ? BLAST_CHIPS_HUGE : BLAST_CHIPS;
    for (let i = 0; i < extraChips; i++) {
      this.add(new RockChip(x, y));
    }
    this.add(new FloatingText(x, y + BLAST_LABEL_OFFSET_Y, huge ? 'GRISOU !' : 'BOUM !', BLAST_COLOR, huge ? BLAST_TEXT_SIZE_HUGE : BLAST_TEXT_SIZE));
    this.spawn(x, y, outcome);
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
