import { Assets, Sprite, Texture } from 'pixi.js';

import { ADVENTURE_IMAGES, rockUrl } from '../loading/game-assets';

/** Hauteur du rocher dans la scène 720×1280 : un peu moins de la moitié du mineur. */
const ROCK_HEIGHT = 130;
/** La pioche tombe sur le premier tiers du rocher, pas en plein centre. */
const IMPACT_SHARE = 0.3;
/** Le rocher s'enfonce un peu dans le sol pour ne pas sembler posé dessus. */
const ROCK_SINK = 8;
// Retour visuel d'un coup : petit tremblement et éclaircissement bref
const HIT_MS = 140;
const HIT_SHAKE_PX = 5;
const HIT_TINT = 0xffe2c0;
// Filon épuisé : le rocher suivant surgit du sol
const RESPAWN_MS = 260;

export interface RockTop {
  /** Centre du haut du rocher, en pixels de scène. */
  readonly x: number;
  readonly y: number;
}

/**
 * Rocher que frappe le mineur : une image par zone, placée au point d'impact de la pioche.
 * Sans image (pas encore générée), il reste invisible et le jeu continue normalement.
 */
export class MineRock {
  readonly sprite = new Sprite();
  private impactX = 0;
  private floorY = 0;
  private hitMs = 0;
  private respawnMs = 0;
  /** Rocher demandé en dernier (zone, ou gardien de la zone) : une image arrivée trop tard est ignorée. */
  private shown = '';
  private readonly missingZones = new Set<number>();

  constructor(private readonly onMove: (top: RockTop) => void) {
    this.sprite.anchor.set(0.5, 1);
    this.sprite.visible = false;
  }

  /** Place le rocher sous la pioche de la forme en cours, pieds du mineur au niveau `floorY`. */
  place(impactX: number, floorY: number): void {
    this.impactX = impactX;
    this.floorY = floorY;
    this.layout();
  }

  /** Affiche le rocher de la zone, ou son gardien (le rocher gardien du Puits sans fond). */
  async show(zone: number, guardian = false): Promise<void> {
    const key = `${zone}${guardian ? '-gardien' : ''}`;
    this.shown = key;
    const url = guardian ? ADVENTURE_IMAGES.guardianRock : rockUrl(zone);
    try {
      const texture = await Assets.load<Texture>(url);
      if (this.shown !== key || this.sprite.destroyed) {
        return;
      }
      this.sprite.texture = texture;
      this.sprite.scale.set(ROCK_HEIGHT / texture.height);
      this.sprite.visible = true;
    } catch {
      // Image pas encore livrée : on le signale une fois par zone, sans bloquer la scène
      if (!this.missingZones.has(zone)) {
        this.missingZones.add(zone);
        console.info(`Rocher de la zone ${zone} absent (${url}) : seule la barre de vie s'affiche`);
      }
      this.sprite.visible = false;
    }
    this.layout();
  }

  hit(rockBroken: boolean): void {
    if (rockBroken) {
      this.respawnMs = RESPAWN_MS;
    } else {
      this.hitMs = HIT_MS;
    }
  }

  update(elapsedMs: number): void {
    this.hitMs = Math.max(this.hitMs - elapsedMs, 0);
    this.respawnMs = Math.max(this.respawnMs - elapsedMs, 0);
    const shake = this.hitMs > 0 ? Math.sin((this.hitMs / HIT_MS) * Math.PI * 4) * HIT_SHAKE_PX : 0;
    this.sprite.x = this.centerX() + shake;
    this.sprite.tint = this.hitMs > 0 ? HIT_TINT : 0xffffff;
    // Le nouveau rocher monte du sol : il part écrasé et reprend sa hauteur
    const growth = 1 - this.respawnMs / RESPAWN_MS;
    const base = this.sprite.texture.height > 0 ? ROCK_HEIGHT / this.sprite.texture.height : 1;
    this.sprite.scale.set(base * (0.6 + 0.4 * growth), base * growth);
  }

  private centerX(): number {
    return this.impactX + width(this.sprite) * (0.5 - IMPACT_SHARE);
  }

  private layout(): void {
    this.sprite.position.set(this.centerX(), this.floorY + ROCK_SINK);
    this.onMove({ x: this.centerX(), y: this.floorY + ROCK_SINK - ROCK_HEIGHT });
  }
}

/** Largeur affichée, ou celle d'un rocher carré tant que l'image manque. */
function width(sprite: Sprite): number {
  return sprite.visible && sprite.texture.height > 0 ? (sprite.texture.width / sprite.texture.height) * ROCK_HEIGHT : ROCK_HEIGHT;
}
