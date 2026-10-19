import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';

import { MAX_PICKAXE_LEVEL, SEGMENTS_PER_LEVEL, segmentCost, tierChances, upgradeDurationMs } from '../balance/balance';
import { MissionCounters } from '../missions/mission-counters';
import { CLOCK } from '../shared/clock';
import { readStorage, writeStorage } from '../shared/local-storage';
import { Wallet } from '../wallet/wallet';
import {
  addSegment,
  canBuySegment,
  completeUpgrade,
  isUpgrading,
  isValidPickaxeState,
  migratePickaxeState,
  PickaxeState,
  shortenUpgrade,
  START_PICKAXE,
  upgradeTimeLeftMs,
} from './pickaxe-rules';

const STORAGE_KEY = 'mine-explorer.pickaxe';
/** Rafraîchit le compte à rebours affiché et termine l'amélioration dès que son heure est passée. */
const TICK_MS = 1000;

/**
 * La pioche de la Forge : son niveau décide seul du palier des objets forgés.
 * L'or remplit 10 segments, puis un minuteur fait passer au niveau suivant, comme dans Forge Master.
 */
@Injectable({ providedIn: 'root' })
export class Forge {
  private readonly wallet = inject(Wallet);
  private readonly clock = inject(CLOCK);
  private readonly missionCounters = inject(MissionCounters);
  private readonly state = signal<PickaxeState>(loadState());
  private readonly now = signal(this.clock());
  private readonly shortcut = signal<{ readonly key: number; readonly savedMs: number } | null>(null);
  private shortcutCount = 0;

  readonly level = computed(() => this.state().level);
  readonly segments = computed(() => this.state().segments);
  readonly segmentsPerLevel = SEGMENTS_PER_LEVEL;
  readonly maxLevel = MAX_PICKAXE_LEVEL;
  readonly upgrading = computed(() => isUpgrading(this.state()));
  readonly upgradeTimeLeftMs = computed(() => upgradeTimeLeftMs(this.state(), this.now()));
  /** Durée du prochain minuteur, pour l'annoncer avant que le joueur paie le dernier segment. */
  readonly nextUpgradeDurationMs = computed(() =>
    this.level() < MAX_PICKAXE_LEVEL ? upgradeDurationMs(this.level()) : null,
  );
  readonly segmentCost = computed(() => (canBuySegment(this.state()) ? segmentCost(this.level()) : null));
  readonly canPaySegment = computed(() => {
    const cost = this.segmentCost();
    return cost !== null && this.wallet.coins() >= cost;
  });
  readonly tierChances = computed(() => tierChances(this.level()));
  /** Dernier temps gagné sur l'amélioration en jouant, pour faire sauter le minuteur à l'écran. */
  readonly lastShortcut = this.shortcut.asReadonly();

  constructor() {
    // Une amélioration finie pendant que le jeu était fermé est validée dès le chargement
    this.tick();
    const timer = setInterval(() => this.tick(), TICK_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  /** Paie un segment. Le dixième lance le minuteur d'amélioration. */
  paySegment(): boolean {
    const cost = this.segmentCost();
    if (cost === null || !this.wallet.spend(cost)) {
      return false;
    }
    this.save(addSegment(this.state(), this.clock()));
    this.missionCounters.record('segmentsPaid');
    return true;
  }

  /** Un filon épuisé ou un gardien battu : l'amélioration en cours avance. */
  shortenUpgrade(guardian: boolean): void {
    const { state, savedMs } = shortenUpgrade(this.state(), this.clock(), guardian);
    if (savedMs > 0) {
      this.save(state);
      this.shortcut.set({ key: ++this.shortcutCount, savedMs });
      this.tick();
    }
  }

  tick(): void {
    const now = this.clock();
    this.now.set(now);
    const next = completeUpgrade(this.state(), now);
    if (next !== this.state()) {
      this.save(next);
    }
  }

  private save(next: PickaxeState): void {
    this.state.set(next);
    writeStorage(STORAGE_KEY, JSON.stringify(next));
  }
}

function loadState(): PickaxeState {
  const raw = readStorage(STORAGE_KEY);
  if (raw === null) {
    return START_PICKAXE;
  }
  try {
    const value = migratePickaxeState(JSON.parse(raw));
    if (isValidPickaxeState(value)) {
      return value;
    }
  } catch {
    // JSON illisible : traité comme une sauvegarde invalide juste en dessous
  }
  console.warn('Sauvegarde de la pioche invalide ignorée');
  return START_PICKAXE;
}
