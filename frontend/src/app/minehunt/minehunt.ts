import { computed, inject, Injectable, signal } from '@angular/core';

import { EVOLUTION_FORMS, powerOf, zoneMaterial } from '../balance/balance';
import { MINEHUNT_DAILY_RUNS, MINEHUNT_UNLOCK_FORM, propsFor, stageGold } from '../balance/minehunt';
import type { TierId } from '../equipment/equipment.model';
import { Evolution } from '../evolution/evolution';
import { Miner } from '../miner/miner';
import { dayKey } from '../missions/mission-rules';
import { MissionCounters } from '../missions/mission-counters';
import { Ores } from '../ores/ores';
import { Progression } from '../progression/progression';
import { CLOCK } from '../shared/clock';
import { readStorage, writeStorage } from '../shared/local-storage';
import { RANDOM } from '../shared/random';
import { Wallet } from '../wallet/wallet';
import { breakRock, cashOut, Gamble, GambleStatus, isOver, startGamble } from './minehunt-game';
import { EMPTY_MINEHUNT, isValidMinehuntState, MinehuntState, runsLeft } from './minehunt-rules';

const STORAGE_KEY = 'mine-explorer.minehunt';

export const MINEHUNT_UNLOCK_INDEX = EVOLUTION_FORMS.findIndex((form) => form.id === MINEHUNT_UNLOCK_FORM);

export interface HuntResult {
  readonly status: GambleStatus;
  readonly ores: number;
  readonly gold: number;
  readonly rocks: number;
  readonly oreTier: TierId | null;
}

/**
 * Chasse au filon, en « Quitte ou double » : 3 parties par jour. Une file de rochers à casser l'un après l'autre ;
 * la cagnotte grossit, le risque d'éboulement aussi, et le joueur choisit quand encaisser.
 */
@Injectable({ providedIn: 'root' })
export class Minehunt {
  private readonly clock = inject(CLOCK);
  private readonly random = inject(RANDOM);
  private readonly evolution = inject(Evolution);
  private readonly miner = inject(Miner);
  private readonly progression = inject(Progression);
  private readonly wallet = inject(Wallet);
  private readonly ores = inject(Ores);
  private readonly missionCounters = inject(MissionCounters);
  private readonly state = signal<MinehuntState>(loadMinehunt());
  private readonly today = signal(dayKey(this.clock()));
  private readonly gambleState = signal<Gamble | null>(null);
  /** Valeur d'un filon d'or, figée au départ de la partie. */
  private stageValue = 0;

  readonly unlocked = computed(() => this.evolution.index() >= MINEHUNT_UNLOCK_INDEX);
  readonly unlockLabel = EVOLUTION_FORMS[MINEHUNT_UNLOCK_INDEX].label;
  readonly dailyRuns = MINEHUNT_DAILY_RUNS;
  readonly runsLeft = computed(() => runsLeft(this.state(), this.today()));
  readonly gamble = this.gambleState.asReadonly();
  readonly lastResult = signal<HuntResult | null>(null);
  /** Étais apportés par la Puissance du moment, annoncés avant de descendre. */
  readonly props = computed(() => {
    const { zone, stage } = this.progression.progress();
    return propsFor(powerOf(this.miner.permanent().stats), zone, stage);
  });
  /** Or de la cagnotte en cours, en pièces. */
  readonly potGold = computed(() => Math.round((this.gambleState()?.goldStages ?? 0) * this.stageValue));

  start(): boolean {
    const today = dayKey(this.clock());
    this.today.set(today);
    if (!this.unlocked() || this.gambleState() !== null || runsLeft(this.state(), today) === 0) {
      return false;
    }
    const current = this.state();
    // La partie compte dès le départ : quitter en route ne la rend pas
    this.save({ day: today, runsUsed: current.day === today ? current.runsUsed + 1 : 1 });
    this.missionCounters.record('adventureRuns');
    const { zone, stage } = this.progression.progress();
    const goldBonus = this.miner.permanent().stats.goldBonus;
    this.stageValue = stageGold(zone, stage, goldBonus);
    this.lastResult.set(null);
    this.gambleState.set(startGamble(this.props(), goldBonus));
    return true;
  }

  /** Casse le rocher suivant. */
  breakNext(): void {
    const gamble = this.gambleState();
    if (gamble === null) {
      return;
    }
    const next = breakRock(gamble, this.random);
    this.gambleState.set(next);
    if (isOver(next)) {
      this.finish(next);
    }
  }

  /** Encaisse la cagnotte. */
  cashOut(): void {
    const gamble = this.gambleState();
    if (gamble !== null && !isOver(gamble)) {
      const next = cashOut(gamble);
      this.gambleState.set(next);
      this.finish(next);
    }
  }

  /** Ferme le bilan : on revient à l'accueil. */
  leave(): void {
    const gamble = this.gambleState();
    if (gamble !== null && isOver(gamble)) {
      this.gambleState.set(null);
    }
  }

  private finish(gamble: Gamble): void {
    const gold = Math.round(gamble.goldStages * this.stageValue);
    const oreTier = zoneMaterial(this.progression.zone());
    if (gold > 0) {
      this.wallet.add(gold);
    }
    if (oreTier !== null && gamble.ores > 0) {
      this.ores.add(oreTier, gamble.ores);
    }
    this.lastResult.set({ status: gamble.status, ores: gamble.ores, gold, rocks: gamble.rocks.length, oreTier });
  }

  private save(next: MinehuntState): void {
    this.state.set(next);
    writeStorage(STORAGE_KEY, JSON.stringify(next));
  }
}

function loadMinehunt(): MinehuntState {
  const raw = readStorage(STORAGE_KEY);
  if (raw === null) {
    return EMPTY_MINEHUNT;
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (isValidMinehuntState(value)) {
      return value;
    }
  } catch {
    // JSON illisible : traité comme une sauvegarde invalide juste en dessous
  }
  console.warn('Sauvegarde de la Chasse au filon invalide ignorée');
  return EMPTY_MINEHUNT;
}
