import { Assets, Container, Graphics, Sprite, Spritesheet, Texture, TilingSprite } from 'pixi.js';

import { TOP_DOWN_ASSETS } from '../loading/game-assets';
import type { Random } from '../shared/random';
import { CompanionSprite } from './companion-sprite';
import { Area, decorsIn } from './decor-field';
import { Bounds, Facing, followCamera, HeroWalk, nextStand, Point, stepDistance } from './top-down-path';

/** Cap de départ : vers le fond de la galerie. */
const START_HEADING = Math.PI / 2;
/**
 * Caméra qui suit : elle vise d'avance l'endroit où le héros va s'arrêter, pour que le filon suivant entre vite à
 * l'écran au lieu de passer sous le panneau du bas. Immobile tant que cet endroit reste à moins de 40 px de sa place.
 */
const CAMERA_DEAD_ZONE_PX = 40;
const CAMERA_SMOOTHING_MS = 300;
/** Caméra fixe : clairière où le héros se pose, autour de sa place de départ (le filon pousse à côté de lui). */
const FIXED_AREA = { left: 130, right: 130, up: 80, down: 100 } as const;
/** Tant que la marche n'est pas chargée, le héros glisse en faisant deux petits bonds. */
const WALK_HOPS = 2;
const WALK_HOP_PX = 18;
/** Une marche joue un cycle complet de pas (24 images, deux pas) : les pas suivent la distance parcourue. */
const WALK_CYCLES = 1;
/** Décors à 60 % de leur image (320 px au plus) : un peu plus petits que le rocher. */
const DECOR_SCALE = 0.6;
/** Marge de sol chargée hors de l'écran, pour que les décors n'apparaissent pas sous les yeux. */
const DECOR_MARGIN_PX = 200;
/** Trou laissé par un filon cassé : il s'efface en 2,5 s. */
const HOLE_SCALE = 0.55;
const HOLE_FADE_MS = 2500;
// Sol de secours, le temps que la texture de la zone charge : un brun de galerie uni, semé de taches
const FLOOR_TILE_PX = 256;
const FLOOR_COLOR = 0x5a4632;
const FLOOR_SPOTS: readonly { x: number; y: number; rx: number; ry: number; color: number }[] = [
  { x: 40, y: 50, rx: 34, ry: 12, color: 0x4c3a29 },
  { x: 170, y: 30, rx: 22, ry: 8, color: 0x6a553e },
  { x: 120, y: 120, rx: 44, ry: 15, color: 0x4c3a29 },
  { x: 220, y: 170, rx: 26, ry: 9, color: 0x4c3a29 },
  { x: 60, y: 200, rx: 18, ry: 6, color: 0x6a553e },
  { x: 190, y: 235, rx: 30, ry: 10, color: 0x6a553e },
];

/**
 * Prototype de la mine vue du dessus : le héros visible marche d'un filon au suivant pendant la fin du geste, la
 * caméra le suit (ou reste fixe), le compagnon le suit avec retard. Repère du monde : la place de départ du héros
 * est `home`, là où se tiennent ses pieds dans la vue de côté.
 */
export class TopDownView {
  readonly floor: TilingSprite;
  /** Le héros affiché : il recopie l'image du métronome invisible, en miroir quand il regarde à gauche. */
  readonly hero = new Sprite();
  readonly companion = new CompanionSprite();
  /** Sol du monde : décors semés et trous des filons cassés, toujours sous le héros et les rochers. */
  readonly ground = new Container();
  private readonly decorLayer = new Container();
  private readonly holeLayer = new Container();
  private readonly decors = new Map<string, Sprite>();
  private decorTextures: Texture[] = [];
  private holeTexture: Texture | null = null;
  private walkFrames: Texture[] = [];
  private readonly walk = new HeroWalk();
  private feet: Point;
  private camera: Point;
  private heading = START_HEADING;
  private facingSide: Facing = 1;
  private fixedCamera = false;

  constructor(
    private readonly home: Point,
    private readonly random: Random,
    floorTexture: Texture,
  ) {
    this.feet = home;
    this.camera = home;
    this.floor = new TilingSprite({ texture: floorTexture });
    this.ground.addChild(this.holeLayer, this.decorLayer);
  }

  /** Sol, décors, trou et marche de la zone 1 : chaque image manquante laisse simplement la version provisoire. */
  async loadVisuals(): Promise<void> {
    const [floor, decors, hole, walk] = await Promise.allSettled([
      Assets.load<Texture>(TOP_DOWN_ASSETS.floorUrl),
      Promise.all(TOP_DOWN_ASSETS.decorUrls.map((url) => Assets.load<Texture>(url))),
      Assets.load<Texture>(TOP_DOWN_ASSETS.holeUrl),
      Assets.load<Spritesheet>(TOP_DOWN_ASSETS.walk.atlasUrl),
    ]);
    if (this.floor.destroyed) {
      return;
    }
    if (floor.status === 'fulfilled') {
      this.floor.texture = floor.value;
    }
    if (decors.status === 'fulfilled') {
      this.decorTextures = decors.value;
    }
    if (hole.status === 'fulfilled') {
      this.holeTexture = hole.value;
    }
    if (walk.status === 'fulfilled') {
      this.walkFrames = walk.value.animations[TOP_DOWN_ASSETS.walk.animation] ?? [];
    }
    for (const result of [floor, decors, hole, walk]) {
      if (result.status === 'rejected') {
        console.warn('Visuel de la vue du dessus indisponible, version provisoire gardée', result.reason);
      }
    }
  }

  get heroFeet(): Point {
    return this.feet;
  }

  get facing(): Facing {
    return this.facingSide;
  }

  get walking(): boolean {
    return this.walk.walking;
  }

  /** Décalage du monde à l'écran : la caméra regarde `camera`, affichée à la place de départ du héros. */
  get worldOffset(): Point {
    return { x: this.home.x - this.camera.x, y: this.home.y - this.camera.y };
  }

  /** Le héros revient à sa place de départ, caméra centrée sur lui. */
  reset(fixedCamera: boolean): void {
    this.fixedCamera = fixedCamera;
    this.feet = this.home;
    this.camera = this.home;
    this.heading = START_HEADING;
    this.facingSide = 1;
    this.walk.stop(this.home);
    this.companion.snap(this.feet, this.facingSide);
  }

  /** Le filon a cédé : le suivant pousse à une distance que le héros parcourt dans `walkWindowMs`. */
  walkToNext(walkWindowMs: number): void {
    const next = nextStand(this.feet, this.heading, this.facingSide, stepDistance(walkWindowMs), this.random, this.fixedCamera ? this.fixedBounds() : null);
    this.heading = next.heading;
    this.facingSide = next.facing;
    this.walk.start(this.feet, next.spot, walkWindowMs);
  }

  /** Où sera le héros à la fin de sa marche : le filon suivant pousse devant cet endroit. */
  get destination(): Point {
    return this.walk.target;
  }

  update(elapsedMs: number, windingUp: boolean, reducedMotion: boolean): void {
    this.feet = this.walk.update(elapsedMs, windingUp);
    if (!this.fixedCamera) {
      this.camera = followCamera(this.camera, this.walk.target, CAMERA_DEAD_ZONE_PX, elapsedMs, CAMERA_SMOOTHING_MS);
    }
    this.companion.update(elapsedMs, this.feet, this.facingSide, reducedMotion);
  }

  /** Image de marche en cours, ou null quand le héros est à l'arrêt ou que la marche n'est pas chargée. */
  walkTexture(): Texture | null {
    if (!this.walk.walking || this.walkFrames.length === 0) {
      return null;
    }
    const index = Math.floor(this.walk.progress * WALK_CYCLES * this.walkFrames.length) % this.walkFrames.length;
    return this.walkFrames[index];
  }

  get walkScale(): number {
    return TOP_DOWN_ASSETS.walk.scale;
  }

  /** Un filon a cédé là : un trou reste au sol et s'efface. */
  leaveHole(at: Point): void {
    if (!this.holeTexture) {
      return;
    }
    const hole = new Sprite(this.holeTexture);
    hole.anchor.set(0.5, 0.6);
    hole.scale.set(HOLE_SCALE);
    hole.position.set(at.x, at.y);
    this.holeLayer.addChild(hole);
  }

  /** Hauteur du bond en cours, pendant la marche. */
  hop(reducedMotion: boolean): number {
    if (!this.walk.walking || reducedMotion || this.walkFrames.length > 0) {
      return 0;
    }
    return Math.abs(Math.sin(this.walk.progress * Math.PI * WALK_HOPS)) * WALK_HOP_PX;
  }

  /** Le sol couvre tout l'écran (`top` : bord haut de l'écran dans le repère de la scène) et défile avec le monde. */
  layoutFloor(top: number, width: number, height: number, margin: number): void {
    this.floor.position.set(-margin, top - margin);
    this.floor.setSize(width + margin * 2, height + margin * 2);
    const offset = this.worldOffset;
    this.floor.tilePosition.set(offset.x + margin, offset.y - top + margin);
    this.showDecors({
      left: -offset.x - DECOR_MARGIN_PX,
      top: top - offset.y - DECOR_MARGIN_PX,
      right: width - offset.x + DECOR_MARGIN_PX,
      bottom: top + height - offset.y + DECOR_MARGIN_PX,
    });
  }

  /** Les trous s'effacent puis disparaissent. */
  updateHoles(elapsedMs: number): void {
    for (const hole of [...this.holeLayer.children]) {
      hole.alpha -= elapsedMs / HOLE_FADE_MS;
      if (hole.alpha <= 0) {
        hole.destroy();
      }
    }
  }

  /** Crée les décors des cases qui entrent à l'écran, libère ceux qui en sortent. */
  private showDecors(area: Area): void {
    const placed = decorsIn(area, this.decorTextures.length);
    const kept = new Set(placed.map((decor) => decor.key));
    for (const [key, sprite] of this.decors) {
      if (!kept.has(key)) {
        sprite.destroy();
        this.decors.delete(key);
      }
    }
    for (const decor of placed) {
      if (this.decors.has(decor.key)) {
        continue;
      }
      const sprite = new Sprite(this.decorTextures[decor.kind]);
      sprite.anchor.set(0.5, 0.8);
      sprite.scale.set(DECOR_SCALE * decor.flip, DECOR_SCALE);
      sprite.position.set(decor.at.x, decor.at.y);
      this.decorLayer.addChild(sprite);
      this.decors.set(decor.key, sprite);
    }
  }

  private fixedBounds(): Bounds {
    return {
      minX: this.home.x - FIXED_AREA.left,
      maxX: this.home.x + FIXED_AREA.right,
      minY: this.home.y - FIXED_AREA.up,
      maxY: this.home.y + FIXED_AREA.down,
    };
  }
}

/** Tuile du sol provisoire, à transformer en texture par le moteur de rendu. */
export function drawFloorTile(): Graphics {
  const tile = new Graphics().rect(0, 0, FLOOR_TILE_PX, FLOOR_TILE_PX).fill(FLOOR_COLOR);
  for (const spot of FLOOR_SPOTS) {
    tile.ellipse(spot.x, spot.y, spot.rx, spot.ry).fill(spot.color);
  }
  return tile;
}
