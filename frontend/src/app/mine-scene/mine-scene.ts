import { AfterViewInit, Component, computed, effect, ElementRef, inject, OnDestroy, signal, viewChild } from '@angular/core';
import { AnimatedSprite, Application, Assets, Container, Sprite, Spritesheet, Texture, Ticker } from 'pixi.js';
// Version de PixiJS sans « eval » : le site interdit l'évaluation de code (CSP sans 'unsafe-eval')
import 'pixi.js/unsafe-eval';

import { speedMultiplier } from '../equipment/equipment-rules';
import { EvolutionId, GUARDIAN_SECONDS } from '../balance/balance';
import { Miner } from '../miner/miner';
import { Evolution } from '../evolution/evolution';
import { APPRENTICE_STRIKE, EVOLUTION_VISUALS, StrikeAnimation, zoneBackground } from '../loading/game-assets';
import { Mining, StrikeOutcome } from '../mining/mining';
import { Sound } from '../audio/sound';
import { Progression } from '../progression/progression';
import { GUARDIAN_STAGE } from '../progression/progression-rules';
import { hasCrossedFrame } from './frame-crossing';
import { HitEffects } from './hit-effects';
import { MineRock, RockTop } from './mine-rock';

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
// Toutes les animations de frappe ont 23 images avec l'impact sur la même : la cadence ne change pas avec la forme
const STRIKE_FRAME_COUNT = 23;
const IMPACT_FRAME = 10;

// Formes sans animation affichées en image fixe : un peu plus grandes que l'Apprenti,
// avec un petit écrasement à chaque coup pour garder le rythme du minage
const EVOLVED_HEIGHT = 300;
const STRIKE_SQUASH_MS = 180;
const STRIKE_SQUASH = 0.08;
// Le Coup de grisou secoue toute la galerie : décalage maximal du décor, en pixels de scène
const SHAKE_MS = 450;
const SHAKE_PX = 14;
/** Part de la secousse du grisou reprise par la dynamite. */
const DYNAMITE_SHAKE_SHARE = 0.4;
/** La barre de vie flotte juste au-dessus du rocher, en pixels de scène. */
const HEALTH_BAR_GAP = 14;
const PERCENT = 100;
const NUMBER_FORMAT = new Intl.NumberFormat('fr-FR');
const MS_PER_SECOND = 1000;

@Component({
  selector: 'app-mine-scene',
  templateUrl: './mine-scene.html',
  styleUrl: './mine-scene.scss',
})
export class MineScene implements AfterViewInit, OnDestroy {
  private readonly stage = viewChild.required<ElementRef<HTMLDivElement>>('stage');
  private readonly minerStats = inject(Miner);
  private readonly mining = inject(Mining);
  private readonly progression = inject(Progression);
  private readonly evolution = inject(Evolution);
  private readonly sound = inject(Sound);
  private readonly app = new Application();
  /** Mineur animé : il cadence les coups, même invisible derrière une image fixe. */
  private miner: AnimatedSprite | null = null;
  /** Animation affichée par `miner`, qui donne aussi le point d'impact des effets. */
  private strike: StrikeAnimation = APPRENTICE_STRIKE;
  private background: Sprite | null = null;
  private staticBody: Sprite | null = null;
  private staticScale = 1;
  private squashMs = 0;
  private shakeMs = 0;
  private effects: HitEffects | null = null;
  private readonly rockTop = signal<RockTop>({ x: SCENE_WIDTH / 2, y: MINER_FEET_Y });
  private readonly rock = new MineRock((top) => this.rockTop.set(top));
  private initialized = false;

  /** Position de la barre de vie, en pourcentage de la scène : elle suit le rocher, quelle que soit la taille de l'écran. */
  protected readonly healthBarLeft = computed(() => (this.rockTop().x / SCENE_WIDTH) * PERCENT);
  protected readonly healthBarTop = computed(() => ((this.rockTop().y - HEALTH_BAR_GAP) / SCENE_HEIGHT) * PERCENT);
  protected readonly rockZoneTop = computed(() => (this.rockTop().y / SCENE_HEIGHT) * PERCENT);
  protected readonly healthPercent = computed(() => Math.round(this.progression.health() * PERCENT));
  protected readonly remaining = computed(() => NUMBER_FORMAT.format(this.progression.remainingHp()));
  /** Le gardien de la zone est devant le mineur (jamais en zone passée). */
  protected readonly guardian = computed(() => this.progression.farmZone() === null && this.progression.progress().stage === GUARDIAN_STAGE);
  protected readonly guardianSeconds = computed(() => Math.ceil(this.progression.guardianTimeLeft() / MS_PER_SECOND));
  protected readonly guardianTimePercent = computed(() => (this.progression.guardianTimeLeft() / (GUARDIAN_SECONDS * MS_PER_SECOND)) * PERCENT);
  private destroyed = false;

  constructor() {
    // Changer de bottes ou lancer Frénésie accélère le mineur tout de suite, sans recréer la scène
    effect(() => {
      const speed = MINER_BASE_ANIMATION_SPEED * speedMultiplier(this.minerStats.current().stats);
      if (this.miner) {
        this.miner.animationSpeed = speed;
      }
    });
    // Explosion d'un sort : elle frappe le filon devant le mineur
    effect(() => {
      const blast = this.mining.blasts();
      if (blast && this.effects && this.miner) {
        const { impactOffset, scale } = this.strike;
        const isFiredamp = blast.spell === 'firedamp';
        this.effects.spawnBlast(this.miner.x + impactOffset.x * scale, this.miner.y + impactOffset.y * scale, blast.outcome, isFiredamp);
        // Le grisou secoue toute la galerie, la dynamite juste un peu
        this.shakeMs = isFiredamp ? SHAKE_MS : SHAKE_MS * DYNAMITE_SHAKE_SHARE;
        this.sound.play('blast');
      }
    });
    // Nouvelle forme, nouveau visuel, sans recréer la scène
    effect(() => {
      const form = this.evolution.form().id;
      if (this.staticBody) {
        void this.showForm(form);
      }
    });
    // Nouvelle zone (ou retour dans une zone passée), nouveau décor : le fond se charge pendant que le mineur continue
    effect(() => {
      const zone = this.progression.playingZone();
      if (this.background) {
        void this.showZoneBackground(zone);
      }
    });
    // Le gardien de fin de zone remplace le rocher le temps du combat
    effect(() => {
      const zone = this.progression.playingZone();
      const guardian = this.guardian();
      if (this.background) {
        void this.rock.show(zone, guardian);
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

      const frames = await loadStrikeFrames(APPRENTICE_STRIKE);
      if (this.destroyed) {
        return;
      }
      this.background = new Sprite();
      this.app.stage.addChild(this.background, this.rock.sprite);
      await this.showZoneBackground(this.progression.playingZone());
      void this.rock.show(this.progression.playingZone(), this.guardian());
      await this.startMining(frames);
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

  private async startMining(frames: Texture[]): Promise<void> {
    const miner = new AnimatedSprite(frames);
    miner.anchor.set(0.5, 1);
    miner.animationSpeed = MINER_BASE_ANIMATION_SPEED * speedMultiplier(this.minerStats.current().stats);
    this.miner = miner;
    this.placeMiner(APPRENTICE_STRIKE);
    const effectsLayer = new Container();
    const effects = new HitEffects(effectsLayer);
    this.effects = effects;
    this.staticBody = new Sprite();
    this.staticBody.anchor.set(0.5, 1);
    this.staticBody.position.set(SCENE_WIDTH / 2, MINER_FEET_Y);
    this.staticBody.visible = false;
    this.app.stage.addChild(miner, this.staticBody, effectsLayer);
    // On attend la bonne forme avant de lancer les coups : pas d'Apprenti qui clignote au chargement
    await this.showForm(this.evolution.form().id);

    let previousFrame = miner.currentFrame;
    miner.onFrameChange = (currentFrame: number) => {
      if (hasCrossedFrame(previousFrame, currentFrame, IMPACT_FRAME)) {
        const outcome = this.mining.strike();
        const { impactOffset, scale } = this.strike;
        effects.spawn(miner.x + impactOffset.x * scale, miner.y + impactOffset.y * scale, outcome);
        this.playStrikeSounds(outcome);
        this.rock.hit(outcome.rockBroken);
        this.squashMs = STRIKE_SQUASH_MS;
      }
      previousFrame = currentFrame;
    };
    this.app.ticker.add((ticker: Ticker) => {
      effects.update(ticker.deltaMS);
      this.rock.update(ticker.deltaMS);
      this.updateSquash(ticker.deltaMS);
      this.updateShake(ticker.deltaMS);
    });
    miner.play();
  }

  /**
   * Une forme animée remplace les images du mineur ; une forme sans animation s'affiche en image fixe
   * par-dessus l'Apprenti, rendu invisible mais qui continue de cadencer les coups.
   */
  private async showForm(form: EvolutionId): Promise<void> {
    const { body } = EVOLUTION_VISUALS[form];
    try {
      if (body.kind === 'animated') {
        await this.showStrike(body.strike);
        if (this.staticBody) {
          this.staticBody.visible = false;
        }
        return;
      }
      await this.showStrike(APPRENTICE_STRIKE);
      const texture = await Assets.load<Texture>(body.url);
      if (this.destroyed || !this.miner || !this.staticBody) {
        return;
      }
      this.staticBody.texture = texture;
      this.staticScale = EVOLVED_HEIGHT / texture.height;
      this.staticBody.scale.set(this.staticScale);
      this.staticBody.visible = true;
      this.miner.alpha = 0;
    } catch (error) {
      // On garde le visuel précédent plutôt qu'un mineur invisible
      console.error(`Visuel de la forme ${form} introuvable`, error);
    }
  }

  private async showStrike(strike: StrikeAnimation): Promise<void> {
    const frames = await loadStrikeFrames(strike);
    if (this.destroyed || !this.miner) {
      return;
    }
    if (this.strike !== strike) {
      // Même nombre d'images partout : on reprend au même instant du coup, sans à-coup de cadence
      const frame = this.miner.currentFrame;
      const playing = this.miner.playing;
      this.miner.textures = frames;
      this.strike = strike;
      this.placeMiner(strike);
      if (playing) {
        this.miner.gotoAndPlay(frame);
      } else {
        this.miner.gotoAndStop(frame);
      }
    }
    this.miner.alpha = 1;
  }

  private placeMiner(strike: StrikeAnimation): void {
    if (!this.miner) {
      return;
    }
    this.miner.scale.set(strike.scale);
    this.miner.position.set(SCENE_WIDTH / 2 + strike.bodyOffsetX * strike.scale, MINER_FEET_Y);
    // Le rocher se cale sous la pioche de la forme affichée : chaque forme frappe un peu plus loin
    this.rock.place(this.miner.x + strike.impactOffset.x * strike.scale, MINER_FEET_Y);
  }

  /** Le coup, puis ce qu'il a fait : éclat déterré, filon qui cède. */
  private playStrikeSounds(outcome: StrikeOutcome): void {
    this.sound.play(outcome.critical ? 'crit' : 'strike');
    if (outcome.reward.shards > 0) {
      this.sound.play('shard');
    }
    if (outcome.rockBroken) {
      this.sound.play('rockBreak');
    }
  }

  private updateShake(elapsedMs: number): void {
    if (this.shakeMs <= 0) {
      return;
    }
    this.shakeMs = Math.max(this.shakeMs - elapsedMs, 0);
    const strength = (this.shakeMs / SHAKE_MS) * SHAKE_PX;
    this.app.stage.position.set((Math.random() - 0.5) * 2 * strength, (Math.random() - 0.5) * 2 * strength);
  }

  private updateSquash(elapsedMs: number): void {
    if (!this.staticBody?.visible || this.squashMs <= 0) {
      return;
    }
    this.squashMs = Math.max(this.squashMs - elapsedMs, 0);
    const squash = Math.sin((this.squashMs / STRIKE_SQUASH_MS) * Math.PI) * STRIKE_SQUASH;
    this.staticBody.scale.set(this.staticScale * (1 + squash), this.staticScale * (1 - squash));
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
    this.effects = null;
    this.background = null;
    this.staticBody = null;
    // children: true libère sprites et effets ; les textures restent en cache dans Assets pour un remontage
    this.app.destroy(true, { children: true });
  }
}

async function loadStrikeFrames(strike: StrikeAnimation): Promise<Texture[]> {
  const sheet = await Assets.load<Spritesheet>(strike.atlasUrl);
  // L'ordre des frames vient du bloc animations de l'atlas, pas de l'ordre des clés de textures
  const frames = sheet.animations[MINER_ANIMATION];
  if (!frames) {
    throw new Error(`Animation "${MINER_ANIMATION}" absente de ${strike.atlasUrl}`);
  }
  if (frames.length !== STRIKE_FRAME_COUNT) {
    throw new Error(`${strike.atlasUrl} a ${frames.length} images au lieu de ${STRIKE_FRAME_COUNT} : la cadence de minage serait faussée`);
  }
  return frames;
}
