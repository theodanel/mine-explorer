import { AfterViewInit, Component, ElementRef, inject, OnDestroy, viewChild } from '@angular/core';
import { AnimatedSprite, Application, Assets, Container, Sprite, Spritesheet, Texture, Ticker } from 'pixi.js';

import { Wallet } from '../wallet/wallet';
import { hasCrossedFrame } from './frame-crossing';
import { HitEffects } from './hit-effects';

// Résolution logique portrait 9:16, mise à l'échelle de l'écran en CSS
const SCENE_WIDTH = 720;
const SCENE_HEIGHT = 1280;
// Couleur visible le temps que le fond charge, proche de ses tons
const CAVE_COLOR = 0x24170f;
const BACKGROUND_URL = 'assets/backgrounds/zone1.png';
// Le sol plat du fond va d'environ 60 % à 72 % de la hauteur : les pieds se posent au milieu
const MINER_FEET_Y = 850;

const MINER_ATLAS_URL = 'assets/characters/miner/atlas_pickaxe_swing_v2.json';
const MINER_ANIMATION = 'pickaxe_swing';
// Pixi avance d'animationSpeed frame par tick (60 ticks/s) : 0.2 donne les 12 fps prévus par l'atlas
const MINER_ANIMATION_SPEED = 0.2;
// Réduit pour laisser la place aux menus autour du perso
const MINER_SCALE = 0.65;
// Les décalages ci-dessous sont en pixels de la frame source, multipliés par MINER_SCALE à l'usage
// La pioche élargit la frame vers la droite : on décale pour centrer le corps, pas la frame
const MINER_BODY_OFFSET_X = 40;
// Frame où la pioche touche le sol, repérée sur la spritesheet
const IMPACT_FRAME = 10;
// Pointe de la pioche à l'impact, par rapport à l'ancre (bas-centre) du mineur
const IMPACT_OFFSET = { x: 118, y: -41 } as const;

const GAIN_PER_HIT = 1;

@Component({
  selector: 'app-mine-scene',
  templateUrl: './mine-scene.html',
  styleUrl: './mine-scene.scss',
})
export class MineScene implements AfterViewInit, OnDestroy {
  private readonly stage = viewChild.required<ElementRef<HTMLDivElement>>('stage');
  private readonly wallet = inject(Wallet);
  private readonly app = new Application();
  private initialized = false;
  private destroyed = false;

  async ngAfterViewInit(): Promise<void> {
    try {
      await this.app.init({ width: SCENE_WIDTH, height: SCENE_HEIGHT, background: CAVE_COLOR });
      this.initialized = true;
      // Le composant a pu être détruit pendant l'init : on libère l'app ici puisque ngOnDestroy ne l'a pas fait
      if (this.destroyed) {
        this.destroyApp();
        return;
      }
      this.mountCanvas();

      const [background, sheet] = await Promise.all([
        Assets.load<Texture>(BACKGROUND_URL),
        Assets.load<Spritesheet>(MINER_ATLAS_URL),
      ]);
      if (this.destroyed) {
        return;
      }
      this.app.stage.addChild(createBackground(background));
      this.startMining(sheet);
    } catch (error) {
      console.error('Impossible d\'afficher la scène de la mine', error);
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    if (this.initialized) {
      this.destroyApp();
    }
  }

  private mountCanvas(): void {
    const canvas = this.app.canvas;
    // Le canvas est créé par Pixi hors du template : les styles encapsulés du composant ne l'atteignent pas
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    this.stage().nativeElement.appendChild(canvas);
  }

  private startMining(sheet: Spritesheet): void {
    const miner = createMiner(sheet);
    const effectsLayer = new Container();
    const effects = new HitEffects(effectsLayer);
    this.app.stage.addChild(miner, effectsLayer);

    let previousFrame = miner.currentFrame;
    miner.onFrameChange = (currentFrame: number) => {
      if (hasCrossedFrame(previousFrame, currentFrame, IMPACT_FRAME)) {
        this.wallet.add(GAIN_PER_HIT);
        effects.spawn(
          miner.x + IMPACT_OFFSET.x * MINER_SCALE,
          miner.y + IMPACT_OFFSET.y * MINER_SCALE,
          GAIN_PER_HIT,
        );
      }
      previousFrame = currentFrame;
    };
    this.app.ticker.add((ticker: Ticker) => effects.update(ticker.deltaMS));
    miner.play();
  }

  private destroyApp(): void {
    // children: true libère sprites et effets ; les textures restent en cache dans Assets pour un remontage
    this.app.destroy(true, { children: true });
  }
}

function createBackground(texture: Texture): Sprite {
  // L'image est quasi en 9:16 (572×1024) : l'étirer sur la scène la déforme de moins de 1 %
  const background = new Sprite(texture);
  background.setSize(SCENE_WIDTH, SCENE_HEIGHT);
  return background;
}

function createMiner(sheet: Spritesheet): AnimatedSprite {
  // L'ordre des frames vient du bloc animations de l'atlas, pas de l'ordre des clés de textures
  const frames = sheet.animations[MINER_ANIMATION];
  if (!frames) {
    throw new Error(`Animation "${MINER_ANIMATION}" absente de ${MINER_ATLAS_URL}`);
  }
  const miner = new AnimatedSprite(frames);
  miner.anchor.set(0.5, 1);
  miner.scale.set(MINER_SCALE);
  miner.position.set(
    SCENE_WIDTH / 2 + MINER_BODY_OFFSET_X * MINER_SCALE,
    MINER_FEET_Y,
  );
  miner.animationSpeed = MINER_ANIMATION_SPEED;
  return miner;
}
