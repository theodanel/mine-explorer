import { AfterViewInit, Component, computed, effect, ElementRef, inject, OnDestroy, signal, untracked, viewChild } from '@angular/core';
import { AnimatedSprite, Application, Assets, Container, Sprite, Spritesheet, Texture, Ticker } from 'pixi.js';
// Version de PixiJS sans « eval » : le site interdit l'évaluation de code (CSP sans 'unsafe-eval')
import 'pixi.js/unsafe-eval';

import { speedMultiplier } from '../equipment/equipment-rules';
import { EvolutionId, GUARDIAN_SECONDS } from '../balance/balance';
import { Miner } from '../miner/miner';
import { Evolution } from '../evolution/evolution';
import { APPRENTICE_STRIKE, cadenceStrike, EVOLUTION_VISUALS, StrikeAnimation, zoneBackground } from '../loading/game-assets';
import { Mining, StrikeOutcome } from '../mining/mining';
import { Navigation } from '../navigation/navigation';
import { Sound } from '../audio/sound';
import { Progression } from '../progression/progression';
import { RANDOM } from '../shared/random';
import { GUARDIAN_STAGE } from '../progression/progression-rules';
import { hasCrossedFrame } from './frame-crossing';
import { HitEffects } from './hit-effects';
import { RebirthAuraView } from './rebirth-aura-view';
import { AstreView } from './astre-view';
import { ASTRE_STRIKE_MS } from '../balance/astre';
import { astreColor } from '../heart-forge/astre-rules';
import { HeartForge } from '../heart-forge/heart-forge';
import { Rebirth } from '../rebirth/rebirth';
import { rebirthAura } from '../rebirth/rebirth-visuals';
import { MineRock, RockTop } from './mine-rock';
import { AmbienceLayer } from './ambience-layer';
import { PowerGain, powerGain } from './power-gain';
import { MiningStats } from '../equipment/equipment.model';
import { compactNumber } from '../shared/format-number';
import { Companions } from '../companions/companions';
import { IMPACT_FRAME, isWindingUp, STRIKE_FRAME_COUNT, walkWindowMs } from './strike-rhythm';
import { TopDownSettings } from './top-down-settings';
import { drawFloorTile, TopDownView } from './top-down-view';
import type { Point } from './top-down-path';

// Résolution logique portrait 9:16, mise à l'échelle de l'écran en CSS
const SCENE_WIDTH = 720;
const SCENE_HEIGHT = 1280;
/** Images par seconde des décors animés, celles de la vidéo. */
const ZONE_VIDEO_FPS = 24;
// Couleur visible le temps que le fond charge, proche de ses tons
const CAVE_COLOR = 0x24170f;
// Pieds du mineur : le fond est remonté pour que son sol passe ici, ce qui libère le bas de l'écran
// au panneau de stats et à la Forge.
const MINER_FEET_Y = 690;

const MINER_ANIMATION = 'pickaxe_swing';
// Pixi avance d'animationSpeed frame par tick (60 ticks/s) : 0.2 donne les 12 fps prévus par l'atlas
const MINER_BASE_ANIMATION_SPEED = 0.2;

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
const MS_PER_SECOND = 1000;
/** Un Écho garde le décor de la zone, assombri et rougi : le monde a changé. Hors Écho, aucune teinte. */
const ECHO_TINT = 0xb0786a;
const NO_TINT = 0xffffff;
/** Sous un menu, la mine ne se voit presque plus : 30 images par seconde suffisent et ménagent la batterie. */
const COVERED_MAX_FPS = 30;
/** Un filon qui cède secoue un peu la galerie : une part de la secousse du grisou. */
const ROCK_BREAK_SHAKE_SHARE = 0.2;
/** Gain de Puissance : le texte part de la tête du mineur, et le mineur brille d'or un instant. */
const POWER_GAIN_ABOVE_FEET = 330;
const POWER_GLOW_MS = 600;
const POWER_GLOW_TINT = 0xffe08a;
/** L'éclat de l'Astre frappe le filon un peu sous son sommet. */
const ASTRE_SHOT_BELOW_TOP = 60;
/** Les effets passent devant tout ce que la vue du dessus range par profondeur. */
const EFFECTS_DEPTH = 100_000;
/** Le sol semé de décors passe sous tout le reste. */
const GROUND_DEPTH = -100_000;

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
  private readonly navigation = inject(Navigation);
  private readonly sound = inject(Sound);
  private readonly app = new Application();
  /** Mineur animé : il cadence les coups, même invisible derrière une image fixe. */
  private miner: AnimatedSprite | null = null;
  /** Animation affichée par `miner`, qui donne aussi le point d'impact des effets. */
  private strike: StrikeAnimation = APPRENTICE_STRIKE;
  private background: Sprite | null = null;
  /** Vidéo du décor animé en cours, à libérer en changeant de zone. */
  private zoneVideoUrl: string | null = null;
  private staticBody: Sprite | null = null;
  private staticScale = 1;
  private squashMs = 0;
  private shakeMs = 0;
  private effects: HitEffects | null = null;
  /** Haut du rocher à l'écran, pour la barre de vie, le chrono du gardien et la zone du tutoriel. */
  private readonly rockTop = signal<RockTop>({ x: SCENE_WIDTH / 2, y: MINER_FEET_Y });
  /** Haut du rocher dans le monde, que visent l'Astre et les sorts : l'écran s'en écarte quand la caméra suit le héros. */
  private rockWorldTop: RockTop = { x: SCENE_WIDTH / 2, y: MINER_FEET_Y };
  private readonly rock = new MineRock((top) => {
    this.rockWorldTop = top;
    this.syncRockTop();
  });
  private readonly random = inject(RANDOM);
  private readonly ambience = new AmbienceLayer(this.random);
  /** Tout ce qui vit dans la galerie : la caméra de la vue du dessus le déplace d'un bloc. Le décor reste à l'écran. */
  private readonly world = new Container();
  /** Mineur de la vue de côté (animé ou image fixe), caché dans la vue du dessus où il ne sert plus que de métronome. */
  private readonly classicHero = new Container();
  /** Chiffres de dégâts, éclats, explosions et tirs de l'Astre : toujours au premier plan. */
  private readonly effectsLayer = new Container();
  /** Images de l'animation de frappe en cours : le héros de la vue du dessus montre la première en marchant. */
  private strikeFrames: Texture[] = [];
  private readonly topDownSettings = inject(TopDownSettings);
  private readonly companions = inject(Companions);
  private topDown: TopDownView | null = null;
  /** La scène est affichée vue du dessus (zone 1 du prototype). */
  private topDownShown = false;
  /** Lueur de la Renaissance derrière le mineur, et couleur des chiffres de dégâts. */
  private readonly aura = new RebirthAuraView();
  private readonly rebirth = inject(Rebirth);
  private readonly heartForge = inject(HeartForge);
  /** L'Astre du Cœur, qui flotte derrière le mineur et lance ses éclats d'étoile. */
  private astre: AstreView | null = null;
  private astreClockMs = 0;
  private readonly rebirthAura = computed(() => rebirthAura(this.rebirth.count()));
  private initialized = false;
  /**
   * Hauteur de la scène, en pixels de scène : 1280 en 9:16, plus sur un téléphone haut, où le cadre s'allonge.
   * La galerie gagne alors du haut : tout le décor descend de `extra`, pour que le sol reste aligné sur les panneaux.
   */
  private readonly sceneHeight = signal(SCENE_HEIGHT);
  private readonly extra = computed(() => this.sceneHeight() - SCENE_HEIGHT);
  private floorY = 0;
  private resizeObserver: ResizeObserver | null = null;

  /** Position de la barre de vie, en pourcentage de la scène : elle suit le rocher, quelle que soit la taille de l'écran. */
  protected readonly healthBarLeft = computed(() => (this.rockTop().x / SCENE_WIDTH) * PERCENT);
  protected readonly healthBarTop = computed(() => ((this.rockTop().y + this.extra() - HEALTH_BAR_GAP) / this.sceneHeight()) * PERCENT);
  protected readonly rockZoneTop = computed(() => ((this.rockTop().y + this.extra()) / this.sceneHeight()) * PERCENT);
  protected readonly healthPercent = computed(() => Math.round(this.progression.health() * PERCENT));
  protected readonly remaining = computed(() => compactNumber(this.progression.remainingHp()));
  /** Le gardien de la zone est devant le mineur (jamais en zone passée). */
  protected readonly guardian = computed(() => this.progression.farmZone() === null && this.progression.progress().stage === GUARDIAN_STAGE);
  protected readonly guardianSeconds = computed(() => Math.ceil(this.progression.guardianTimeLeft() / MS_PER_SECOND));
  protected readonly guardianTimePercent = computed(() => (this.progression.guardianTimeLeft() / (GUARDIAN_SECONDS * MS_PER_SECOND)) * PERCENT);
  private destroyed = false;
  /** Stats permanentes vues en dernier : un gain se mesure par rapport à elles. */
  private lastStats: MiningStats | null = null;
  /** Gain pas encore montré : il attend que le joueur revienne sur la mine (équipé depuis une page, par exemple). */
  private readonly pendingGain = signal<PowerGain | null>(null);
  private glowMs = 0;

  constructor() {
    // L'Astre du Cœur : son stade allume ses étoiles, sa nourriture fait sa couleur, sa Constellation ses étoiles en orbite
    effect(() => {
      const stage = this.heartForge.astreStage();
      const color = astreColor(this.heartForge.astre());
      this.astre?.set(stage, color, this.heartForge.astreConstellation());
    });
    // Pluie d'étoiles de l'Astre (stades 4 et 5) dès que le gardien apparaît
    effect(() => {
      if (this.progression.guardianFight()) {
        untracked(() => {
          const outcome = this.mining.astreStarRain();
          if (outcome !== null && this.effects) {
            const top = this.rockWorldTop;
            this.effects.spawnBlast(top.x, top.y, outcome, true);
          }
        });
      }
    });
    // Chaque renaissance change la lueur du mineur et la couleur de ses dégâts
    effect(() => {
      const aura = this.rebirthAura();
      this.aura.set(aura);
      this.effects?.setRebirthAura(aura);
    });
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
        const impact = this.impactPoint(this.miner);
        const isFiredamp = blast.spell === 'firedamp';
        this.effects.spawnBlast(impact.x, impact.y, blast.outcome, isFiredamp);
        // Le grisou secoue toute la galerie, la dynamite juste un peu
        this.shakeMs = isFiredamp ? SHAKE_MS : SHAKE_MS * DYNAMITE_SHAKE_SHARE;
        this.sound.play('blast');
      }
    });
    // Le mineur devient plus fort (objet, compétence, artefact…) : on le note, et on le montre dès qu'il est à l'écran
    effect(() => {
      const stats = this.minerStats.permanent().stats;
      const previous = this.lastStats;
      this.lastStats = stats;
      const gain = previous === null ? null : powerGain(previous, stats);
      if (gain !== null) {
        const pending = untracked(() => this.pendingGain());
        // Plusieurs gains d'affilée (trois compétences apprises) : un seul, du premier « avant » au dernier « après »
        this.pendingGain.set(pending === null ? gain : { ...gain, from: pending.from });
      }
    });
    effect(() => {
      const gain = this.pendingGain();
      if (gain === null || this.navigation.page() !== 'mine' || !this.effects || !this.miner) {
        return;
      }
      untracked(() => this.showPowerGain());
    });
    // Nouvelle forme, nouveau visuel, sans recréer la scène
    effect(() => {
      const form = this.evolution.form().id;
      if (this.staticBody) {
        void this.showForm(form);
      }
    });
    // Dans un Écho, le décor s'assombrit et rougit
    effect(() => {
      const echo = this.progression.inEcho();
      if (this.background) {
        this.background.tint = echo ? ECHO_TINT : NO_TINT;
      }
      if (this.topDown) {
        this.topDown.floor.tint = echo ? ECHO_TINT : NO_TINT;
      }
    });
    // Zone 1 du prototype : la mine vue du dessus, sinon la scène de côté ; changer de caméra replace le héros
    effect(() => {
      const topDown = this.topDownSettings.active();
      this.topDownSettings.fixedCamera();
      if (this.topDown) {
        untracked(() => this.applyMode(topDown));
      }
    });
    // Vue du dessus : le compagnon actif quitte le HTML pour suivre le héros dans la scène
    effect(() => {
      const companion = this.topDownSettings.active() ? this.companions.active() : null;
      if (this.topDown) {
        void this.topDown.companion.show(companion);
      }
    });
    // Sous un menu, la scène tourne au ralenti ; les coups gardent leur cadence (animation au temps écoulé)
    effect(() => {
      const covered = this.navigation.page() !== 'mine';
      if (this.initialized) {
        this.app.ticker.maxFPS = covered ? COVERED_MAX_FPS : 0;
      }
    });
    // Nouvelle zone (ou retour dans une zone passée), nouveau décor : le fond se charge pendant que le mineur continue
    effect(() => {
      const zone = this.progression.playingZone();
      if (this.background) {
        void this.showZoneBackground(zone);
        this.ambience.showZone(zone);
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
      this.followFrameSize();

      // L'animation de la forme dès le départ : pas d'Apprenti à télécharger pour un joueur évolué
      const strike = cadenceStrike(this.evolution.form().id);
      const frames = await loadStrikeFrames(strike);
      if (this.destroyed) {
        return;
      }
      this.background = new Sprite();
      this.world.sortableChildren = true;
      this.world.addChild(this.rock.sprite);
      this.app.stage.addChild(this.background, this.ambience.container, this.world);
      this.ambience.showZone(this.progression.playingZone());
      await this.showZoneBackground(this.progression.playingZone());
      void this.rock.show(this.progression.playingZone(), this.guardian());
      await this.startMining(frames, strike);
    } catch (error) {
      console.error('Impossible d\'afficher la scène de la mine', error);
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.resizeObserver?.disconnect();
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

  /** Le cadre s'allonge sur un téléphone haut : la scène suit, sans déformer le décor. */
  private followFrameSize(): void {
    const element = this.stage().nativeElement;
    const resize = () => {
      if (element.clientWidth === 0 || this.destroyed) {
        return;
      }
      const height = Math.max(Math.round((SCENE_WIDTH * element.clientHeight) / element.clientWidth), SCENE_HEIGHT);
      if (height === this.sceneHeight()) {
        return;
      }
      this.sceneHeight.set(height);
      this.app.renderer.resize(SCENE_WIDTH, height);
      this.app.stage.position.set(0, this.extra());
      this.layoutBackground();
    };
    resize();
    this.resizeObserver = new ResizeObserver(resize);
    this.resizeObserver.observe(element);
  }

  private async startMining(frames: Texture[], strike: StrikeAnimation): Promise<void> {
    const miner = new AnimatedSprite(frames);
    miner.anchor.set(0.5, 1);
    miner.animationSpeed = MINER_BASE_ANIMATION_SPEED * speedMultiplier(this.minerStats.current().stats);
    this.miner = miner;
    this.strike = strike;
    this.strikeFrames = frames;
    const effectsLayer = this.effectsLayer;
    effectsLayer.zIndex = EFFECTS_DEPTH;
    const effects = new HitEffects(effectsLayer);
    effects.setRebirthAura(this.rebirthAura());
    this.effects = effects;
    const astre = new AstreView(effectsLayer);
    astre.set(this.heartForge.astreStage(), astreColor(this.heartForge.astre()), this.heartForge.astreConstellation());
    this.astre = astre;
    // Après l'Astre, que placeMiner cale derrière le mineur
    this.placeMiner(strike);
    this.staticBody = new Sprite();
    this.staticBody.anchor.set(0.5, 1);
    this.staticBody.position.set(SCENE_WIDTH / 2, MINER_FEET_Y);
    this.staticBody.visible = false;
    this.classicHero.addChild(miner, this.staticBody);
    const floorTile = drawFloorTile();
    const topDown = new TopDownView({ x: SCENE_WIDTH / 2, y: MINER_FEET_Y }, this.random, this.app.renderer.generateTexture(floorTile));
    floorTile.destroy();
    // Rien de la vue du dessus ne se montre avant que applyMode ait choisi la vue
    topDown.floor.visible = false;
    topDown.hero.visible = false;
    topDown.companion.view.visible = false;
    this.topDown = topDown;
    topDown.ground.visible = false;
    topDown.ground.zIndex = GROUND_DEPTH;
    void topDown.loadVisuals();
    this.app.stage.addChildAt(topDown.floor, this.app.stage.getChildIndex(this.world));
    this.world.addChild(topDown.ground, astre.view, this.aura.view, this.classicHero, topDown.hero, topDown.companion.view, effectsLayer);
    // On attend la bonne forme avant de lancer les coups : pas d'Apprenti qui clignote au chargement
    await this.showForm(this.evolution.form().id);
    if (this.destroyed) {
      return;
    }
    this.applyMode(this.topDownSettings.active());
    void topDown.companion.show(this.topDownSettings.active() ? this.companions.active() : null);

    let previousFrame = miner.currentFrame;
    miner.onFrameChange = (currentFrame: number) => {
      if (hasCrossedFrame(previousFrame, currentFrame, IMPACT_FRAME)) {
        const outcome = this.mining.strike();
        const impact = this.impactPoint(miner);
        effects.spawn(impact.x, impact.y, outcome);
        this.playStrikeSounds(outcome);
        this.rock.hit(outcome.rockBroken);
        if (outcome.rockBroken) {
          effects.spawnRockBreak(impact.x, impact.y);
          this.shakeMs = Math.max(this.shakeMs, SHAKE_MS * ROCK_BREAK_SHAKE_SHARE);
          this.walkToNextRock(miner);
        }
        this.squashMs = STRIKE_SQUASH_MS;
      }
      previousFrame = currentFrame;
    };
    this.app.ticker.add((ticker: Ticker) => {
      effects.update(ticker.deltaMS);
      this.ambience.update(ticker.deltaMS);
      this.rock.update(ticker.deltaMS);
      this.updateSquash(ticker.deltaMS);
      this.updateShake(ticker.deltaMS);
      this.updateGlow(ticker.deltaMS);
      this.aura.update(ticker.deltaMS);
      astre.update(ticker.deltaMS);
      this.updateAstreStrikes(ticker.deltaMS);
      this.updateTopDown(ticker.deltaMS, miner);
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
      this.strikeFrames = frames;
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
    if (this.topDownShown) {
      // Vue du dessus : l'Astre et la lueur suivent le héros à chaque image, le rocher pousse devant lui
      this.placeRockAhead();
      return;
    }
    // Centré sur le corps dessiné (l'image fixe des formes évoluées est au centre de la scène)
    this.aura.place(SCENE_WIDTH / 2, MINER_FEET_Y);
    this.astre?.place(SCENE_WIDTH / 2, MINER_FEET_Y);
    // Le rocher se cale sous la pioche de la forme affichée : chaque forme frappe un peu plus loin
    this.rock.place(this.miner.x + strike.impactOffset.x * strike.scale, MINER_FEET_Y);
  }

  /** Toutes les 2 s, l'Astre lance un éclat d'étoile ; le coup part à l'impact sur le filon. */
  private updateAstreStrikes(deltaMs: number): void {
    if (this.heartForge.astreStage() === 0 || !this.astre || !this.effects) {
      return;
    }
    this.astreClockMs += deltaMs;
    if (this.astreClockMs < ASTRE_STRIKE_MS) {
      return;
    }
    this.astreClockMs -= ASTRE_STRIKE_MS;
    const top = this.rockWorldTop;
    const effects = this.effects;
    this.astre.shoot(top.x, top.y + ASTRE_SHOT_BELOW_TOP, () => {
      const outcome = this.mining.astreStrike();
      if (outcome !== null) {
        effects.spawn(top.x, top.y + ASTRE_SHOT_BELOW_TOP, outcome);
        this.rock.hit(outcome.rockBroken);
      }
    });
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

  /** Pointe de la pioche à l'impact, dans le repère du monde. */
  private impactPoint(miner: AnimatedSprite): Point {
    const { impactOffset, scale, bodyOffsetX } = this.strike;
    if (this.topDownShown && this.topDown) {
      const feet = this.topDown.heroFeet;
      const facing = this.topDown.facing;
      return { x: feet.x + facing * (bodyOffsetX + impactOffset.x) * scale, y: feet.y + impactOffset.y * scale };
    }
    return { x: miner.x + impactOffset.x * scale, y: miner.y + impactOffset.y * scale };
  }

  private heroFeet(): Point {
    return this.topDownShown && this.topDown ? this.topDown.heroFeet : { x: SCENE_WIDTH / 2, y: MINER_FEET_Y };
  }

  /** Bascule entre la scène de côté et la vue du dessus. Le métronome ne s'arrête jamais : seul l'affichage change. */
  private applyMode(topDown: boolean): void {
    const view = this.topDown;
    if (!view || !this.background) {
      return;
    }
    this.topDownShown = topDown;
    this.background.visible = !topDown;
    this.ambience.container.visible = !topDown;
    this.classicHero.visible = !topDown;
    view.floor.visible = topDown;
    view.ground.visible = topDown;
    view.hero.visible = topDown;
    view.companion.view.visible = topDown;
    if (topDown) {
      view.reset(this.topDownSettings.fixedCamera());
    } else {
      this.world.position.set(0, 0);
      this.layerClassic();
    }
    this.placeMiner(this.strike);
    this.syncRockTop();
  }

  /** Vue de côté : l'ordre d'affichage d'origine, du rocher au mineur (les effets restent devant). */
  private layerClassic(): void {
    const layers = [this.rock.sprite, this.astre?.view, this.aura.view, this.classicHero, this.topDown?.hero, this.topDown?.companion.view];
    layers.forEach((layer, index) => {
      if (layer) {
        layer.zIndex = index;
      }
    });
  }

  /** Le filon a cédé sous la pioche : vue du dessus, le héros marche jusqu'au suivant pendant la fin du geste. */
  private walkToNextRock(miner: AnimatedSprite): void {
    if (!this.topDownShown || !this.topDown) {
      return;
    }
    this.topDown.leaveHole({ x: this.rockWorldTop.x, y: this.rock.floorLine });
    this.topDown.walkToNext(walkWindowMs(miner.animationSpeed));
    this.placeRockAhead();
  }

  /** Le rocher pousse devant l'endroit où le héros s'arrête, sous sa pioche. */
  private placeRockAhead(): void {
    if (!this.topDown) {
      return;
    }
    const { impactOffset, scale, bodyOffsetX } = this.strike;
    const at = this.topDown.destination;
    const facing = this.topDown.facing;
    this.rock.place(at.x + facing * (bodyOffsetX + impactOffset.x) * scale, at.y, facing);
  }

  /** Vue du dessus, à chaque image : marche, caméra, héros visible, et tout ce qui le suit. */
  private updateTopDown(elapsedMs: number, miner: AnimatedSprite): void {
    const view = this.topDown;
    if (!this.topDownShown || !view) {
      return;
    }
    const reducedMotion = this.topDownSettings.reducedMotion();
    view.update(elapsedMs, isWindingUp(miner.currentFrame), reducedMotion);
    view.updateHoles(elapsedMs);
    const feet = view.heroFeet;
    this.showTopDownHero(view, miner, reducedMotion);
    const offset = view.worldOffset;
    this.world.position.set(offset.x, offset.y);
    view.layoutFloor(-this.extra(), SCENE_WIDTH, this.sceneHeight(), SHAKE_PX);
    this.aura.place(feet.x, feet.y);
    this.astre?.place(feet.x, feet.y);
    // Rangés par profondeur : ce qui est plus bas à l'écran passe devant
    this.rock.sprite.zIndex = this.rock.floorLine;
    this.aura.view.zIndex = feet.y;
    if (this.astre) {
      this.astre.view.zIndex = feet.y;
    }
    view.hero.zIndex = feet.y;
    view.companion.view.zIndex = view.companion.feetY;
    this.syncRockTop();
  }

  /**
   * Le héros visible recopie l'image du métronome invisible (ou l'image fixe des formes sans animation), en miroir quand
   * il regarde à gauche. En marchant, il garde la pose du début de l'élan, faute de vidéo de marche.
   */
  private showTopDownHero(view: TopDownView, miner: AnimatedSprite, reducedMotion: boolean): void {
    const staticBody = this.staticBody;
    const source: Sprite = staticBody?.visible ? staticBody : miner;
    const isStatic = source === staticBody;
    const hero = view.hero;
    const feet = view.heroFeet;
    const walkTexture = view.walkTexture();
    if (walkTexture) {
      // Marche découpée d'une vidéo : centrée sur les pieds, à la taille de l'Apprenti
      hero.texture = walkTexture;
      hero.anchor.set(0.5, 1);
      hero.scale.set(view.walkScale * view.facing, view.walkScale);
      hero.tint = source.tint;
      hero.position.set(feet.x, feet.y);
      return;
    }
    hero.texture = isStatic || !view.walking ? source.texture : (this.strikeFrames[0] ?? source.texture);
    hero.anchor.copyFrom(source.anchor);
    hero.scale.set(Math.abs(source.scale.x) * view.facing, source.scale.y);
    hero.tint = source.tint;
    const bodyOffset = isStatic ? 0 : this.strike.bodyOffsetX * this.strike.scale;
    hero.position.set(feet.x + view.facing * bodyOffset, feet.y - view.hop(reducedMotion));
  }

  /** Le haut du rocher à l'écran : sa place dans le monde, décalée par la caméra. Le signal ne change que s'il bouge. */
  private syncRockTop(): void {
    const offset = this.topDownShown && this.topDown ? this.topDown.worldOffset : { x: 0, y: 0 };
    const x = Math.round(this.rockWorldTop.x + offset.x);
    const y = Math.round(this.rockWorldTop.y + offset.y);
    const current = this.rockTop();
    if (current.x !== x || current.y !== y) {
      this.rockTop.set({ x, y });
    }
  }

  private showPowerGain(): void {
    this.pendingGain.set(null);
    const feet = this.heroFeet();
    this.effects?.spawnPowerGain(feet.x, feet.y - POWER_GAIN_ABOVE_FEET);
    this.glowMs = POWER_GLOW_MS;
    this.sound.play('upgrade');
  }

  /** Le mineur (ou sa forme fixe) brille d'or puis reprend ses couleurs. */
  private updateGlow(elapsedMs: number): void {
    if (this.glowMs <= 0) {
      return;
    }
    this.glowMs = Math.max(this.glowMs - elapsedMs, 0);
    const tint = this.glowMs > 0 ? POWER_GLOW_TINT : NO_TINT;
    if (this.miner) {
      this.miner.tint = tint;
    }
    if (this.staticBody) {
      this.staticBody.tint = tint;
    }
  }

  private updateShake(elapsedMs: number): void {
    if (this.shakeMs <= 0) {
      return;
    }
    this.shakeMs = Math.max(this.shakeMs - elapsedMs, 0);
    const strength = (this.shakeMs / SHAKE_MS) * SHAKE_PX;
    this.app.stage.position.set((Math.random() - 0.5) * 2 * strength, this.extra() + (Math.random() - 0.5) * 2 * strength);
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
    const { url, videoUrl, floorY } = zoneBackground(zone);
    try {
      const texture = videoUrl === null ? await Assets.load<Texture>(url) : await this.loadZoneVideo(videoUrl, url);
      if (this.destroyed || !this.background) {
        return;
      }
      this.releaseZoneVideo(videoUrl);
      this.background.texture = texture;
      this.background.tint = this.progression.inEcho() ? ECHO_TINT : NO_TINT;
      this.floorY = floorY;
      this.layoutBackground();
    } catch (error) {
      // On garde l'ancien décor plutôt qu'un écran vide
      console.error(`Fond de la zone ${zone} introuvable`, error);
    }
  }

  /**
   * Décor animé : la vidéo boucle sans son, lue en ligne (iOS), mise à jour 24 fois par seconde comme elle a été
   * tournée. Si elle ne se charge pas (réseau, navigateur), l'image fixe la remplace.
   */
  private async loadZoneVideo(videoUrl: string, imageUrl: string): Promise<Texture> {
    try {
      const texture = await Assets.load<Texture>({
        src: videoUrl,
        data: { autoPlay: true, loop: true, muted: true, playsinline: true, updateFPS: ZONE_VIDEO_FPS },
      });
      this.zoneVideoUrl = videoUrl;
      return texture;
    } catch (error) {
      console.warn('Décor animé indisponible, image fixe à la place', error);
      return Assets.load<Texture>(imageUrl);
    }
  }

  /** En quittant une zone animée, la vidéo s'arrête et sa mémoire est libérée. */
  private releaseZoneVideo(keep: string | null): void {
    const previous = this.zoneVideoUrl;
    if (previous !== null && previous !== keep) {
      this.zoneVideoUrl = null;
      void Assets.unload(previous);
    }
  }

  /**
   * Le sol du décor se pose sous les pieds du mineur. Les images sont quasi en 9:16 (572×1024) : les étirer sur la
   * scène les déforme de moins de 1 %. Sur un écran haut, le décor grandit jusqu'à couvrir le ciel gagné en haut.
   */
  private layoutBackground(): void {
    if (!this.background || this.floorY <= 0) {
      return;
    }
    const scale = Math.max(1, (MINER_FEET_Y + this.extra()) / this.floorY);
    this.background.setSize(SCENE_WIDTH * scale, SCENE_HEIGHT * scale);
    this.background.position.set((SCENE_WIDTH - SCENE_WIDTH * scale) / 2, MINER_FEET_Y - this.floorY * scale);
  }

  private destroyApp(): void {
    this.miner = null;
    this.effects = null;
    this.background = null;
    this.staticBody = null;
    this.topDown = null;
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
