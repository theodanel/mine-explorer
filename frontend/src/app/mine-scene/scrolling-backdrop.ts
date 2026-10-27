import { Container, Sprite, Texture } from 'pixi.js';

/** Trois copies couvrent toujours l'écran : celle qui sort à gauche, celle à l'écran, celle qui entre à droite. */
const COPIES = 3;

/**
 * Décor de la zone qui peut défiler vers la gauche. Le fond n'a pas été dessiné pour se répéter : il est mis bout à
 * bout, une copie sur deux retournée en miroir, pour que chaque raccord montre le même bord des deux côtés. Sans
 * défilement, seule la première copie est à l'écran, exactement comme un fond unique.
 */
export class ScrollingBackdrop {
  readonly container = new Container();
  private readonly copies: Sprite[] = [];
  private copyWidth = 0;
  private left = 0;
  private offset = 0;

  constructor() {
    for (let index = 0; index < COPIES; index++) {
      const copy = new Sprite();
      this.copies.push(copy);
      this.container.addChild(copy);
    }
  }

  set texture(texture: Texture) {
    for (const copy of this.copies) {
      copy.texture = texture;
    }
  }

  set tint(tint: number) {
    for (const copy of this.copies) {
      copy.tint = tint;
    }
  }

  /** Taille et place de la copie à l'écran, comme pour un fond unique. */
  layout(width: number, height: number, x: number, y: number): void {
    this.copyWidth = width;
    this.left = x;
    this.copies.forEach((copy, index) => {
      // Une copie sur deux en miroir : l'ancre à droite garde la même case qu'une copie normale
      const mirrored = index % 2 === 1;
      copy.anchor.set(mirrored ? 1 : 0, 0);
      copy.setSize(width, height);
      copy.scale.x = Math.abs(copy.scale.x) * (mirrored ? -1 : 1);
      copy.position.set(index * width, y);
    });
    this.place();
  }

  /** Défilement total vers la gauche, en pixels de scène. */
  scrollTo(scrolled: number): void {
    this.offset = scrolled;
    this.place();
  }

  private place(): void {
    if (this.copyWidth <= 0) {
      return;
    }
    // Le motif (copie normale + copie en miroir) se répète tous les deux fonds
    const period = this.copyWidth * 2;
    this.container.x = this.left - (((this.offset % period) + period) % period);
  }
}
