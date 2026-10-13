import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';

import { ABYSS_DAILY_RUNS, ABYSS_RUN_MS, ABYSS_UNLOCK_FORM } from '../balance/abyss';
import { damagePerSecond, EVOLUTION_FORMS } from '../balance/balance';
import { Companions } from '../companions/companions';
import { Evolution } from '../evolution/evolution';
import { Miner } from '../miner/miner';
import { dayKey } from '../missions/mission-rules';
import { CLOCK } from '../shared/clock';
import { readStorage, writeStorage } from '../shared/local-storage';
import { GeodeShards } from '../wallet/geode-shards';
import { AbyssState, descend, Descent, EMPTY_ABYSS, isValidAbyssState, runReward, RunReward, runsLeft } from './abyss-rules';

const STORAGE_KEY = 'mine-explorer.abyss';
/** Rafraîchissement de la descente à l'écran : assez fluide pour voir les étages défiler. */
const TICK_MS = 100;

export const ABYSS_UNLOCK_INDEX = EVOLUTION_FORMS.findIndex((form) => form.id === ABYSS_UNLOCK_FORM);

export interface RunResult extends RunReward {
  readonly floors: number;
  readonly newRecord: boolean;
}

/**
 * Puits sans fond : 3 descentes chronométrées par jour. Le mineur casse des étages de plus en plus durs avec
 * sa Puissance du moment ; chaque étage franchi rapporte des éclats, chaque palier de record des pierres d'éveil.
 */
@Injectable({ providedIn: 'root' })
export class Abyss {
  private readonly clock = inject(CLOCK);
  private readonly evolution = inject(Evolution);
  private readonly miner = inject(Miner);
  private readonly shards = inject(GeodeShards);
  private readonly companions = inject(Companions);
  private readonly state = signal<AbyssState>(loadAbyss());
  private readonly now = signal(this.clock());
  private timer: ReturnType<typeof setInterval> | null = null;

  readonly unlocked = computed(() => this.evolution.index() >= ABYSS_UNLOCK_INDEX);
  readonly unlockLabel = EVOLUTION_FORMS[ABYSS_UNLOCK_INDEX].label;
  readonly record = computed(() => this.state().record);
  readonly dailyRuns = ABYSS_DAILY_RUNS;
  readonly runsLeft = computed(() => runsLeft(this.state(), dayKey(this.now())));
  readonly running = computed(() => this.state().active !== null);
  /** Descente en cours, recalculée à chaque battement, ou null. */
  readonly descent = computed<Descent | null>(() => {
    const active = this.state().active;
    if (active === null) {
      return null;
    }
    const elapsed = Math.min(Math.max(this.now() - active.startedAt, 0), ABYSS_RUN_MS);
    return descend((active.dps * elapsed) / 1000);
  });
  readonly timeLeftMs = computed(() => {
    const active = this.state().active;
    return active === null ? 0 : Math.max(ABYSS_RUN_MS - (this.now() - active.startedAt), 0);
  });
  /** Bilan de la dernière descente, montré jusqu'à la suivante. */
  readonly lastResult = signal<RunResult | null>(null);

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stopTicking());
    // Descente commencée avant un rechargement : elle reprend, ou se termine si son temps est écoulé
    if (this.state().active !== null) {
      this.startTicking();
    }
  }

  /** Lance une descente avec la Puissance permanente du mineur (les sorts ne descendent pas). */
  start(): boolean {
    const today = dayKey(this.clock());
    if (!this.unlocked() || this.running() || runsLeft(this.state(), today) === 0) {
      return false;
    }
    const current = this.state();
    const runsUsed = current.day === today ? current.runsUsed + 1 : 1;
    const dps = damagePerSecond(this.miner.permanent().stats);
    // L'essai compte dès le départ : quitter en pleine descente ne le rend pas
    this.save({ ...current, day: today, runsUsed, active: { startedAt: this.clock(), dps } });
    this.lastResult.set(null);
    this.startTicking();
    return true;
  }

  private tick(): void {
    this.now.set(this.clock());
    const active = this.state().active;
    if (active !== null && this.now() - active.startedAt >= ABYSS_RUN_MS) {
      this.finish();
    }
  }

  private finish(): void {
    const current = this.state();
    if (current.active === null) {
      return;
    }
    const { floors } = descend((current.active.dps * ABYSS_RUN_MS) / 1000);
    const reward = runReward(floors, current.record);
    if (reward.shards > 0) {
      this.shards.add(reward.shards);
    }
    if (reward.stones > 0) {
      this.companions.addStones(reward.stones);
    }
    this.save({ ...current, record: Math.max(current.record, floors), active: null });
    this.lastResult.set({ ...reward, floors, newRecord: floors > current.record });
    this.stopTicking();
  }

  private startTicking(): void {
    this.stopTicking();
    this.tick();
    if (this.state().active !== null) {
      this.timer = setInterval(() => this.tick(), TICK_MS);
    }
  }

  private stopTicking(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private save(next: AbyssState): void {
    this.state.set(next);
    writeStorage(STORAGE_KEY, JSON.stringify(next));
  }
}

function loadAbyss(): AbyssState {
  const raw = readStorage(STORAGE_KEY);
  if (raw === null) {
    return EMPTY_ABYSS;
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (isValidAbyssState(value)) {
      return value;
    }
  } catch {
    // JSON illisible : traité comme une sauvegarde invalide juste en dessous
  }
  console.warn('Sauvegarde du Puits sans fond invalide ignorée');
  return EMPTY_ABYSS;
}
