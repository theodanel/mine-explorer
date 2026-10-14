import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';

import { EVOLUTION_FORMS, powerOf, zoneMaterial } from '../balance/balance';
import { cartHearts, MINECART_DAILY_RUNS, MINECART_UNLOCK_FORM, nuggetGold, recordBonusGold } from '../balance/minecart';
import { Evolution } from '../evolution/evolution';
import { Miner } from '../miner/miner';
import { dayKey } from '../missions/mission-rules';
import { Ores } from '../ores/ores';
import { Progression } from '../progression/progression';
import { CLOCK } from '../shared/clock';
import { readStorage, writeStorage } from '../shared/local-storage';
import { RANDOM } from '../shared/random';
import { Wallet } from '../wallet/wallet';
import { chooseFork, ForkChoice, isOver, Ride, startRide, steer, tick } from './minecart-game';
import { EMPTY_MINECART, isValidMinecartState, MinecartState, rideReward, RideReward, runsLeft } from './minecart-rules';

const STORAGE_KEY = 'mine-explorer.minecart';
/** Pas de la boucle de jeu : assez fin pour des déplacements fluides, sans charger le téléphone. */
const TICK_MS = 33;

export const MINECART_UNLOCK_INDEX = EVOLUTION_FORMS.findIndex((form) => form.id === MINECART_UNLOCK_FORM);

export interface RideResult extends RideReward {
  readonly meters: number;
  readonly newRecord: boolean;
  /** Minerai gagné (celui de la zone), ou null s'il n'y en a pas. */
  readonly oreTier: ReturnType<typeof zoneMaterial>;
}

/** Ce que vaut le build du joueur pour une course, figé au départ. */
interface Rider {
  readonly nuggetGold: number;
  readonly zone: number;
  readonly stage: number;
}

/**
 * Wagonnet fou : 3 courses par jour. Le wagonnet dévale tout seul ; le joueur change de voie pour éviter éboulements,
 * rails cassés et chauves-souris, ramasse minerai et pépites, et choisit la voie sûre ou risquée aux aiguillages.
 * La Puissance donne la solidité du wagonnet, le bonus d'or la valeur des pépites.
 */
@Injectable({ providedIn: 'root' })
export class Minecart {
  private readonly clock = inject(CLOCK);
  private readonly random = inject(RANDOM);
  private readonly evolution = inject(Evolution);
  private readonly miner = inject(Miner);
  private readonly progression = inject(Progression);
  private readonly wallet = inject(Wallet);
  private readonly ores = inject(Ores);
  private readonly state = signal<MinecartState>(loadMinecart());
  private readonly today = signal(dayKey(this.clock()));
  private readonly rideState = signal<Ride | null>(null);
  private rider: Rider | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private lastTickAt = 0;

  readonly unlocked = computed(() => this.evolution.index() >= MINECART_UNLOCK_INDEX);
  readonly unlockLabel = EVOLUTION_FORMS[MINECART_UNLOCK_INDEX].label;
  readonly record = computed(() => this.state().record);
  readonly dailyRuns = MINECART_DAILY_RUNS;
  readonly runsLeft = computed(() => runsLeft(this.state(), this.today()));
  /** Course en cours, ou null. */
  readonly ride = this.rideState.asReadonly();
  readonly running = computed(() => this.rideState() !== null);
  /** Bilan de la dernière course, montré jusqu'à la suivante. */
  readonly lastResult = signal<RideResult | null>(null);
  /** Cœurs du wagonnet avec le build du moment, pour l'annoncer avant le départ. */
  readonly hearts = computed(() => {
    const { zone, stage } = this.progression.progress();
    return cartHearts(powerOf(this.miner.permanent().stats), zone, stage);
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stopLoop());
  }

  start(): boolean {
    const today = dayKey(this.clock());
    this.today.set(today);
    if (!this.unlocked() || this.running() || runsLeft(this.state(), today) === 0) {
      return false;
    }
    const current = this.state();
    // La course compte dès le départ : quitter en route ne la rend pas
    this.save({ ...current, day: today, runsUsed: current.day === today ? current.runsUsed + 1 : 1 });
    const { zone, stage } = this.progression.progress();
    this.rider = { nuggetGold: nuggetGold(zone, stage, this.miner.permanent().stats.goldBonus), zone, stage };
    this.lastResult.set(null);
    this.rideState.set(startRide(this.hearts()));
    this.lastTickAt = this.clock();
    this.timer = setInterval(() => this.step(), TICK_MS);
    return true;
  }

  steer(direction: -1 | 1): void {
    const ride = this.rideState();
    if (ride !== null) {
      this.rideState.set(steer(ride, direction));
    }
  }

  chooseFork(choice: ForkChoice): void {
    const ride = this.rideState();
    if (ride !== null) {
      this.rideState.set(chooseFork(ride, choice));
    }
  }

  private step(): void {
    const ride = this.rideState();
    if (ride === null || this.rider === null) {
      this.stopLoop();
      return;
    }
    const now = this.clock();
    const next = tick(ride, now - this.lastTickAt, this.random);
    this.lastTickAt = now;
    if (isOver(next)) {
      this.finish(next, this.rider);
    } else {
      this.rideState.set(next);
    }
  }

  private finish(ride: Ride, rider: Rider): void {
    this.stopLoop();
    const current = this.state();
    const meters = Math.floor(ride.distance);
    const reward = rideReward(meters, ride, current.record, rider.nuggetGold, (steps) =>
      recordBonusGold(rider.zone, rider.stage, steps),
    );
    const oreTier = zoneMaterial(rider.zone);
    if (reward.gold > 0) {
      this.wallet.add(reward.gold);
    }
    if (oreTier !== null && reward.ores > 0) {
      this.ores.add(oreTier, reward.ores);
    }
    this.save({ ...current, record: Math.max(current.record, meters) });
    this.rideState.set(null);
    this.rider = null;
    this.lastResult.set({ ...reward, meters, newRecord: meters > current.record, oreTier });
  }

  private stopLoop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private save(next: MinecartState): void {
    this.state.set(next);
    writeStorage(STORAGE_KEY, JSON.stringify(next));
  }
}

function loadMinecart(): MinecartState {
  const raw = readStorage(STORAGE_KEY);
  if (raw === null) {
    return EMPTY_MINECART;
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (isValidMinecartState(value)) {
      return value;
    }
  } catch {
    // JSON illisible : traité comme une sauvegarde invalide juste en dessous
  }
  console.warn('Sauvegarde du Wagonnet fou invalide ignorée');
  return EMPTY_MINECART;
}
