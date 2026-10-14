import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';

import { ABYSS_DAILY_RUNS, ABYSS_UNLOCK_FORM } from '../balance/abyss';
import { EVOLUTION_FORMS, hitsPerSecond } from '../balance/balance';
import { SPELLS, SpellId } from '../balance/skill-tree';
import { Companions } from '../companions/companions';
import { Evolution } from '../evolution/evolution';
import { Miner } from '../miner/miner';
import { dayKey } from '../missions/mission-rules';
import { Progression } from '../progression/progression';
import { CLOCK } from '../shared/clock';
import { readStorage, writeStorage } from '../shared/local-storage';
import { RANDOM } from '../shared/random';
import { Skills } from '../skills/skills';
import { GeodeShards } from '../wallet/geode-shards';
import { cast, Fighter, Game, isOver, startGame, tap, tick } from './abyss-game';
import { AbyssState, EMPTY_ABYSS, isValidAbyssState, runReward, RunReward, runsLeft } from './abyss-rules';
import { MissionCounters } from '../missions/mission-counters';

const STORAGE_KEY = 'mine-explorer.abyss';
/** Pas de la boucle de jeu : assez fin pour la mèche et le combo, sans charger le téléphone. */
const TICK_MS = 50;

export const ABYSS_UNLOCK_INDEX = EVOLUTION_FORMS.findIndex((form) => form.id === ABYSS_UNLOCK_FORM);

export interface RunResult extends RunReward {
  readonly floors: number;
  readonly newRecord: boolean;
}

export interface AbyssSpell {
  readonly id: SpellId;
  readonly label: string;
  readonly used: boolean;
}

/**
 * Puits sans fond : 3 descentes de 30 s par jour, en mini-jeu. Le mineur frappe seul, le joueur touche le rocher
 * pour frapper plus (avec combo), vise les points faibles, désamorce les pièges et attrape le temps qui tombe.
 */
@Injectable({ providedIn: 'root' })
export class Abyss {
  private readonly clock = inject(CLOCK);
  private readonly random = inject(RANDOM);
  private readonly missionCounters = inject(MissionCounters);
  private readonly evolution = inject(Evolution);
  private readonly miner = inject(Miner);
  private readonly progression = inject(Progression);
  private readonly skills = inject(Skills);
  private readonly shards = inject(GeodeShards);
  private readonly companions = inject(Companions);
  private readonly state = signal<AbyssState>(loadAbyss());
  private readonly today = signal(dayKey(this.clock()));
  private readonly gameState = signal<Game | null>(null);
  private fighter: Fighter | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private lastTickAt = 0;

  readonly unlocked = computed(() => this.evolution.index() >= ABYSS_UNLOCK_INDEX);
  readonly unlockLabel = EVOLUTION_FORMS[ABYSS_UNLOCK_INDEX].label;
  readonly record = computed(() => this.state().record);
  readonly dailyRuns = ABYSS_DAILY_RUNS;
  readonly runsLeft = computed(() => runsLeft(this.state(), this.today()));
  /** Partie en cours, ou null. */
  readonly game = this.gameState.asReadonly();
  readonly running = computed(() => this.gameState() !== null);
  /** Bilan de la dernière descente, montré jusqu'à la suivante. */
  readonly lastResult = signal<RunResult | null>(null);
  /** Sorts équipés, utilisables une fois chacun par descente. */
  readonly spells = computed<readonly AbyssSpell[]>(() => {
    const used = this.gameState()?.spellsUsed ?? [];
    return this.skills
      .equipped()
      .filter((id): id is SpellId => id !== null)
      .map((id) => ({ id, label: SPELLS[id].label, used: used.includes(id) }));
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stopLoop());
    // Une descente de l'ancienne version (sans jeu) restée dans la sauvegarde : elle est simplement close
    if (this.state().active !== null) {
      this.save({ ...this.state(), active: null });
    }
  }

  start(): boolean {
    const today = dayKey(this.clock());
    this.today.set(today);
    if (!this.unlocked() || this.running() || runsLeft(this.state(), today) === 0) {
      return false;
    }
    const current = this.state();
    // L'essai compte dès le départ : quitter en pleine descente ne le rend pas
    this.save({ ...current, day: today, runsUsed: current.day === today ? current.runsUsed + 1 : 1 });
    this.missionCounters.record('adventureRuns');
    const { stats } = this.miner.permanent();
    this.fighter = {
      strike: stats.strikePower,
      critChance: stats.critChance,
      critDamage: stats.critDamage,
      hitsPerSecond: hitsPerSecond(stats),
      zone: this.progression.zone(),
    };
    this.lastResult.set(null);
    this.gameState.set(startGame(this.fighter, this.random));
    this.lastTickAt = this.clock();
    this.timer = setInterval(() => this.step(), TICK_MS);
    return true;
  }

  tap(target: 'rock' | 'weak' | 'crystal'): void {
    const game = this.gameState();
    if (game !== null && this.fighter !== null) {
      this.gameState.set(tap(game, target, this.fighter, this.random));
    }
  }

  cast(spell: SpellId): void {
    const game = this.gameState();
    if (game !== null && this.fighter !== null) {
      this.gameState.set(cast(game, SPELLS[spell], this.skills.spellRank(spell), this.fighter, this.random));
    }
  }

  private step(): void {
    const game = this.gameState();
    if (game === null || this.fighter === null) {
      this.stopLoop();
      return;
    }
    const now = this.clock();
    const next = tick(game, now - this.lastTickAt, this.fighter, this.random);
    this.lastTickAt = now;
    if (isOver(next)) {
      this.finish(next);
    } else {
      this.gameState.set(next);
    }
  }

  private finish(game: Game): void {
    this.stopLoop();
    const current = this.state();
    const floors = game.floorsCleared;
    const reward = runReward(floors, game.shards, current.record);
    if (reward.shards > 0) {
      this.shards.add(reward.shards);
    }
    if (reward.stones > 0) {
      this.companions.addStones(reward.stones);
    }
    this.save({ ...current, record: Math.max(current.record, floors) });
    this.gameState.set(null);
    this.fighter = null;
    this.lastResult.set({ ...reward, floors, newRecord: floors > current.record });
  }

  private stopLoop(): void {
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
