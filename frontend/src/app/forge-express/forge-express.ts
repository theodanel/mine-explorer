import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';

import { EVOLUTION_FORMS, TIER_ORDER, tierChances, tierIndex } from '../balance/balance';
import { BEST_TIER_SCORE, BONUS_TIER_SCORE, FORGE_EXPRESS_DAILY_RUNS, FORGE_EXPRESS_UNLOCK_FORM } from '../balance/forge-express';
import { rollItem } from '../equipment/equipment-rules';
import { Item, TierId } from '../equipment/equipment.model';
import { Inventory } from '../equipment/inventory';
import { Evolution } from '../evolution/evolution';
import { Forge } from '../forge/forge';
import { dayKey } from '../missions/mission-rules';
import { MissionCounters } from '../missions/mission-counters';
import { CLOCK } from '../shared/clock';
import { readStorage, writeStorage } from '../shared/local-storage';
import { ID_FACTORY, RANDOM } from '../shared/random';
import { isDone, Smithing, START_SMITHING, strike, tick } from './forge-express-game';

const STORAGE_KEY = 'mine-explorer.forge-express';
/** Une image par pas : la jauge de chaleur doit glisser sans à-coups. */
const TICK_MS = 16;

export const FORGE_EXPRESS_UNLOCK_INDEX = EVOLUTION_FORMS.findIndex((form) => form.id === FORGE_EXPRESS_UNLOCK_FORM);

interface DailyRuns {
  readonly day: string;
  readonly runsUsed: number;
}

export interface SmithingResult {
  readonly score: number;
  readonly item: Item;
  /** Qualité gagnée grâce au score, ou null pour un tirage de forge normal. */
  readonly boosted: 'best' | 'bonus' | null;
}

/** Meilleure qualité que la forge peut sortir à ce niveau de pioche. */
export function bestForgeTier(pickaxeLevel: number): TierId {
  const chances = tierChances(pickaxeLevel);
  return [...TIER_ORDER].reverse().find((tier) => chances[tier] > 0) ?? TIER_ORDER[0];
}

/** Qualité de l'objet bonus selon le score : la meilleure de la forge, voire une de plus, sinon un tirage normal. */
export function rewardTier(score: number, pickaxeLevel: number): { tier: TierId | undefined; boosted: SmithingResult['boosted'] } {
  const best = bestForgeTier(pickaxeLevel);
  if (score >= BONUS_TIER_SCORE) {
    return { tier: TIER_ORDER[Math.min(tierIndex(best) + 1, TIER_ORDER.length - 1)], boosted: 'bonus' };
  }
  return score >= BEST_TIER_SCORE ? { tier: best, boosted: 'best' } : { tier: undefined, boosted: null };
}

/**
 * Forge express : 3 parties par jour dès le Maître des profondeurs. La chaleur du lingot monte et descend ; le
 * joueur frappe quand elle passe dans la zone dorée, 10 fois. Un bon score donne un objet d'une meilleure qualité.
 */
@Injectable({ providedIn: 'root' })
export class ForgeExpress {
  private readonly clock = inject(CLOCK);
  private readonly random = inject(RANDOM);
  private readonly createId = inject(ID_FACTORY);
  private readonly evolution = inject(Evolution);
  private readonly inventory = inject(Inventory);
  private readonly forge = inject(Forge);
  private readonly missionCounters = inject(MissionCounters);
  private readonly runs = signal<DailyRuns>(loadRuns());
  private readonly today = signal(dayKey(this.clock()));
  private readonly smithingState = signal<Smithing | null>(null);
  private timer: ReturnType<typeof setInterval> | null = null;
  private lastTickAt = 0;

  readonly unlocked = computed(() => this.evolution.index() >= FORGE_EXPRESS_UNLOCK_INDEX);
  readonly unlockLabel = EVOLUTION_FORMS[FORGE_EXPRESS_UNLOCK_INDEX].label;
  readonly dailyRuns = FORGE_EXPRESS_DAILY_RUNS;
  readonly runsLeft = computed(() => {
    const runs = this.runs();
    return runs.day === this.today() ? Math.max(FORGE_EXPRESS_DAILY_RUNS - runs.runsUsed, 0) : FORGE_EXPRESS_DAILY_RUNS;
  });
  /** Un objet attend déjà d'être équipé ou vendu : l'objet gagné n'aurait pas de place. */
  readonly blocked = computed(() => this.inventory.pending() !== null);
  readonly smithing = this.smithingState.asReadonly();
  readonly lastResult = signal<SmithingResult | null>(null);

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stopLoop());
  }

  start(): boolean {
    const today = dayKey(this.clock());
    this.today.set(today);
    if (!this.unlocked() || this.smithingState() !== null || this.blocked() || this.runsLeft() === 0) {
      return false;
    }
    const runs = this.runs();
    this.save({ day: today, runsUsed: runs.day === today ? runs.runsUsed + 1 : 1 });
    this.missionCounters.record('adventureRuns');
    this.lastResult.set(null);
    this.smithingState.set(START_SMITHING);
    this.lastTickAt = this.clock();
    this.timer = setInterval(() => this.step(), TICK_MS);
    return true;
  }

  strike(): void {
    const smithing = this.smithingState();
    if (smithing === null) {
      return;
    }
    const next = strike(smithing);
    this.smithingState.set(next);
    if (isDone(next)) {
      this.finish(next);
    }
  }

  /** Ferme le bilan. */
  leave(): void {
    if (this.timer === null) {
      this.smithingState.set(null);
    }
  }

  private step(): void {
    const smithing = this.smithingState();
    if (smithing === null) {
      this.stopLoop();
      return;
    }
    const now = this.clock();
    this.smithingState.set(tick(smithing, now - this.lastTickAt));
    this.lastTickAt = now;
  }

  private finish(smithing: Smithing): void {
    this.stopLoop();
    const level = this.forge.level();
    const { tier, boosted } = rewardTier(smithing.score, level);
    const item = rollItem(this.random, this.createId, level, tier);
    this.inventory.receive(item);
    this.lastResult.set({ score: smithing.score, item, boosted });
  }

  private stopLoop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private save(next: DailyRuns): void {
    this.runs.set(next);
    writeStorage(STORAGE_KEY, JSON.stringify(next));
  }
}

function loadRuns(): DailyRuns {
  const raw = readStorage(STORAGE_KEY);
  if (raw === null) {
    return { day: '', runsUsed: 0 };
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value === 'object' && value !== null) {
      const { day, runsUsed } = value as Record<string, unknown>;
      if (typeof day === 'string' && Number.isSafeInteger(runsUsed) && (runsUsed as number) >= 0) {
        return { day, runsUsed: Math.min(runsUsed as number, FORGE_EXPRESS_DAILY_RUNS) };
      }
    }
  } catch {
    // JSON illisible : traité comme une sauvegarde invalide juste en dessous
  }
  console.warn('Sauvegarde de la Forge express invalide ignorée');
  return { day: '', runsUsed: 0 };
}
