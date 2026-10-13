import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';

import { CHALLENGE_MILESTONES, ChallengeReward } from '../balance/challenge';
import { Companions } from '../companions/companions';
import { MissionCounters } from '../missions/mission-counters';
import { completeCounters, Counters, isValidCounters } from '../missions/mission-rules';
import { CLOCK } from '../shared/clock';
import { readStorage, writeStorage } from '../shared/local-storage';
import { GeodeShards } from '../wallet/geode-shards';
import { challengeEndsAt, challengePeriod, challengePoints, claimableMilestones } from './challenge-rules';

const STORAGE_KEY = 'mine-explorer.challenge';
/** Le compte à rebours et le passage au défi suivant se vérifient chaque seconde. */
const TICK_MS = 1000;

interface ChallengeState {
  readonly period: number;
  /** Compteurs au début du défi : les points se mesurent à partir d'eux. */
  readonly baseline: Counters;
  readonly claimed: readonly number[];
}

/**
 * Défi de la mine : tous les 3 jours, un nouveau défi où filons épuisés, forges et événements touchés
 * rapportent des points. Les paliers donnent œufs de compagnon, pierres d'éveil et éclats.
 * Un palier atteint et oublié est donné à la fin du défi : rien n'est perdu.
 */
@Injectable({ providedIn: 'root' })
export class Challenge {
  private readonly counters = inject(MissionCounters).counters;
  private readonly companions = inject(Companions);
  private readonly shards = inject(GeodeShards);
  private readonly clock = inject(CLOCK);
  private readonly state = signal<ChallengeState>(loadState(this.clock(), this.counters()));
  private readonly nowState = signal(this.clock());

  readonly points = computed(() => challengePoints(this.counters(), this.state().baseline));
  readonly claimed = computed(() => this.state().claimed);
  readonly claimable = computed(() => claimableMilestones(this.points(), this.claimed()));
  readonly endsAt = computed(() => challengeEndsAt(this.nowState()));
  readonly timeLeftMs = computed(() => Math.max(this.endsAt() - this.nowState(), 0));
  /** Le défi n'a de sens qu'une fois les compagnons ouverts : ses œufs servent à eux. */
  readonly unlocked = this.companions.unlocked;

  constructor() {
    this.rollOver();
    const timer = setInterval(() => {
      this.nowState.set(this.clock());
      this.rollOver();
    }, TICK_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  claim(index: number): ChallengeReward | null {
    if (!this.claimable().includes(index)) {
      return null;
    }
    const reward = CHALLENGE_MILESTONES[index].reward;
    this.grant(reward);
    this.save({ ...this.state(), claimed: [...this.claimed(), index] });
    return reward;
  }

  /** Nouveau défi : les paliers oubliés de l'ancien sont donnés, puis le compteur repart de zéro. */
  private rollOver(): void {
    const period = challengePeriod(this.clock());
    if (period === this.state().period) {
      return;
    }
    if (this.unlocked()) {
      for (const index of this.claimable()) {
        this.grant(CHALLENGE_MILESTONES[index].reward);
      }
    }
    this.save({ period, baseline: this.counters(), claimed: [] });
  }

  private grant(reward: ChallengeReward): void {
    switch (reward.kind) {
      case 'egg':
        this.companions.addEgg(reward.minRarity);
        break;
      case 'stones':
        this.companions.addStones(reward.amount);
        break;
      case 'shards':
        this.shards.add(reward.amount);
        break;
    }
  }

  private save(next: ChallengeState): void {
    this.state.set(next);
    writeStorage(STORAGE_KEY, JSON.stringify(next));
  }
}

function loadState(now: number, counters: Counters): ChallengeState {
  const fresh: ChallengeState = { period: challengePeriod(now), baseline: counters, claimed: [] };
  const raw = readStorage(STORAGE_KEY);
  if (raw === null) {
    return fresh;
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value === 'object' && value !== null) {
      const { period, baseline, claimed } = value as Record<string, unknown>;
      const fullBaseline = completeCounters(baseline);
      if (
        Number.isSafeInteger(period) &&
        isValidCounters(fullBaseline) &&
        Array.isArray(claimed) &&
        claimed.every((index) => Number.isSafeInteger(index) && index >= 0 && index < CHALLENGE_MILESTONES.length)
      ) {
        return { period: period as number, baseline: fullBaseline, claimed: claimed as number[] };
      }
    }
  } catch {
    // JSON illisible : traité comme une sauvegarde invalide juste en dessous
  }
  console.warn('Sauvegarde du Défi de la mine invalide ignorée');
  return fresh;
}
