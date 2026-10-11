import { AfterViewInit, Component, effect, ElementRef, inject, OnDestroy, viewChild } from '@angular/core';
import { AnimatedSprite, Application, Assets, Container, Sprite, Spritesheet, Texture, Ticker } from 'pixi.js';

import { speedMultiplier } from '../equipment/equipment-rules';
import { EvolutionId } from '../balance/balance';
import { Inventory } from '../equipment/inventory';
import { Evolution } from '../evolution/evolution';
import { EVOLUTION_VISUALS, MINER_ATLAS_URL, zoneBackground } from '../loading/game-assets';
import { Mining } from '../mining/mining';
import { Progression } from '../progression/progression';
import { hasCrossedFrame } from './frame-crossing';
import { HitEffects } from './hit-effects';

// Résolution logique portrait 9:16, mise à l'échelle de l'écran en CSS
const SCENE_WIDTH = 720;
const SCENE_HEIGHT = 1280;
// Couleur visible le temps que le fond charge, proche de ses tons
const CAVE_COLOR = 0x24170f;
// Pieds du mineur : le fond est remonté pour que son sol passe ici, ce qui libère le bas de l'écran
// au panneau de stats et à la Forge.
const MINER_FEET_Y = 690;

const MINER_ANIMATION = 'pickaxe_swing';
// Pixi avance d'animationSpeed frame par tick (60 ticks/s) : 0.2 donne les 12 fps prévus par l'atlas
const MINER_BASE_ANIMATION_SPEED = 0.2;
// Réduit pour laisser la place aux colonnes d'équipement de chaque côté
const MINER_SCALE = 0.58;
// Les décalages ci-dessous sont en pixels de la frame source, multipliés par MINER_SCALE à l'usage
// La pioche élargit la frame vers la droite : on décale pour centrer le corps, pas la frame
const MINER_BODY_OFFSET_X = 40;
// Frame où la pioche touche le sol, repérée sur la spritesheet
const IMPACT_FRAME = 10;
// Pointe de la pioche à l'impact, par rapport à l'ancre (bas-centre) du mineur
const IMPACT_OFFSET = { x: 118, y: -41 } as const;

// Formes évoluées affichées en image fixe en attendant leur animation : un peu plus grandes que l'Apprenti,
// avec un petit écrasement à chaque coup pour garder le rythme du minage
const EVOLVED_HEIGHT = 300;
const STRIKE_SQUASH_MS = 180;
const STRIKE_SQUASH = 0.08;

@Component({
  selector: 'app-mine-scene',
  templateUrl: './mine-scene.html',
  styleUrl: './mine-scene.scss',
})
export class MineScene implements AfterViewInit, OnDestroy {
  private readonly stage = viewChild.required<ElementRef<HTMLDivElement>>('stage');
  private readonly inventory = inject(Inventory);
  private readonly mining = inject(Mining);
  private readonly progression = inject(Progression);
  private readonly app = new Application();
  private miner: AnimatedSprite | null = null;
  private background: Sprite | null = null;
  /** Image fixe de la forme évoluée, posée sur l'Apprenti animé qui continue de cadencer les coups. */
  private evolvedSprite: Sprite | null = null;
  private evolvedScale = 1;
  private squashMs = 0;
  private readonly evolution = inject(Evolution);
  private initialized = false;
  private destroyed = false;

  constructor() {
    // Changer de bottes accélère le mineur tout de suite, sans recréer la scène
    effect(() => {
      const speed = MINER_BASE_ANIMATION_SPEED * speedMultiplier(this.inventory.stats());
      if (this.miner) {
        this.miner.animationSpeed = speed;
      }
    });
    // Nouvelle forme, nouveau visuel, sans recréer la scène
    effect(() => {
      const form = this.evolution.form().id;
      if (this.evolvedSprite) {
        void this.showForm(form);
      }
    });
    // Nouvelle zone, nouveau décor : le fond suivant se charge pendant que le mineur continue
    effect(() => {
      const zone = this.progression.zone();
      if (this.background) {
        void this.showZoneBackground(zone);
      }
    });
  }

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

      const sheet = await Assets.load<Spritesheet>(MINER_ATLAS_URL);
      if (this.destroyed) {
        return;
      }
      this.background = new Sprite();
      this.app.stage.addChild(this.background);
      await this.showZoneBackground(this.progression.zone());
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
    miner.animationSpeed = MINER_BASE_ANIMATION_SPEED * speedMultiplier(this.inventory.stats());
    this.miner = miner;
    const effectsLayer = new Container();
    const effects = new HitEffects(effectsLayer);
    this.evolvedSprite = new Sprite();
    this.evolvedSprite.anchor.set(0.5, 1);
    this.evolvedSprite.position.set(SCENE_WIDTH / 2, MINER_FEET_Y);
    this.app.stage.addChild(miner, this.evolvedSprite, effectsLayer);
    void this.showForm(this.evolution.form().id);

    let previousFrame = miner.currentFrame;
    miner.onFrameChange = (currentFrame: number) => {
      if (hasCrossedFrame(previousFrame, currentFrame, IMPACT_FRAME)) {
        const outcome = this.mining.strike();
        effects.spawn(miner.x + IMPACT_OFFSET.x * MINER_SCALE, miner.y + IMPACT_OFFSET.y * MINER_SCALE, outcome);
        this.squashMs = STRIKE_SQUASH_MS;
      }
      previousFrame = currentFrame;
    };
    this.app.ticker.add((ticker: Ticker) => {
      effects.update(ticker.deltaMS);
      this.updateSquash(ticker.deltaMS);
    });
    miner.play();
  }

  /** L'Apprenti est animé ; une forme évoluée s'affiche en image fixe par-dessus, l'animation devenant invisible. */
  private async showForm(form: EvolutionId): Promise<void> {
    const { bodyUrl } = EVOLUTION_VISUALS[form];
    if (!this.miner || !this.evolvedSprite) {
      return;
    }
    if (bodyUrl === null) {
      this.miner.alpha = 1;
      this.evolvedSprite.visible = false;
      return;
    }
    try {
      const texture = await Assets.load<Texture>(bodyUrl);
      if (this.destroyed || !this.miner || !this.evolvedSprite) {
        return;
      }
      this.evolvedSprite.texture = texture;
      this.evolvedScale = EVOLVED_HEIGHT / texture.height;
      this.evolvedSprite.scale.set(this.evolvedScale);
      this.evolvedSprite.visible = true;
      this.miner.alpha = 0;
    } catch (error) {
      // On garde l'Apprenti animé plutôt qu'un mineur invisible
      console.error(`Visuel de la forme ${form} introuvable`, error);
    }
  }

  private updateSquash(elapsedMs: number): void {
    if (!this.evolvedSprite?.visible || this.squashMs <= 0) {
      return;
    }
    this.squashMs = Math.max(this.squashMs - elapsedMs, 0);
    const squash = Math.sin((this.squashMs / STRIKE_SQUASH_MS) * Math.PI) * STRIKE_SQUASH;
    this.evolvedSprite.scale.set(this.evolvedScale * (1 + squash), this.evolvedScale * (1 - squash));
  }

  private async showZoneBackground(zone: number): Promise<void> {
    const { url, floorY } = zoneBackground(zone);
    try {
      const texture = await Assets.load<Texture>(url);
      if (this.destroyed || !this.background) {
        return;
      }
      this.background.texture = texture;
      // Les images sont quasi en 9:16 (572×1024) : les étirer sur la scène les déforme de moins de 1 %
      this.background.setSize(SCENE_WIDTH, SCENE_HEIGHT);
      this.background.y = MINER_FEET_Y - floorY;
    } catch (error) {
      // On garde l'ancien décor plutôt qu'un écran vide
      console.error(`Fond de la zone ${zone} introuvable`, error);
    }
  }

  private destroyApp(): void {
    this.miner = null;
    this.background = null;
    this.evolvedSprite = null;
    // children: true libère sprites et effets ; les textures restent en cache dans Assets pour un remontage
    this.app.destroy(true, { children: true });
  }
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
  return miner;
}
