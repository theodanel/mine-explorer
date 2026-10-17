import { Container, FillGradient, Graphics } from 'pixi.js';

import { EvolutionForm } from '../balance/balance';

/** Halo derrière le mineur : son intensité (0 à 1) et sa couleur. */
export interface AuraLook {
  readonly strength: number;
  readonly color: string;
}

const HEART_COLOR = '#ff9a3c';
/** Halo de la première étoile, puis ce que chaque étoile ajoute : plein à 5 étoiles. */
const FIRST_STAR_STRENGTH = 0.6;
const STRENGTH_PER_STAR = 0.1;
// Taille du halo, en pixels de scène, centré un peu au-dessus de la taille du mineur
const AURA_WIDTH = 360;
const AURA_HEIGHT = 400;
const AURA_CENTER_ABOVE_FEET = 150;
/** Respiration du halo : période et amplitude de la variation d'opacité. */
const PULSE_MS = 2400;
const PULSE_SHARE = 0.25;

/** Les étoiles de la Légende du Cœur du monde allument un halo de lave, de plus en plus vif. */
export function auraLook(form: EvolutionForm): AuraLook | null {
  if (form.stars === 0) {
    return null;
  }
  return {
    strength: Math.min(FIRST_STAR_STRENGTH + (form.stars - 1) * STRENGTH_PER_STAR, 1),
    color: HEART_COLOR,
  };
}

/** Halo dessiné derrière le mineur, qui respire doucement. */
export class MinerAura {
  private readonly graphics = new Graphics();
  private strength = 0;
  private elapsedMs = 0;

  constructor(layer: Container, x: number, feetY: number) {
    this.graphics.position.set(x, feetY - AURA_CENTER_ABOVE_FEET);
    this.graphics.visible = false;
    layer.addChild(this.graphics);
  }

  show(look: AuraLook | null): void {
    this.graphics.clear();
    this.graphics.visible = look !== null;
    if (look === null) {
      return;
    }
    this.strength = look.strength;
    const gradient = new FillGradient({
      type: 'radial',
      center: { x: 0.5, y: 0.5 },
      innerRadius: 0,
      outerCenter: { x: 0.5, y: 0.5 },
      outerRadius: 0.5,
      colorStops: [
        { offset: 0, color: look.color },
        { offset: 0.5, color: withAlpha(look.color, 0.6) },
        { offset: 1, color: withAlpha(look.color, 0) },
      ],
      textureSpace: 'local',
    });
    this.graphics.ellipse(0, 0, AURA_WIDTH / 2, AURA_HEIGHT / 2).fill(gradient);
    this.graphics.blendMode = 'add';
    this.update(0);
  }

  update(elapsedMs: number): void {
    if (!this.graphics.visible) {
      return;
    }
    this.elapsedMs = (this.elapsedMs + elapsedMs) % PULSE_MS;
    const pulse =
      1 - PULSE_SHARE * (0.5 + 0.5 * Math.sin((this.elapsedMs / PULSE_MS) * 2 * Math.PI));
    this.graphics.alpha = this.strength * pulse;
  }
}

/** Couleur #rrggbb rendue en rgba() avec l'opacité donnée, pour les arrêts du dégradé. */
function withAlpha(hex: string, alpha: number): string {
  const value = Number.parseInt(hex.slice(1), 16);
  return `rgba(${(value >> 16) & 0xff}, ${(value >> 8) & 0xff}, ${value & 0xff}, ${alpha})`;
}
