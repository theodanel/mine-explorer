import { AfterViewInit, Component, ElementRef, OnDestroy, viewChild } from '@angular/core';
import { AnimatedSprite, Application, Assets, Spritesheet } from 'pixi.js';

const SCENE_SIZE_PX = 600;
const MINER_ATLAS_URL = 'assets/characters/miner/atlas_pickaxe_swing_v2.json';
const MINER_ANIMATION = 'pickaxe_swing';
// Pixi avance d'animationSpeed frame par tick (60 ticks/s) : 0.2 donne les 12 fps prévus par l'atlas
const MINER_ANIMATION_SPEED = 0.2;

@Component({
  selector: 'app-mine-scene',
  templateUrl: './mine-scene.html',
  styleUrl: './mine-scene.scss',
})
export class MineScene implements AfterViewInit, OnDestroy {
  private readonly stage = viewChild.required<ElementRef<HTMLDivElement>>('stage');
  private readonly app = new Application();
  private initialized = false;
  private destroyed = false;

  async ngAfterViewInit(): Promise<void> {
    try {
      await this.app.init({ width: SCENE_SIZE_PX, height: SCENE_SIZE_PX, backgroundAlpha: 0 });
      this.initialized = true;
      // Le composant a pu être détruit pendant l'init : on libère l'app ici puisque ngOnDestroy ne l'a pas fait
      if (this.destroyed) {
        this.app.destroy(true);
        return;
      }
      this.stage().nativeElement.appendChild(this.app.canvas);

      const sheet = await Assets.load<Spritesheet>(MINER_ATLAS_URL);
      if (this.destroyed) {
        return;
      }
      this.app.stage.addChild(this.createMiner(sheet));
    } catch (error) {
      console.error('Impossible d\'afficher la scène de la mine', error);
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    if (this.initialized) {
      this.app.destroy(true);
    }
  }

  private createMiner(sheet: Spritesheet): AnimatedSprite {
    // L'ordre des frames vient du bloc animations de l'atlas, pas de l'ordre des clés de textures
    const frames = sheet.animations[MINER_ANIMATION];
    if (!frames) {
      throw new Error(`Animation "${MINER_ANIMATION}" absente de ${MINER_ATLAS_URL}`);
    }
    const miner = new AnimatedSprite(frames);
    miner.animationSpeed = MINER_ANIMATION_SPEED;
    miner.play();
    return miner;
  }
}
