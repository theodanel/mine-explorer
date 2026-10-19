import { Container, FillGradient, Graphics } from 'pixi.js';

import { EvolutionForm } from '../balance/balance';

/** Aura sombre derrière le mineur : son intensité (0 à 1), sa taille et ses volutes de fumée. */
export interface AuraLook {
  readonly strength: number;
  readonly scale: number;
  readonly wisps: number;
}

const MAX_STARS = 5;
/** À la première étoile, une ombre discrète ; à 5 étoiles, l'aura pleine. */
const FIRST_STAR_STRENGTH = 0.75;
const FIRST_STAR_SCALE = 0.85;
const FULL_SCALE = 1.2;
const WISPS_PER_STAR = 4;
// Couleurs : un cœur d'ombre violet-noir, un liseré violet qui luit au bord, des volutes noires
const SHADOW_CORE = '#12041d';
const SHADOW_EDGE = '#3a0f5c';
const RIM_COLOR = '#9b4dff';
const WISP_COLOR = '#14041f';
// Taille de l'aura, en pixels de scène, centrée un peu au-dessus de la taille du mineur
const AURA_WIDTH = 360;
const AURA_HEIGHT = 420;
const AURA_CENTER_ABOVE_FEET = 150;
/** Respiration : période, et variation de taille et d'opacité (plus forte avec les étoiles). */
const PULSE_MS = 2200;
const PULSE_SCALE_SHARE = 0.08;
const PULSE_ALPHA_SHARE = 0.25;
/** Le liseré respire à contretemps de l'ombre. */
const RIM_ALPHA = 0.25;
/** Volutes : durée de vie, montée, balancement et taille. */
const WISP_LIFE_MS = 2600;
const WISP_RISE = 300;
const WISP_SWAY = 26;
const WISP_SWAY_MS = 900;
const WISP_RADIUS = 34;

/** Les étoiles de la Légende du Cœur du monde éveillent une aura sombre, plus grande et plus vive à chaque étoile. */
export function auraLook(form: EvolutionForm): AuraLook | null {
  if (form.stars === 0) {
    return null;
  }
  // 0 à la première étoile, 1 à la cinquième
  const progress = (Math.min(form.stars, MAX_STARS) - 1) / (MAX_STARS - 1);
  return {
    strength: FIRST_STAR_STRENGTH + (1 - FIRST_STAR_STRENGTH) * progress,
    scale: FIRST_STAR_SCALE + (FULL_SCALE - FIRST_STAR_SCALE) * progress,
    wisps: Math.min(form.stars, MAX_STARS) * WISPS_PER_STAR,
  };
}

interface Wisp {
  readonly graphics: Graphics;
  /** Décalage dans le cycle de vie, pour que les volutes ne montent pas toutes ensemble. */
  readonly offsetMs: number;
  /** Point de départ, en largeur d'aura (-0,5 à 0,5). */
  readonly startX: number;
}

/** Aura sombre dessinée derrière le mineur : une ombre qui respire, un liseré violet, et des volutes qui montent. */
export class MinerAura {
  private readonly root = new Container();
  private readonly shadow = new Graphics();
  private readonly rim = new Graphics();
  private readonly wispLayer = new Container();
  private wisps: Wisp[] = [];
  private look: AuraLook | null = null;
  private elapsedMs = 0;

  constructor(layer: Container, x: number, feetY: number) {
    this.root.position.set(x, feetY - AURA_CENTER_ABOVE_FEET);
    this.root.visible = false;
    this.rim.blendMode = 'add';
    this.root.addChild(this.shadow, this.rim, this.wispLayer);
    layer.addChild(this.root);
  }

  show(look: AuraLook | null): void {
    this.look = look;
    this.root.visible = look !== null;
    this.clearWisps();
    if (look === null) {
      return;
    }
    this.drawShadow();
    this.drawRim();
    this.wisps = Array.from({ length: look.wisps }, (_, index) => this.createWisp(index, look.wisps));
    this.update(0);
  }

  moveTo(x: number): void {
    this.root.x = x;
  }

  update(elapsedMs: number): void {
    const look = this.look;
    if (look === null) {
      return;
    }
    this.elapsedMs += elapsedMs;
    const phase = Math.sin((this.elapsedMs / PULSE_MS) * 2 * Math.PI);
    const breath = 0.5 + 0.5 * phase;
    this.root.scale.set(look.scale * (1 + PULSE_SCALE_SHARE * look.strength * breath));
    this.shadow.alpha = look.strength * (1 - PULSE_ALPHA_SHARE * (1 - breath));
    this.rim.alpha = RIM_ALPHA * look.strength * (1 - breath * 0.6);
    for (const wisp of this.wisps) {
      this.moveWisp(wisp, look.strength);
    }
  }

  private drawShadow(): void {
    this.shadow.clear();
    const gradient = radial([
      { offset: 0, color: withAlpha(SHADOW_CORE, 0.95) },
      { offset: 0.45, color: withAlpha(SHADOW_CORE, 0.8) },
      { offset: 0.75, color: withAlpha(SHADOW_EDGE, 0.45) },
      { offset: 1, color: withAlpha(SHADOW_EDGE, 0) },
    ]);
    this.shadow.ellipse(0, 0, AURA_WIDTH / 2, AURA_HEIGHT / 2).fill(gradient);
  }

  private drawRim(): void {
    this.rim.clear();
    const gradient = radial([
      { offset: 0.55, color: withAlpha(RIM_COLOR, 0) },
      { offset: 0.8, color: withAlpha(RIM_COLOR, 0.8) },
      { offset: 1, color: withAlpha(RIM_COLOR, 0) },
    ]);
    this.rim.ellipse(0, 0, AURA_WIDTH / 2, AURA_HEIGHT / 2).fill(gradient);
  }

  private createWisp(index: number, count: number): Wisp {
    // Volute floue : un disque dont l'ombre se dissout vers le bord
    const graphics = new Graphics().circle(0, 0, WISP_RADIUS).fill(
      radial([
        { offset: 0, color: withAlpha(WISP_COLOR, 0.9) },
        { offset: 1, color: withAlpha(WISP_COLOR, 0) },
      ]),
    );
    this.wispLayer.addChild(graphics);
    // Réparties régulièrement dans le temps et en largeur, mélangées par un pas premier pour éviter les colonnes
    return {
      graphics,
      offsetMs: (index / count) * WISP_LIFE_MS,
      startX: (((index * 7) % count) / count - 0.5) * 0.7,
    };
  }

  /** Une volute naît en bas de l'aura, monte en se balançant, grossit et s'efface. */
  private moveWisp(wisp: Wisp, strength: number): void {
    const age = ((this.elapsedMs + wisp.offsetMs) % WISP_LIFE_MS) / WISP_LIFE_MS;
    const sway = Math.sin((this.elapsedMs + wisp.offsetMs) / WISP_SWAY_MS) * WISP_SWAY;
    wisp.graphics.position.set(wisp.startX * AURA_WIDTH + sway, AURA_HEIGHT * 0.4 - age * WISP_RISE);
    wisp.graphics.scale.set(0.5 + age);
    // Apparaît puis s'efface : un arc de sinus sur la vie de la volute
    wisp.graphics.alpha = 0.7 * strength * Math.sin(age * Math.PI);
  }

  private clearWisps(): void {
    for (const wisp of this.wisps) {
      wisp.graphics.destroy();
    }
    this.wisps = [];
  }
}

function radial(colorStops: { offset: number; color: string }[]): FillGradient {
  return new FillGradient({
    type: 'radial',
    center: { x: 0.5, y: 0.5 },
    innerRadius: 0,
    outerCenter: { x: 0.5, y: 0.5 },
    outerRadius: 0.5,
    colorStops,
    textureSpace: 'local',
  });
}

/** Couleur #rrggbb rendue en rgba() avec l'opacité donnée, pour les arrêts du dégradé. */
function withAlpha(hex: string, alpha: number): string {
  const value = Number.parseInt(hex.slice(1), 16);
  return `rgba(${(value >> 16) & 0xff}, ${(value >> 8) & 0xff}, ${value & 0xff}, ${alpha})`;
}
