import { computed, inject, Injectable, signal } from '@angular/core';

import { EVOLUTION_FORMS, goldForDamage, powerOf, rockHp } from '../balance/balance';
import type { Rarity } from '../balance/skill-tree';
import {
  monsterSteps,
  STARTING_STEPS,
  TORCHLIGHT_DAILY_RUNS,
  TORCHLIGHT_UNLOCK_FORM,
  torchRadius,
  TREASURE_EGG_CHANCE,
  TREASURE_LOOT,
} from '../balance/torchlight';
import { Companions } from '../companions/companions';
import { Evolution } from '../evolution/evolution';
import { Miner } from '../miner/miner';
import { dayKey } from '../missions/mission-rules';
import { MissionCounters } from '../missions/mission-counters';
import { Progression } from '../progression/progression';
import { CLOCK } from '../shared/clock';
import { readStorage, writeStorage } from '../shared/local-storage';
import { RANDOM } from '../shared/random';
import { Wallet } from '../wallet/wallet';
import { Expedition, ExpeditionStatus, generateCave, isOver, leaveCave, startExpedition, step } from './torchlight-game';

const STORAGE_KEY = 'mine-explorer.torchlight';
/** L'œuf du trésor est au moins rare : c'est le coffre rare promis par l'aventure. */
const TREASURE_EGG_RARITY: Rarity = 'rare';

export const TORCHLIGHT_UNLOCK_INDEX = EVOLUTION_FORMS.findIndex((form) => form.id === TORCHLIGHT_UNLOCK_FORM);

interface DailyRuns {
  readonly day: string;
  readonly runsUsed: number;
}

export interface ExpeditionResult {
  readonly status: ExpeditionStatus;
  readonly stones: number;
  readonly gold: number;
  /** Rareté de l'œuf trouvé dans le trésor, ou null. */
  readonly egg: Rarity | null;
}

/**
 * Expédition aux flambeaux : 2 par jour dès la Légende. La grotte est noire, la torche n'éclaire qu'autour du mineur ;
 * 30 pas pour trouver le trésor, en ramassant pierres d'éveil et coffres, et en évitant les monstres.
 */
@Injectable({ providedIn: 'root' })
export class Torchlight {
  private readonly clock = inject(CLOCK);
  private readonly random = inject(RANDOM);
  private readonly evolution = inject(Evolution);
  private readonly miner = inject(Miner);
  private readonly progression = inject(Progression);
  private readonly companions = inject(Companions);
  private readonly wallet = inject(Wallet);
  private readonly missionCounters = inject(MissionCounters);
  private readonly runs = signal<DailyRuns>(loadRuns());
  private readonly today = signal(dayKey(this.clock()));
  private readonly expeditionState = signal<Expedition | null>(null);
  /** Valeur d'un filon d'or, figée au départ de l'expédition. */
  private stageValue = 0;

  readonly unlocked = computed(() => this.evolution.index() >= TORCHLIGHT_UNLOCK_INDEX);
  readonly unlockLabel = EVOLUTION_FORMS[TORCHLIGHT_UNLOCK_INDEX].label;
  readonly dailyRuns = TORCHLIGHT_DAILY_RUNS;
  readonly runsLeft = computed(() => {
    const runs = this.runs();
    return runs.day === this.today() ? Math.max(TORCHLIGHT_DAILY_RUNS - runs.runsUsed, 0) : TORCHLIGHT_DAILY_RUNS;
  });
  readonly expedition = this.expeditionState.asReadonly();
  readonly lastResult = signal<ExpeditionResult | null>(null);
  /** Rayon de la torche, annoncé avant de partir. */
  readonly radius = computed(() => torchRadius(this.miner.permanent().stats.goldBonus));
  /** Pas qu'arrache un monstre, annoncés avant de partir. */
  readonly monsterCost = computed(() => {
    const { zone, stage } = this.progression.progress();
    return monsterSteps(powerOf(this.miner.permanent().stats), zone, stage);
  });

  start(): boolean {
    const today = dayKey(this.clock());
    this.today.set(today);
    if (!this.unlocked() || this.expeditionState() !== null || this.runsLeft() === 0) {
      return false;
    }
    const runs = this.runs();
    // L'expédition compte dès le départ : rentrer en route ne la rend pas
    this.save({ day: today, runsUsed: runs.day === today ? runs.runsUsed + 1 : 1 });
    this.missionCounters.record('adventureRuns');
    const { zone, stage } = this.progression.progress();
    this.stageValue = goldForDamage(rockHp(zone, stage), this.miner.permanent().stats.goldBonus);
    this.lastResult.set(null);
    this.expeditionState.set(startExpedition(generateCave(this.random), STARTING_STEPS, this.radius(), this.monsterCost()));
    return true;
  }

  /** Un pas vers une case voisine. */
  stepTo(index: number): void {
    const expedition = this.expeditionState();
    if (expedition === null) {
      return;
    }
    const next = step(expedition, index, this.random);
    this.expeditionState.set(next);
    if (next !== expedition && isOver(next)) {
      this.finish(next);
    }
  }

  /** Rentrer avant la fin de la torche, avec ce qu'on a ramassé. */
  goBack(): void {
    const expedition = this.expeditionState();
    if (expedition !== null && !isOver(expedition)) {
      const next = leaveCave(expedition);
      this.expeditionState.set(next);
      this.finish(next);
    }
  }

  /** Ferme le bilan : on revient à l'accueil. */
  leave(): void {
    const expedition = this.expeditionState();
    if (expedition !== null && isOver(expedition)) {
      this.expeditionState.set(null);
    }
  }

  private finish(expedition: Expedition): void {
    const treasure = expedition.status === 'treasure';
    const stones = expedition.stones + (treasure ? TREASURE_LOOT.stones : 0);
    const goldStages = expedition.goldStages + (treasure ? TREASURE_LOOT.goldStages : 0);
    const gold = Math.round(goldStages * this.stageValue);
    if (stones > 0) {
      this.companions.addStones(stones);
    }
    if (gold > 0) {
      this.wallet.add(gold);
    }
    const egg = treasure && this.random() < TREASURE_EGG_CHANCE ? this.companions.addEgg(TREASURE_EGG_RARITY) : null;
    this.lastResult.set({ status: expedition.status, stones, gold, egg });
  }

  private save(next: DailyRuns): void {
    this.runs.set(next);
    writeStorage(STORAGE_KEY, JSON.stringify(next));
  }
}

export function isValidTorchlightState(value: unknown): value is DailyRuns {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  const { day, runsUsed } = value as Record<string, unknown>;
  return (
    typeof day === 'string' &&
    (day === '' || /^\d{4}-\d{2}-\d{2}$/.test(day)) &&
    Number.isSafeInteger(runsUsed) &&
    (runsUsed as number) >= 0 &&
    (runsUsed as number) <= TORCHLIGHT_DAILY_RUNS
  );
}

function loadRuns(): DailyRuns {
  const empty: DailyRuns = { day: '', runsUsed: 0 };
  const raw = readStorage(STORAGE_KEY);
  if (raw === null) {
    return empty;
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (isValidTorchlightState(value)) {
      return value;
    }
  } catch {
    // JSON illisible : traité comme une sauvegarde invalide juste en dessous
  }
  console.warn("Sauvegarde de l'Expédition aux flambeaux invalide ignorée");
  return empty;
}
