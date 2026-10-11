import { computed, inject, Injectable, signal } from '@angular/core';

import { FORGE_SHARD_COST } from '../balance/balance';
import { Forge } from '../forge/forge';
import { readStorage, writeStorage } from '../shared/local-storage';
import { ID_FACTORY, RANDOM } from '../shared/random';
import { GeodeShards } from '../wallet/geode-shards';
import { Wallet } from '../wallet/wallet';
import { computePower, computeStats, rollItem, sellPrice } from './equipment-rules';
import { EMPTY_SAVE, EquipmentSave, parseEquipmentSave } from './equipment-save';
import { Item } from './equipment.model';

const STORAGE_KEY = 'mine-explorer.equipment';

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
  private readonly state = signal<EquipmentSave>(loadSave());

  readonly equipped = computed(() => this.state().equipped);
  readonly pending = computed(() => this.state().pending);
  readonly stats = computed(() => computeStats(this.equipped()));
  readonly power = computed(() => computePower(this.stats()));
  readonly forgeCost = FORGE_SHARD_COST;
  readonly canForge = computed(() => this.pending() === null && this.shards.amount() >= FORGE_SHARD_COST);

  /** Paye la Forge en éclats et sort un objet. Refusé si un objet attend déjà ou si les éclats manquent. */
  forge(): boolean {
    if (this.pending() !== null || !this.shards.spend(FORGE_SHARD_COST)) {
      return false;
    }
    this.save({ ...this.state(), pending: rollItem(this.random, this.createId, this.forgeLevel()) });
    return true;
  }

  /** Équipe l'objet en attente ; celui qu'il remplace est vendu automatiquement. */
  equipPending(): void {
    const item = this.requirePending();
    const replaced = this.equipped()[item.slot];
    if (replaced) {
      this.wallet.add(sellPrice(replaced));
    }
    this.save({ equipped: { ...this.equipped(), [item.slot]: item }, pending: null });
  }

  sellPending(): void {
    const item = this.requirePending();
    this.wallet.add(sellPrice(item));
    this.save({ ...this.state(), pending: null });
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
