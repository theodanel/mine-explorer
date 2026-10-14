import { Component, computed, effect, inject, signal } from '@angular/core';

import { Sound } from '../../audio/sound';
import { zoneMaterial } from '../../balance/balance';
import { RECORD_STEP_METERS, VIEW_METERS } from '../../balance/minecart';
import { TIER_LABELS } from '../../equipment/equipment.model';
import { Evolution } from '../../evolution/evolution';
import { EVOLUTION_VISUALS, materialIconUrl, MINECART_IMAGES, rockUrl } from '../../loading/game-assets';
import { Navigation } from '../../navigation/navigation';
import { Progression } from '../../progression/progression';
import { Minecart } from '../minecart';
import { ForkChoice, RideEvent, speedOf, ThingKind } from '../minecart-game';

const COMPACT = new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 });

/**
 * Perspective de la voie, en % de la zone de jeu : l'horizon en haut, le wagonnet en bas. Un objet lointain est
 * 4 fois plus petit qu'un objet tout proche, et les voies se resserrent vers l'horizon.
 */
const HORIZON_Y = 14;
const NEAR_Y = 84;
const FAR_SCALE = 0.25;
const LANE_SPACING = 30;
/** Traverses tous les 4 m : elles défilent et font sentir la vitesse. */
const SLEEPER_METERS = 4;
/** Un glissement plus court que ça est un simple toucher. */
const SWIPE_PX = 24;
const SHAKE_MS = 350;

function depthScale(ahead: number): number {
  const t = Math.min(Math.max(ahead / VIEW_METERS, 0), 1);
  return 1 / (1 + ((1 - FAR_SCALE) / FAR_SCALE) * t);
}

function screenY(scale: number): number {
  return HORIZON_Y + ((NEAR_Y - HORIZON_Y) * (scale - FAR_SCALE)) / (1 - FAR_SCALE);
}

function laneX(lane: number, scale: number): number {
  return 50 + (lane - 1) * LANE_SPACING * scale;
}

/** Wagonnet fou : la course vue de dos, les voies en perspective, et le bilan. */
@Component({
  selector: 'app-minecart-page',
  templateUrl: './minecart-page.html',
  styleUrl: './minecart-page.scss',
  host: { '(window:keydown)': 'onKey($event)' },
})
export class MinecartPage {
  protected readonly minecart = inject(Minecart);
  private readonly navigation = inject(Navigation);
  private readonly sound = inject(Sound);
  private readonly progression = inject(Progression);
  private readonly evolution = inject(Evolution);

  protected readonly images = MINECART_IMAGES;
  protected readonly recordStep = RECORD_STEP_METERS;
  protected readonly scene = `url(${MINECART_IMAGES.background})`;
  protected readonly portrait = computed(() => EVOLUTION_VISUALS[this.evolution.form().id].portraitUrl);
  protected readonly ore = computed(() => {
    const tier = zoneMaterial(this.progression.zone());
    return tier === null ? null : { icon: materialIconUrl(tier), label: TIER_LABELS[tier] };
  });
  private readonly icons = computed<Readonly<Record<Exclude<ThingKind, 'brokenRail'>, string>>>(() => ({
    rockfall: rockUrl(this.progression.zone()),
    bat: MINECART_IMAGES.bat,
    ore: this.ore()?.icon ?? MINECART_IMAGES.nugget,
    nugget: MINECART_IMAGES.nugget,
  }));

  protected readonly ride = this.minecart.ride;
  protected readonly hearts = computed(() => {
    const ride = this.ride();
    return ride === null ? [] : Array.from({ length: ride.maxHearts }, (_, index) => index < ride.hearts);
  });
  protected readonly meters = computed(() => Math.floor(this.ride()?.distance ?? 0));
  protected readonly speed = computed(() => {
    const ride = this.ride();
    return ride === null ? 0 : Math.round(speedOf(ride) * 3.6);
  });
  /** Les objets sur la voie, projetés en perspective, du plus lointain au plus proche. */
  protected readonly things = computed(() => {
    const ride = this.ride();
    if (ride === null) {
      return [];
    }
    return ride.things
      .map((thing) => {
        const scale = depthScale(thing.at - ride.distance);
        return {
          id: thing.id,
          kind: thing.kind,
          icon: thing.kind === 'brokenRail' ? null : this.icons()[thing.kind],
          left: laneX(thing.lane, scale),
          top: screenY(scale),
          scale,
        };
      })
      .sort((a, b) => a.scale - b.scale);
  });
  protected readonly sleepers = computed(() => {
    const distance = this.ride()?.distance ?? 0;
    const first = Math.ceil(distance / SLEEPER_METERS) * SLEEPER_METERS;
    return Array.from({ length: Math.ceil(VIEW_METERS / SLEEPER_METERS) }, (_, index) => {
      const scale = depthScale(first + index * SLEEPER_METERS - distance);
      return { y: screenY(scale), half: LANE_SPACING * 1.5 * scale };
    });
  });
  /** Bords des voies, de l'horizon jusqu'au wagonnet. */
  protected readonly rails = [-0.5, 0.5, 1.5, 2.5].map((edge) => ({
    x1: laneX(edge, 1),
    y1: NEAR_Y,
    x2: laneX(edge, FAR_SCALE),
    y2: HORIZON_Y,
  }));
  protected readonly cartLeft = computed(() => laneX(this.ride()?.lane ?? 1, 1));
  /** L'aiguillage qui arrive, quand il est en vue. */
  protected readonly fork = computed(() => {
    const ride = this.ride();
    if (ride === null || ride.fork.at - ride.distance > VIEW_METERS) {
      return null;
    }
    return { choice: ride.fork.choice, top: screenY(depthScale(ride.fork.at - ride.distance)) };
  });
  protected readonly shake = signal(false);
  protected readonly flash = signal<string | null>(null);
  private pointerStartX: number | null = null;

  constructor() {
    effect(() => {
      for (const event of this.ride()?.events ?? []) {
        this.react(event);
      }
    });
  }

  protected start(): void {
    if (this.minecart.start()) {
      this.sound.play('blast');
    }
  }

  protected steer(direction: -1 | 1): void {
    this.minecart.steer(direction);
  }

  protected choose(choice: ForkChoice): void {
    this.minecart.chooseFork(choice);
  }

  protected pointerDown(event: PointerEvent): void {
    this.pointerStartX = event.clientX;
  }

  /** Glisser à gauche ou à droite change de voie ; un simple toucher va du côté touché. */
  protected pointerUp(event: PointerEvent, track: HTMLElement): void {
    if (this.pointerStartX === null) {
      return;
    }
    const dx = event.clientX - this.pointerStartX;
    this.pointerStartX = null;
    if (Math.abs(dx) >= SWIPE_PX) {
      this.steer(dx < 0 ? -1 : 1);
      return;
    }
    const box = track.getBoundingClientRect();
    this.steer(event.clientX < box.left + box.width / 2 ? -1 : 1);
  }

  protected onKey(event: KeyboardEvent): void {
    if (this.ride() === null) {
      return;
    }
    if (event.key === 'ArrowLeft') {
      this.steer(-1);
    } else if (event.key === 'ArrowRight') {
      this.steer(1);
    }
  }

  protected compact(value: number): string {
    return COMPACT.format(value);
  }

  protected back(): void {
    this.navigation.open('adventures');
  }

  private react(event: RideEvent): void {
    switch (event.kind) {
      case 'hit':
        this.sound.play('rockBreak');
        this.shake.set(true);
        setTimeout(() => this.shake.set(false), SHAKE_MS);
        break;
      case 'pickup':
        this.sound.play(event.pickup === 'ore' ? 'shard' : 'sell');
        break;
      case 'fork':
        this.sound.play('upgrade');
        this.showFlash(event.choice === 'risky' ? 'Voie risquée !' : 'Voie sûre');
        break;
      case 'crash':
        this.sound.play('blast');
        break;
    }
  }

  private showFlash(text: string): void {
    this.flash.set(text);
    setTimeout(() => this.flash.set(null), 1200);
  }
}
