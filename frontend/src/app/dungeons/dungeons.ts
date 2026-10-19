import { computed, inject, Injectable, signal } from '@angular/core';

import { zoneMaterial } from '../balance/balance';
import { DUNGEON_UNLOCK_ZONE, DUNGEONS, DungeonId, dungeonReward } from '../balance/dungeons';
import { resolveHit } from '../equipment/equipment-rules';
import { Miner } from '../miner/miner';
import { dayKey } from '../missions/mission-rules';
import { Ores } from '../ores/ores';
import { Progression } from '../progression/progression';
import { CLOCK } from '../shared/clock';
import { readStorage, writeStorage } from '../shared/local-storage';
import { RANDOM } from '../shared/random';
import { GeodeShards } from '../wallet/geode-shards';
import {
  DungeonRun,
  DungeonState,
  EMPTY_DUNGEONS,
  isRunOver,
  isRunWon,
  isValidDungeonState,
  recordVictory,
  refillKeys,
  startRun,
  strikeRun,
} from './dungeon-rules';

const STORAGE_KEY = 'mine-explorer.donjons';

/** Ce qu'une victoire (ou un balayage) a rapporté. */
export interface DungeonPrize {
  readonly dungeon: DungeonId;
  readonly level: number;
  readonly amount: number;
  /** Libellé de la récompense : « éclats » ou le nom du minerai. */
  readonly what: 'shards' | 'ores';
}

/**
 * Donjons de ressources, dès la zone 4 : un rocher par niveau, 20 coups pour le casser, sans chrono. Une victoire
 * dépense une clé (2 par jour, jusqu'à 4), donne sa récompense et ouvre le niveau suivant ; une défaite ne coûte rien.
 * Le balayage rejoue instantanément le meilleur niveau battu.
 */
@Injectable({ providedIn: 'root' })
export class Dungeons {
  private readonly clock = inject(CLOCK);
  private readonly random = inject(RANDOM);
  private readonly miner = inject(Miner);
  private readonly progression = inject(Progression);
  private readonly shards = inject(GeodeShards);
  private readonly ores = inject(Ores);
  private readonly state = signal<DungeonState>(refillKeys(loadState(), dayKey(this.clock())));
  private readonly runState = signal<DungeonRun | null>(null);

  readonly unlocked = computed(() => this.progression.progress().zone >= DUNGEON_UNLOCK_ZONE);
  readonly unlockZone = DUNGEON_UNLOCK_ZONE;
  readonly keys = computed(() => this.state().keys);
  readonly best = computed(() => this.state().best);
  readonly run = this.runState.asReadonly();
  readonly lastPrize = signal<DungeonPrize | null>(null);

  /** Clés de tous les donjons, pour la carte des aventures. */
  readonly totalKeys = computed(() => Object.values(this.state().keys).reduce((sum, keys) => sum + keys, 0));

  /** Entre au niveau suivant le record (rejouable sans limite tant qu'il n'est pas battu). */
  enter(dungeon: DungeonId): boolean {
    this.refresh();
    if (!this.unlocked() || this.state().keys[dungeon] === 0) {
      return false;
    }
    this.lastPrize.set(null);
    this.runState.set(startRun(dungeon, this.state().best[dungeon] + 1));
    return true;
  }

  /** Un coup de pioche sur le rocher du donjon, avec la Frappe et les critiques du mineur (sans les sorts). */
  strike(): DungeonRun | null {
    const run = this.runState();
    if (run === null || isRunOver(run)) {
      return run;
    }
    const hit = resolveHit(this.miner.permanent().stats, this.random);
    const next = strikeRun(run, hit.damage);
    this.runState.set(next);
    if (isRunWon(next)) {
      this.win(next.dungeon, next.level);
    }
    return next;
  }

  /** Quitte la partie (victoire montrée, ou défaite : la clé reste). */
  leave(): void {
    this.runState.set(null);
  }

  /** Rejoue instantanément le meilleur niveau battu : sa récompense contre une clé. */
  sweep(dungeon: DungeonId): boolean {
    this.refresh();
    const level = this.state().best[dungeon];
    if (!this.unlocked() || level === 0 || this.state().keys[dungeon] === 0) {
      return false;
    }
    this.win(dungeon, level);
    return true;
  }

  private win(dungeon: DungeonId, level: number): void {
    const amount = dungeonReward(dungeon, level);
    if (DUNGEONS[dungeon].reward === 'shards') {
      this.shards.add(amount);
    } else {
      // Le minerai de la zone la plus profonde atteinte (la zone 1 n'en a pas : celui de la zone 2)
      const tier = zoneMaterial(Math.max(this.progression.progress().zone, 2));
      if (tier !== null) {
        this.ores.add(tier, amount);
      }
    }
    this.save(recordVictory(this.state(), dungeon, level));
    this.lastPrize.set({ dungeon, level, amount, what: DUNGEONS[dungeon].reward });
  }

  private refresh(): void {
    const next = refillKeys(this.state(), dayKey(this.clock()));
    if (next !== this.state()) {
      this.save(next);
    }
  }

  private save(next: DungeonState): void {
    this.state.set(next);
    writeStorage(STORAGE_KEY, JSON.stringify(next));
  }
}

function loadState(): DungeonState {
  const raw = readStorage(STORAGE_KEY);
  if (raw === null) {
    return EMPTY_DUNGEONS;
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (isValidDungeonState(value)) {
      return value;
    }
  } catch {
    // JSON illisible : traité comme une sauvegarde invalide juste en dessous
  }
  console.warn('Sauvegarde des donjons invalide ignorée');
  return EMPTY_DUNGEONS;
}
