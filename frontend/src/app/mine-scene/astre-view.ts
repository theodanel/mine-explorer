import { Container, Graphics } from 'pixi.js';

import { ASTRE_STAGES } from '../balance/astre';
import { astreLayout, orbitStars } from '../heart-forge/astre-shape';

/** Taille de l'Astre dessiné, en pixels de scène. */
const RADIUS = 58;
const STAR_RADIUS = 18;
const STAR_INNER_RATIO = 0.3;
const UNLIT_RADIUS = 4;
const CORE_RADIUS = 22;
const ORBIT_RADIUS = 86;
const ORBIT_STAR_RADIUS = 6;
/** Étoiles à 4 branches, comme des scintillements. */
const STAR_BRANCHES = 4;
const WHITE = 0xffffff;
/** Il flotte en haut à gauche du mineur, derrière lui. */
const OFFSET_X = -150;
const OFFSET_Y = -360;
const TURN_MS = 14000;
const ORBIT_TURN_MS = 9000;
const BOB_MS = 2400;
const BOB_PX = 10;
/** Le cœur de l'Astre bat doucement. */
const PULSE_MS = 1600;
const PULSE_SCALE = 0.12;
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
 * L'Astre du Cœur derrière le mineur (choix de Théo, 26/10/2026), dessiné en code : une constellation de 5 étoiles qui
 * tourne en lévitant autour d'un cœur qui bat. Chaque stade allume une étoile et le trait qui la relie à sa voisine ; à
 * Supernova, l'étoile intérieure s'illumine. Chaque niveau de Constellation ajoute une petite étoile en orbite. Sa
 * couleur est celle de sa nourriture. Il lance des éclats d'étoile sur le filon, comme l'aurait fait un compagnon.
 */
export class AstreView {
  readonly view = new Container();
  private readonly body = new Container();
  private readonly orbit = new Container();
  private readonly glow = new Graphics();
  private readonly shape = new Graphics();
  private readonly core = new Graphics();
  private readonly orbitShape = new Graphics();
  private readonly shots: Shot[] = [];
  private elapsedMs = 0;
  private color = 0xffd34d;
  private anchorY = 0;

  constructor(private readonly shotLayer: Container) {
    this.glow.blendMode = 'add';
    this.core.blendMode = 'add';
    this.orbitShape.blendMode = 'add';
    this.body.addChild(this.glow, this.shape);
    this.orbit.addChild(this.orbitShape);
    this.view.addChild(this.orbit, this.body, this.core);
    this.view.visible = false;
  }

  /** Place l'Astre par rapport aux pieds du mineur. */
  place(minerX: number, feetY: number): void {
    this.anchorY = feetY + OFFSET_Y;
    this.view.position.set(minerX + OFFSET_X, this.anchorY);
  }

  set(stage: number, color: number, constellation: number): void {
    this.view.visible = stage > 0;
    this.color = color;
    // Terne au stade 1, éclatant à Supernova
    const shine = 0.3 + (0.7 * stage) / ASTRE_STAGES;
    const { points, lines } = astreLayout(stage, RADIUS);
    this.glow.clear();
    this.shape.clear();
    for (const { from, to } of lines) {
      this.glow.moveTo(from.x, from.y).lineTo(to.x, to.y).stroke({ color, width: 7, alpha: 0.12 * shine });
      this.shape.moveTo(from.x, from.y).lineTo(to.x, to.y).stroke({ color, width: 3, alpha: 0.6 + 0.4 * shine });
    }
    for (const point of points) {
      if (point.lit) {
        this.glow.circle(point.x, point.y, STAR_RADIUS * 1.5).fill({ color, alpha: 0.14 * shine });
        this.shape
          .star(point.x, point.y, STAR_BRANCHES, STAR_RADIUS, STAR_RADIUS * STAR_INNER_RATIO)
          .fill({ color })
          .circle(point.x, point.y, STAR_RADIUS * 0.3)
          .fill({ color: WHITE, alpha: 0.9 });
      } else {
        this.shape.circle(point.x, point.y, UNLIT_RADIUS).fill({ color, alpha: 0.35 });
      }
    }
    this.core
      .clear()
      .circle(0, 0, CORE_RADIUS * 1.6)
      .fill({ color, alpha: 0.1 * shine })
      .star(0, 0, STAR_BRANCHES, CORE_RADIUS, CORE_RADIUS * STAR_INNER_RATIO)
      .fill({ color, alpha: 0.5 + 0.5 * shine })
      .circle(0, 0, CORE_RADIUS * 0.3)
      .fill({ color: WHITE, alpha: shine });
    this.orbitShape.clear();
    for (const star of orbitStars(constellation, ORBIT_RADIUS)) {
      this.orbitShape
        .circle(star.x, star.y, ORBIT_STAR_RADIUS * 1.8)
        .fill({ color, alpha: 0.15 })
        .star(star.x, star.y, STAR_BRANCHES, ORBIT_STAR_RADIUS, ORBIT_STAR_RADIUS * STAR_INNER_RATIO)
        .fill({ color: WHITE });
    }
  }

  /** Lance un éclat d'étoile vers le filon ; `onHit` est appelé à l'impact. */
  shoot(toX: number, toY: number, onHit: () => void): void {
    if (!this.view.visible) {
      return;
    }
    const view = new Graphics()
      .circle(0, 0, SHOT_RADIUS * 2)
      .fill({ color: this.color, alpha: 0.3 })
      .star(0, 0, STAR_BRANCHES, SHOT_RADIUS * 1.6, SHOT_RADIUS * 0.5)
      .fill({ color: WHITE });
    view.blendMode = 'add';
    this.shotLayer.addChild(view);
    this.shots.push({ view, fromX: this.view.x, fromY: this.view.y, toX, toY, elapsedMs: 0, onHit });
  }

  update(deltaMs: number): void {
    this.elapsedMs += deltaMs;
    const turn = (period: number): number => ((this.elapsedMs % period) / period) * Math.PI * 2;
    this.body.rotation = turn(TURN_MS);
    this.orbit.rotation = -turn(ORBIT_TURN_MS);
    this.core.rotation = -turn(TURN_MS);
    this.core.scale.set(1 + PULSE_SCALE * Math.sin(turn(PULSE_MS)));
    this.view.y = this.anchorY + BOB_PX * Math.sin(turn(BOB_MS));
    for (const shot of [...this.shots]) {
      shot.elapsedMs += deltaMs;
      const progress = Math.min(shot.elapsedMs / SHOT_MS, 1);
      shot.view.position.set(shot.fromX + (shot.toX - shot.fromX) * progress, shot.fromY + (shot.toY - shot.fromY) * progress);
      shot.view.rotation = progress * Math.PI;
      if (progress >= 1) {
        shot.view.destroy();
        this.shots.splice(this.shots.indexOf(shot), 1);
        shot.onHit();
      }
    }
  }
}
