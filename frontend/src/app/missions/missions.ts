import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';

import { Forge } from '../forge/forge';
import { Progression } from '../progression/progression';
import { CLOCK } from '../shared/clock';
import { readStorage, writeStorage } from '../shared/local-storage';
import { GeodeShards } from '../wallet/geode-shards';
import { Wallet } from '../wallet/wallet';
import { MissionCounters } from './mission-counters';
import {
  Counters,
  DAILY_CHEST_REWARD,
  DAILY_MISSIONS,
  dayKey,
  Gauges,
  isComplete,
  isValidCounters,
  mainMission,
  MissionDef,
  missionProgress,
  MissionReward,
  completeCounters,
} from './mission-rules';

const STORAGE_KEY = 'mine-explorer.missions';
/** Vérifie le passage à minuit pendant que le jeu reste ouvert. */
const DAY_CHECK_MS = 60_000;

interface MissionsState {
  readonly mainIndex: number;
  /** Compteurs au début de la mission principale en cours. */
  readonly mainBaseline: Counters;
  readonly day: string;
  /** Compteurs au début de la journée. */
  readonly dayBaseline: Counters;
  readonly dailyClaimed: readonly string[];
  readonly chestClaimed: boolean;
}

export interface MissionView {
  readonly mission: MissionDef;
  readonly progress: number;
  readonly complete: boolean;
  readonly claimed: boolean;
}

/** Missions principale et du jour : avancement, récompenses et remise à zéro quotidienne. */
@Injectable({ providedIn: 'root' })
export class Missions {
  private readonly counters = inject(MissionCounters).counters;
  private readonly progression = inject(Progression);
  private readonly forge = inject(Forge);
  private readonly wallet = inject(Wallet);
  private readonly shards = inject(GeodeShards);
  private readonly clock = inject(CLOCK);
  private readonly state = signal<MissionsState>(loadState(this.counters(), dayKey(this.clock())));

  private readonly gauges = computed<Gauges>(() => ({
    stagesReached: this.progression.stagesReached(),
    pickaxeLevel: this.forge.level(),
  }));

  readonly main = computed<MissionView>(() => {
    const { mainIndex, mainBaseline } = this.state();
    return this.view(mainMission(mainIndex), mainBaseline, false);
  });

  readonly daily = computed<readonly MissionView[]>(() => {
    const { dayBaseline, dailyClaimed } = this.state();
    return DAILY_MISSIONS.map((mission) => this.view(mission, dayBaseline, dailyClaimed.includes(mission.id)));
  });

  readonly chestReady = computed(
    () => !this.state().chestClaimed && this.daily().every((mission) => mission.claimed),
  );
  readonly chestClaimed = computed(() => this.state().chestClaimed);
  readonly chestReward = DAILY_CHEST_REWARD;

  /** Nombre de récompenses à récupérer, pour la pastille du bouton Missions. */
  readonly claimableCount = computed(
    () =>
      (this.main().complete ? 1 : 0) +
      this.daily().filter((mission) => mission.complete && !mission.claimed).length +
      (this.chestReady() ? 1 : 0),
  );

  constructor() {
    const timer = setInterval(() => this.rolloverDay(), DAY_CHECK_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  claimMain(): void {
    if (!this.main().complete) {
      return;
    }
    this.grant(this.main().mission.reward);
    this.save({ ...this.state(), mainIndex: this.state().mainIndex + 1, mainBaseline: this.counters() });
  }

  claimDaily(id: string): void {
    const mission = this.daily().find((view) => view.mission.id === id);
    if (!mission?.complete || mission.claimed) {
      return;
    }
    this.grant(mission.mission.reward);
    this.save({ ...this.state(), dailyClaimed: [...this.state().dailyClaimed, id] });
  }

  claimChest(): void {
    if (!this.chestReady()) {
      return;
    }
    this.grant(DAILY_CHEST_REWARD);
    this.save({ ...this.state(), chestClaimed: true });
  }

  /** Nouvelle journée : nouvelles missions du jour, mesurées à partir de maintenant. */
  rolloverDay(): void {
    const today = dayKey(this.clock());
    if (this.state().day !== today) {
      this.save({ ...this.state(), ...freshDay(today, this.counters()) });
    }
  }

  private view(mission: MissionDef, baseline: Counters, claimed: boolean): MissionView {
    const counters = this.counters();
    const gauges = this.gauges();
    return {
      mission,
      progress: missionProgress(mission, counters, baseline, gauges),
      complete: isComplete(mission, counters, baseline, gauges),
      claimed,
    };
  }

  private grant(reward: MissionReward): void {
    if (reward.shards > 0) {
      this.shards.add(reward.shards);
    }
    if (reward.gold > 0) {
      this.wallet.add(reward.gold);
    }
  }

  private save(next: MissionsState): void {
    this.state.set(next);
    writeStorage(STORAGE_KEY, JSON.stringify(next));
  }
}

function freshDay(day: string, counters: Counters): Pick<MissionsState, 'day' | 'dayBaseline' | 'dailyClaimed' | 'chestClaimed'> {
  return { day, dayBaseline: counters, dailyClaimed: [], chestClaimed: false };
}

function loadState(counters: Counters, today: string): MissionsState {
  const fresh: MissionsState = { mainIndex: 0, mainBaseline: counters, ...freshDay(today, counters) };
  const raw = readStorage(STORAGE_KEY);
  if (raw === null) {
    return fresh;
  }
  try {
    const value = migrateState(JSON.parse(raw));
    if (isValidState(value)) {
      return value.day === today ? value : { ...value, ...freshDay(today, counters) };
    }
  } catch {
    // JSON illisible : traité comme une sauvegarde invalide juste en dessous
  }
  console.warn('Sauvegarde des missions invalide ignorée');
  return fresh;
}

/** Les points de départ des missions gagnent aussi les compteurs ajoutés depuis la sauvegarde. */
function migrateState(value: unknown): unknown {
  if (typeof value !== 'object' || value === null) {
    return value;
  }
  const state = value as Record<string, unknown>;
  return { ...state, mainBaseline: completeCounters(state['mainBaseline']), dayBaseline: completeCounters(state['dayBaseline']) };
}

function isValidState(value: unknown): value is MissionsState {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const state = value as Record<string, unknown>;
  return (
    Number.isSafeInteger(state['mainIndex']) &&
    (state['mainIndex'] as number) >= 0 &&
    isValidCounters(state['mainBaseline']) &&
    typeof state['day'] === 'string' &&
    isValidCounters(state['dayBaseline']) &&
    Array.isArray(state['dailyClaimed']) &&
    state['dailyClaimed'].every((id) => typeof id === 'string') &&
    typeof state['chestClaimed'] === 'boolean'
  );
}
