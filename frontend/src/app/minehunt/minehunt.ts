import { computed, inject, Injectable, signal } from '@angular/core';

import { EVOLUTION_FORMS, powerOf, zoneMaterial } from '../balance/balance';
import type { TierId } from '../equipment/equipment.model';
import { chestGold, MINEHUNT_DAILY_RUNS, MINEHUNT_UNLOCK_FORM, nuggetGold, pickaxeDurability, startingReveals } from '../balance/minehunt';
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
import { dig, Hunt, HuntStatus, isOver, startHunt, stop } from './minehunt-game';
import { EMPTY_MINEHUNT, HuntLoot, huntLoot, isValidMinehuntState, MinehuntState, runsLeft } from './minehunt-rules';

const STORAGE_KEY = 'mine-explorer.minehunt';

export const MINEHUNT_UNLOCK_INDEX = EVOLUTION_FORMS.findIndex((form) => form.id === MINEHUNT_UNLOCK_FORM);

export interface HuntResult extends HuntLoot {
  readonly status: HuntStatus;
  readonly chest: boolean;
  readonly oreTier: TierId | null;
}

/**
 * Chasse au filon : 3 parties par jour. Le joueur creuse une paroi case par case et déduit où se cache le grisou
 * grâce aux indices. Il remonte quand il veut avec son butin ; si sa pioche casse, il n'en garde que la moitié.
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
  private readonly huntState = signal<Hunt | null>(null);
  /** Valeur d'une pépite et du coffre, figée au départ de la partie. */
  private values = { nuggetGold: 0, chestGold: 0 };

  readonly unlocked = computed(() => this.evolution.index() >= MINEHUNT_UNLOCK_INDEX);
  readonly unlockLabel = EVOLUTION_FORMS[MINEHUNT_UNLOCK_INDEX].label;
  readonly dailyRuns = MINEHUNT_DAILY_RUNS;
  readonly runsLeft = computed(() => runsLeft(this.state(), this.today()));
  readonly hunt = this.huntState.asReadonly();
  readonly lastResult = signal<HuntResult | null>(null);
  /** Résistance de la pioche avec le build du moment, pour l'annoncer avant de descendre. */
  readonly durability = computed(() => {
    const { zone, stage } = this.progression.progress();
    return pickaxeDurability(powerOf(this.miner.permanent().stats), zone, stage);
  });
  readonly reveals = computed(() => startingReveals(this.miner.permanent().stats.goldBonus));

  start(): boolean {
    const today = dayKey(this.clock());
    this.today.set(today);
    if (!this.unlocked() || this.huntState() !== null || runsLeft(this.state(), today) === 0) {
      return false;
    }
    const current = this.state();
    // La partie compte dès le départ : quitter en route ne la rend pas
    this.save({ day: today, runsUsed: current.day === today ? current.runsUsed + 1 : 1 });
    this.missionCounters.record('adventureRuns');
    const { zone, stage } = this.progression.progress();
    const goldBonus = this.miner.permanent().stats.goldBonus;
    this.values = { nuggetGold: nuggetGold(zone, stage, goldBonus), chestGold: chestGold(zone, stage, goldBonus) };
    this.lastResult.set(null);
    this.huntState.set(startHunt(this.durability(), this.reveals(), goldBonus, this.random));
    return true;
  }

  dig(index: number): void {
    const hunt = this.huntState();
    if (hunt === null) {
      return;
    }
    const next = dig(hunt, index);
    this.huntState.set(next);
    if (isOver(next)) {
      this.finish(next);
    }
  }

  /** Remonte avec tout le butin. */
  stop(): void {
    const hunt = this.huntState();
    if (hunt !== null) {
      this.finish(stop(hunt));
    }
  }

  /** Ferme le bilan de la partie : la paroi disparaît, on revient à l'accueil. */
  leave(): void {
    if (this.huntState() !== null && isOver(this.huntState() as Hunt)) {
      this.huntState.set(null);
    }
  }

  private finish(hunt: Hunt): void {
    const loot = huntLoot(hunt, this.values);
    const oreTier = zoneMaterial(this.progression.zone());
    if (loot.gold > 0) {
      this.wallet.add(loot.gold);
    }
    if (oreTier !== null && loot.ores > 0) {
      this.ores.add(oreTier, loot.ores);
    }
    // La paroi reste affichée sous le bilan
    this.huntState.set(hunt);
    this.lastResult.set({ ...loot, status: hunt.status, chest: hunt.chest, oreTier });
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
