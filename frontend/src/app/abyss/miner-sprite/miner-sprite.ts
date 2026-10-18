import { Component, computed, DestroyRef, effect, inject, input, signal } from '@angular/core';

/** Cadence de l'animation de frappe, comme dans la mine (12 images par seconde). */
const FRAME_MS = 1000 / 12;
const ANIMATION = 'pickaxe_swing';

interface Rect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

interface AtlasFrame {
  readonly frame: Rect;
  readonly spriteSourceSize: Rect;
  readonly sourceSize: { readonly w: number; readonly h: number };
}

interface Atlas {
  readonly frames: Readonly<Record<string, AtlasFrame>>;
  readonly animations: Readonly<Record<string, readonly string[]>>;
  readonly meta: { readonly image: string; readonly size: { readonly w: number; readonly h: number } };
}

/**
 * Le mineur qui frappe, en HTML plutôt qu'en PixiJS : le Puits n'a pas besoin de la scène de la mine.
 * Il relit l'atlas de la forme en cours et fait défiler ses images en arrière-plan d'un bloc.
 */
@Component({
  selector: 'app-miner-sprite',
  template: `
    @if (view(); as v) {
      <div class="box" [style.width.px]="v.boxW" [style.height.px]="v.boxH">
        <div
          class="frame"
          [style.left.px]="v.left"
          [style.top.px]="v.top"
          [style.width.px]="v.w"
          [style.height.px]="v.h"
          [style.background-image]="v.image"
          [style.background-size]="v.sheetSize"
          [style.background-position]="v.position"
        ></div>
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
    }
    .box {
      position: relative;
    }
    .frame {
      position: absolute;
      background-repeat: no-repeat;
    }
  `,
})
export class MinerSprite {
  /** Atlas TexturePacker de la frappe (le même que dans la mine). */
  readonly atlasUrl = input.required<string>();
  /** Hauteur affichée, en pixels CSS. */
  readonly height = input(160);

  private readonly atlas = signal<Atlas | null>(null);
  private readonly frameIndex = signal(0);

  protected readonly view = computed(() => {
    const atlas = this.atlas();
    if (atlas === null) {
      return null;
    }
    const names = atlas.animations[ANIMATION] ?? [];
    const name = names[this.frameIndex() % Math.max(names.length, 1)];
    const frame = atlas.frames[name];
    if (frame === undefined) {
      return null;
    }
    const scale = this.height() / frame.sourceSize.h;
    const base = this.atlasUrl().slice(0, this.atlasUrl().lastIndexOf('/') + 1);
    return {
      boxW: frame.sourceSize.w * scale,
      boxH: frame.sourceSize.h * scale,
      left: frame.spriteSourceSize.x * scale,
      top: frame.spriteSourceSize.y * scale,
      w: frame.frame.w * scale,
      h: frame.frame.h * scale,
      image: `url(${base}${atlas.meta.image})`,
      sheetSize: `${atlas.meta.size.w * scale}px ${atlas.meta.size.h * scale}px`,
      position: `${-frame.frame.x * scale}px ${-frame.frame.y * scale}px`,
    };
  });

  constructor() {
    const timer = setInterval(() => this.frameIndex.update((index) => index + 1), FRAME_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
    effect(() => void this.load(this.atlasUrl()));
  }

  private async load(url: string): Promise<void> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      this.atlas.set((await response.json()) as Atlas);
    } catch (error) {
      // Sans atlas, la descente se joue quand même : seul le mineur manque
      console.error(`Animation du mineur introuvable : ${url}`, error);
    }
  }
}
