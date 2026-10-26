import { Container, Graphics } from 'pixi.js';

import { ASTRE_STAGES } from '../balance/astre';

/** Taille de l'Astre dessiné, en pixels de scène. */
const RING_RADIUS = 56;
const POINT_RADIUS = 10;
const CORE_RADIUS = 16;
const OUTLINE_COLOR = 0x2a1c14;
/** Épaisseur et opacité (à pleine lueur) des couches de lueur autour du cercle. */
const HALO_LAYERS: readonly (readonly [number, number])[] = [
  [26, 0.12],
  [14, 0.22],
];
/** Il flotte en haut à gauche du mineur, derrière lui. */
const OFFSET_X = -150;
const OFFSET_Y = -360;
const TURN_MS = 9000;
const BOB_MS = 2400;
const BOB_PX = 10;
/** Éclat d'étoile lancé sur le filon. */
const SHOT_MS = 280;
const SHOT_RADIUS = 7;

interface Shot {
  readonly view: Graphics;
  readonly fromX: number;
  readonly fromY: number;
  readonly toX: number;
  readonly toY: number;
  elapsedMs: number;
  readonly onHit: () => void;
}

/**
 * L'Astre du Cœur derrière le mineur (choix de Théo, 26/10/2026) : un cercle à 5 pointes dessiné en code, qui tourne
 * en lévitant. Chaque pointe s'allume à un stade ; terne au début, il brille de plus en plus. Sa couleur est celle de
 * sa nourriture. Il lance des éclats d'étoile sur le filon, comme l'aurait fait un compagnon étoile.
 */
export class AstreView {
  readonly view = new Container();
  private readonly body = new Container();
  private readonly shape = new Graphics();
  private readonly halo = new Graphics();
  private readonly shots: Shot[] = [];
  private elapsedMs = 0;
  private color = 0xffd34d;
  private anchorX = 0;
  private anchorY = 0;

  constructor(private readonly shotLayer: Container) {
    this.halo.blendMode = 'add';
    this.body.addChild(this.halo, this.shape);
    this.view.addChild(this.body);
    this.view.visible = false;
  }

  /** Place l'Astre par rapport aux pieds du mineur. */
  place(minerX: number, feetY: number): void {
    this.anchorX = minerX + OFFSET_X;
    this.anchorY = feetY + OFFSET_Y;
    this.view.position.set(this.anchorX, this.anchorY);
  }

  set(stage: number, color: number): void {
    this.view.visible = stage > 0;
    this.color = color;
    const glow = 0.25 + (0.75 * stage) / ASTRE_STAGES;
    // Lueur posée sur le trait du cercle (pas un disque plein, qui noyait le dessin dans la paroi)
    this.halo.clear();
    for (const [width, alpha] of HALO_LAYERS) {
      this.halo.circle(0, 0, RING_RADIUS).stroke({ color, width, alpha: alpha * glow });
    }
    this.halo.circle(0, 0, CORE_RADIUS * 1.8).fill({ color, alpha: 0.25 * glow });
    this.shape.clear();
    // Liseré sombre sous le trait : le cercle reste lisible sur la paroi claire
    this.shape.circle(0, 0, RING_RADIUS).stroke({ color: OUTLINE_COLOR, width: 9, alpha: 0.55 });
    this.shape.circle(0, 0, RING_RADIUS).stroke({ color, width: 4, alpha: 0.5 + 0.5 * glow });
    this.shape.circle(0, 0, CORE_RADIUS).fill({ color, alpha: 0.5 + 0.5 * glow }).stroke({ color: OUTLINE_COLOR, width: 2.5, alpha: 0.55 });
    this.shape.circle(0, 0, CORE_RADIUS * 0.45).fill({ color: 0xffffff, alpha: 0.6 * glow });
    for (let index = 0; index < ASTRE_STAGES; index++) {
      const angle = -Math.PI / 2 + (index * 2 * Math.PI) / ASTRE_STAGES;
      const x = RING_RADIUS * Math.cos(angle);
      const y = RING_RADIUS * Math.sin(angle);
      const lit = index < stage;
      this.shape
        .circle(x, y, POINT_RADIUS)
        .fill({ color: lit ? color : OUTLINE_COLOR, alpha: 1 })
        .stroke({ color: lit ? 0xffffff : color, width: 2.5, alpha: lit ? 0.5 + 0.4 * glow : 0.6 });
      if (lit) {
        this.halo.circle(x, y, POINT_RADIUS * 2).fill({ color, alpha: 0.35 * glow });
      }
    }
  }

  /** Lance un éclat d'étoile vers le filon ; `onHit` est appelé à l'impact. */
  shoot(toX: number, toY: number, onHit: () => void): void {
    if (!this.view.visible) {
      return;
    }
    const view = new Graphics().circle(0, 0, SHOT_RADIUS).fill({ color: this.color }).circle(0, 0, SHOT_RADIUS * 2).fill({ color: this.color, alpha: 0.3 });
    view.blendMode = 'add';
    this.shotLayer.addChild(view);
    this.shots.push({ view, fromX: this.view.x, fromY: this.view.y, toX, toY, elapsedMs: 0, onHit });
  }

  update(deltaMs: number): void {
    this.elapsedMs += deltaMs;
    this.body.rotation = ((this.elapsedMs % TURN_MS) / TURN_MS) * Math.PI * 2;
    this.view.y = this.anchorY + BOB_PX * Math.sin(((this.elapsedMs % BOB_MS) / BOB_MS) * Math.PI * 2);
    for (const shot of [...this.shots]) {
      shot.elapsedMs += deltaMs;
      const progress = Math.min(shot.elapsedMs / SHOT_MS, 1);
      shot.view.position.set(shot.fromX + (shot.toX - shot.fromX) * progress, shot.fromY + (shot.toY - shot.fromY) * progress);
      if (progress >= 1) {
        shot.view.destroy();
        this.shots.splice(this.shots.indexOf(shot), 1);
        shot.onHit();
      }
    }
  }
}
