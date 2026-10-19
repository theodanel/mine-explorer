import { Container, Graphics, Text } from 'pixi.js';

import { TIER_LABELS } from '../equipment/equipment.model';
import type { StrikeOutcome } from '../mining/mining';
import type { PowerGain } from './power-gain';

const FLOATING_TEXT_DURATION_MS = 700;
const FLOATING_TEXT_RISE_PX = 110;
const FLOATING_TEXT_OFFSET_Y = -40;
const TEXT_SIZE = 52;
const HIGHLIGHT_TEXT_SIZE = 68;
const REWARD_TEXT_SIZE = 38;
const DAMAGE_COLOR = 0xffffff;
/** Critique : bleu clair violet (pervenche) et plus gros, avec un petit coup de zoom : bien lisible sur la roche sombre (choix de Théo). */
const CRITICAL_COLOR = 0xa9b4ff;
const POP_SCALE = 1.6;
const POP_SHARE = 0.18;
const GOLD_COLOR = 0xffd34d;
const SHARD_COLOR = 0xc98bff;
/** Le butin s'affiche sous les dégâts pour ne pas les recouvrir. */
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
// Filon qui cède : une gerbe de gros éclats et un flash blanc, pour que chaque filon épuisé se sente
const BREAK_CHIPS = 18;
const BREAK_CHIP_SIZE = 1.8;
const BREAK_FLASH_RADIUS = 120;
const BREAK_FLASH_MS = 220;
const FLASH_COLOR = 0xfff4dc;
// Gain de Puissance : un anneau doré qui s'ouvre autour du mineur, des étincelles, puis ce qui a changé
const POWER_TEXT_MS = 1800;
const POWER_TEXT_SIZE = 64;
const POWER_LINE_SIZE = 40;
const POWER_LINE_GAP = 52;
const POWER_RING_MS = 650;
const POWER_RING_RADIUS = 210;
const POWER_RING_WIDTH = 10;
const POWER_SPARKS = 22;
const SPARK_COLORS = [0xffd34d, 0xfff1b0, 0xffb02e] as const;
const NUMBER_FORMAT = new Intl.NumberFormat('fr-FR');

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
    private readonly durationMs = FLOATING_TEXT_DURATION_MS,
  ) {
    this.view = new Text({
      text: label,
      style: {
        fontFamily: ['Lilita One', 'Segoe UI', 'Roboto', 'sans-serif'],
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
    const progress = Math.min(this.ageMs / this.durationMs, 1);
    this.view.y = this.startY - FLOATING_TEXT_RISE_PX * progress;
    // Les textes longs restent lisibles : ils ne s'effacent que sur leur dernier tiers
    this.view.alpha = this.durationMs > FLOATING_TEXT_DURATION_MS ? Math.min(1, 3 * (1 - progress)) : 1 - progress;
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

  constructor(x: number, y: number, size = 1, colors: readonly number[] = CHIP_COLORS) {
    const radius = (4 + Math.random() * 5) * size;
    const color = colors[Math.floor(Math.random() * colors.length)];
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

/** Disque ou anneau qui s'ouvre et s'efface : flash d'un filon qui cède, onde d'un gain de Puissance. */
class Pulse implements Effect {
  readonly view: Graphics;
  private ageMs = 0;

  constructor(
    x: number,
    y: number,
    radius: number,
    color: number,
    private readonly durationMs: number,
    ring: boolean,
  ) {
    this.view = ring ? new Graphics().circle(0, 0, radius).stroke({ color, width: POWER_RING_WIDTH }) : new Graphics().circle(0, 0, radius).fill(color);
    this.view.position.set(x, y);
    this.view.blendMode = 'add';
  }

  update(elapsedMs: number): boolean {
    this.ageMs += elapsedMs;
    const progress = Math.min(this.ageMs / this.durationMs, 1);
    this.view.scale.set(0.3 + 0.7 * progress);
    this.view.alpha = 1 - progress;
    return progress < 1;
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

    // Pas d'or affiché à chaque coup (demande de Théo) : seul le compteur du haut le montre
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

  /** Le filon cède : gros éclats en gerbe et flash blanc, en plus des effets du coup. */
  spawnRockBreak(x: number, y: number): void {
    this.add(new Pulse(x, y, BREAK_FLASH_RADIUS, FLASH_COLOR, BREAK_FLASH_MS, false));
    for (let i = 0; i < BREAK_CHIPS; i++) {
      this.add(new RockChip(x, y, BREAK_CHIP_SIZE));
    }
  }

  /** Le mineur vient de gagner en Puissance : onde dorée, étincelles, puis le gain et ce qui a changé. */
  spawnPowerGain(x: number, y: number, gain: PowerGain): void {
    this.add(new Pulse(x, y, POWER_RING_RADIUS, GOLD_COLOR, POWER_RING_MS, true));
    for (let i = 0; i < POWER_SPARKS; i++) {
      this.add(new RockChip(x, y, 1, SPARK_COLORS));
    }
    const label = `Puissance +${NUMBER_FORMAT.format(gain.to - gain.from)}`;
    this.add(new FloatingText(x, y, label, GOLD_COLOR, POWER_TEXT_SIZE, true, POWER_TEXT_MS));
    gain.lines.forEach((line, index) => {
      this.add(new FloatingText(x, y + POWER_LINE_GAP * (index + 1), line, DAMAGE_COLOR, POWER_LINE_SIZE, false, POWER_TEXT_MS));
    });
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
