import { computed, DestroyRef, inject, Injectable, InjectionToken, signal } from '@angular/core';

import { FORGE_SHARD_COST, isJackpot } from '../balance/balance';
import { Evolution } from '../evolution/evolution';
import { Forge } from '../forge/forge';
import { readStorage, writeStorage } from '../shared/local-storage';
import { ID_FACTORY, RANDOM } from '../shared/random';
import { MissionCounters } from '../missions/mission-counters';
import { GeodeShards } from '../wallet/geode-shards';
import { Wallet } from '../wallet/wallet';
import { computePower, computeStats, rollItem, sellPrice } from './equipment-rules';
import { EMPTY_SAVE, EquipmentSave, parseEquipmentSave } from './equipment-save';
import { EquippedItems, Item, MiningStats } from './equipment.model';

const STORAGE_KEY = 'mine-explorer.equipment';

/**
 * Durée de l'animation de forge : l'objet n'est montré qu'à la fin, pour qu'on voie la pioche frapper
 * avant chaque tirage, même en forge automatique. 0 dans les tests.
 */
export const FORGE_ANIMATION_MS = new InjectionToken<number>('FORGE_ANIMATION_MS', {
  providedIn: 'root',
  factory: () => 900,
});

/** Dernier objet sorti de la forge, pour l'animation. `key` change à chaque tirage. */
export interface ForgedEvent {
  readonly key: number;
  readonly item: Item;
  /** Objet tiré deux paliers au-dessus de la base : la forge le fête. */
  readonly jackpot: boolean;
}

/**
 * Équipement porté et objet sorti de la Forge.
 * Pour le MVP tout se passe en local : le serveur fera les tirages et les transactions plus tard.
 */
@Injectable({ providedIn: 'root' })
export class Inventory {
  private readonly wallet = inject(Wallet);
  private readonly shards = inject(GeodeShards);
  private readonly forgeLevel = inject(Forge).level;
  private readonly random = inject(RANDOM);
  private readonly createId = inject(ID_FACTORY);
  private readonly missionCounters = inject(MissionCounters);
  private readonly evolution = inject(Evolution);
  private readonly state = signal<EquipmentSave>(loadSave());
  private readonly animationMs = inject(FORGE_ANIMATION_MS);
  private readonly forgingState = signal(false);
  private readonly lastForgedState = signal<ForgedEvent | null>(null);
  private forgedCount = 0;
  private forgingTimer: ReturnType<typeof setTimeout> | undefined;
  /** Vrai pendant l'animation de forge : l'objet tiré n'est pas encore montré. */
  readonly forging = this.forgingState.asReadonly();
  readonly lastForged = this.lastForgedState.asReadonly();

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.forgingTimer));
  }

  readonly equipped = computed(() => this.state().equipped);
  readonly pending = computed(() => this.state().pending);
  /**
   * Le joueur peut fermer la comparaison sans choisir : l'objet reste en attente (et sauvegardé),
   * la Forge le lui remontre au prochain appui. État d'affichage seulement : au rechargement, la fenêtre revient.
   */
  private readonly reviewClosed = signal(false);
  readonly reviewing = computed(() => this.pending() !== null && !this.reviewClosed() && !this.forging());
  /** Vrai quand l'objet en attente est l'ancien, revenu après un remplacement (et non un objet tout juste forgé). */
  private readonly pendingIsPrevious = signal(false);
  readonly pendingWasEquipped = this.pendingIsPrevious.asReadonly();
  /** Stats de l'équipement, avec le bonus de Frappe des évolutions du mineur. */
  readonly stats = computed(() => this.statsOf(this.equipped()));
  readonly power = computed(() => computePower(this.stats()));
  readonly forgeCost = FORGE_SHARD_COST;
  readonly canForge = computed(() => this.pending() === null && !this.forging() && this.shards.amount() >= FORGE_SHARD_COST);

  /** Stats d'un équipement, porté ou envisagé, avec le bonus de Frappe des évolutions du mineur. */
  statsOf(equipped: EquippedItems): MiningStats {
    const stats = computeStats(equipped);
    return { ...stats, strikePower: stats.strikePower * this.evolution.strikeMultiplier() };
  }

  /** Paye la Forge en éclats et sort un objet. Refusé si un objet attend déjà ou si les éclats manquent. */
  forge(): boolean {
    if (this.pending() !== null || !this.shards.spend(FORGE_SHARD_COST)) {
      return false;
    }
    const level = this.forgeLevel();
    const item = rollItem(this.random, this.createId, level);
    this.save({ ...this.state(), pending: item });
    this.reviewClosed.set(false);
    this.pendingIsPrevious.set(false);
    const jackpot = isJackpot(item.tier, level);
    this.lastForgedState.set({ key: ++this.forgedCount, item, jackpot });
    if (jackpot) {
      this.missionCounters.record('jackpots');
    }
    this.startForgingAnimation();
    this.missionCounters.record('itemsForged');
    return true;
  }

  /** Un objet gagné ailleurs qu'à la forge (Forge express) : il attend comme un objet forgé. Refusé si un objet attend déjà. */
  receive(item: Item): boolean {
    if (this.pending() !== null) {
      return false;
    }
    this.save({ ...this.state(), pending: item });
    this.reviewClosed.set(false);
    this.pendingIsPrevious.set(false);
    // La Forge express choisit elle-même la qualité : ce n'est pas un jackpot de la forge
    this.lastForgedState.set({ key: ++this.forgedCount, item, jackpot: false });
    return true;
  }

  private startForgingAnimation(): void {
    if (this.animationMs <= 0) {
      return;
    }
    clearTimeout(this.forgingTimer);
    this.forgingState.set(true);
    this.forgingTimer = setTimeout(() => this.forgingState.set(false), this.animationMs);
  }

  closeReview(): void {
    this.reviewClosed.set(true);
  }

  reopenReview(): void {
    this.reviewClosed.set(false);
  }

  /**
   * Équipe l'objet en attente. L'objet qu'il remplace n'est pas vendu : il devient l'objet en attente,
   * pour que le joueur puisse le remettre s'il change d'avis. Seul « Vendre » vend.
   */
  equipPending(): void {
    const item = this.requirePending();
    const replaced = this.equipped()[item.slot] ?? null;
    this.save({ equipped: { ...this.equipped(), [item.slot]: item }, pending: replaced });
    this.pendingIsPrevious.set(replaced !== null);
    this.reviewClosed.set(false);
  }

  /** Remplace la pièce portée par sa version modifiée (reforge de l'Atelier). Même emplacement, même identifiant. */
  replaceEquipped(item: Item): boolean {
    if (this.equipped()[item.slot]?.id !== item.id) {
      return false;
    }
    this.save({ ...this.state(), equipped: { ...this.equipped(), [item.slot]: item } });
    return true;
  }

  sellPending(): void {
    const item = this.requirePending();
    this.wallet.add(sellPrice(item));
    this.missionCounters.record('itemsSold');
    this.save({ ...this.state(), pending: null });
    this.pendingIsPrevious.set(false);
  }

  private requirePending(): Item {
    const item = this.pending();
    if (item === null) {
      throw new Error('Aucun objet en attente');
    }
    return item;
  }

  private save(next: EquipmentSave): void {
    this.state.set(next);
    writeStorage(STORAGE_KEY, JSON.stringify(next));
  }
}

function loadSave(): EquipmentSave {
  const raw = readStorage(STORAGE_KEY);
  if (raw === null) {
    return EMPTY_SAVE;
  }
  const save = parseEquipmentSave(raw);
  if (save === null) {
    console.warn('Sauvegarde d\'équipement invalide ignorée');
    return EMPTY_SAVE;
  }
  return save;
}
