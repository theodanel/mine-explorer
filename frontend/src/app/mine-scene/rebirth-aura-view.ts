import { Container, Graphics } from 'pixi.js';

import type { RebirthAura } from '../rebirth/rebirth-visuals';

/** Halo derrière le mineur : des ellipses superposées de plus en plus pâles, comme une lueur douce. */
const LAYERS = 6;
const RADIUS_X = 150;
const RADIUS_Y = 210;
/** Le halo grandit et s'éclaire avec l'intensité du palier. */
const MIN_SCALE = 0.75;
const MAX_ALPHA = 0.55;
const PULSE_MS = 1800;
const PULSE_SHARE = 0.12;
/** Le halo entoure le corps du mineur, au-dessus de ses pieds. */
const ABOVE_FEET = 170;

/**
 * Lueur de la Renaissance derrière le mineur (25/10/2026, « une réelle montée visuelle de puissance ») : sa couleur
 * change toutes les 3 renaissances et elle grandit entre deux. Pas de flammes : Théo trouvait celles de l'aura sombre
 * moches. Invisible avant la première renaissance.
 */
export class RebirthAuraView {
  readonly view = new Container();
  private readonly glow = new Graphics();
  private intensity = 0;
  private elapsedMs = 0;

  constructor() {
    this.view.addChild(this.glow);
    this.view.visible = false;
  }

  /** Place le halo sur le mineur, d'après la position de ses pieds. */
  place(x: number, feetY: number): void {
    this.view.position.set(x, feetY - ABOVE_FEET);
  }

  set(aura: RebirthAura | null): void {
    this.glow.clear();
    this.view.visible = aura !== null;
    if (aura === null) {
      return;
    }
    this.intensity = aura.intensity;
    for (let layer = LAYERS; layer >= 1; layer--) {
      const share = layer / LAYERS;
      this.glow.ellipse(0, 0, RADIUS_X * share, RADIUS_Y * share).fill({ color: aura.color, alpha: (MAX_ALPHA / LAYERS) * (1.2 - share) });
    }
  }

  update(deltaMs: number): void {
    if (!this.view.visible) {
      return;
    }
    this.elapsedMs = (this.elapsedMs + deltaMs) % PULSE_MS;
    const pulse = 1 + PULSE_SHARE * Math.sin((this.elapsedMs / PULSE_MS) * Math.PI * 2);
    this.view.scale.set((MIN_SCALE + (1 - MIN_SCALE) * this.intensity) * pulse);
    this.view.alpha = 0.6 + 0.4 * this.intensity;
  }
}
