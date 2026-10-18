import { computed, inject, Injectable, signal } from '@angular/core';

import {
  HEART_SHARD_ABYSS_FLOORS,
  HEART_SHARD_FIRST_ZONE,
  HEART_SHARD_ROCK_CHANCE,
  HEART_SHARDS_PER_GUARDIAN,
  RUNE_FORGE_ORE,
  RUNE_FORGE_ORES,
  RuneElement,
} from '../balance/heart-forge';
import { Ores } from '../ores/ores';
import { readStorage, writeStorage } from '../shared/local-storage';
import { RANDOM } from '../shared/random';
import {
  addHeartShards,
  canForgeRune,
  canFuse,
  canSocket,
  EMPTY_HEART_FORGE,
  forgeRune,
  fuseRunes,
  HeartForgeState,
  parseHeartForgeState,
  Rune,
  socketRuneIn,
  starRunesSet,
} from './heart-forge-rules';

const STORAGE_KEY = 'mine-explorer.forge-du-coeur';

/** Ce que la dernière fusion a donné, pour l'afficher au joueur. */
export interface FusionResult {
  readonly id: number;
  readonly rune: Rune;
  readonly success: boolean;
}

/**
 * Forge du Cœur : éclats de cœur gagnés dès la zone 12, runes forgées et fusionnées, puis serties dans l'anneau du
 * Cœur du monde. Les deux runes d'une étoile doivent être serties pour l'éveiller.
 */
@Injectable({ providedIn: 'root' })
export class HeartForge {
  private readonly ores = inject(Ores);
  private readonly random = inject(RANDOM);
  private readonly state = signal<HeartForgeState>(loadState());
  private readonly fusionResult = signal<FusionResult | null>(null);
  private fusionCount = 0;

  readonly shards = computed(() => this.state().shards);
  readonly runes = computed(() => this.state().runes);
  readonly sockets = computed(() => this.state().sockets);
  readonly lastFusion = this.fusionResult.asReadonly();

  /** Un filon épuisé en zone 12 ou plus : une chance sur 4 d'un éclat de cœur. */
  onRockBroken(zone: number): void {
    if (zone >= HEART_SHARD_FIRST_ZONE && this.random() < HEART_SHARD_ROCK_CHANCE) {
      this.add(1);
    }
  }

  /** Un gardien battu en zone 12 ou plus. */
  onGuardianBeaten(zone: number): void {
    if (zone >= HEART_SHARD_FIRST_ZONE) {
      this.add(HEART_SHARDS_PER_GUARDIAN);
    }
  }

  /** Une descente du Puits sans fond, dès la Légende : un éclat de cœur tous les 10 étages. */
  onAbyssRun(floors: number): number {
    const amount = Math.floor(floors / HEART_SHARD_ABYSS_FLOORS);
    this.add(amount);
    return amount;
  }

  /** Assez d'éclats de cœur et de minerais divins pour forger une rune, quel que soit son élément. */
  canForge(): boolean {
    return canForgeRune(this.state()) && this.ores.stock()[RUNE_FORGE_ORE] >= RUNE_FORGE_ORES;
  }

  forge(element: RuneElement): boolean {
    if (!this.canForge() || !this.ores.spend({ [RUNE_FORGE_ORE]: RUNE_FORGE_ORES })) {
      return false;
    }
    this.save(forgeRune(this.state(), element));
    return true;
  }

  canFuse(rune: Rune): boolean {
    return canFuse(this.state(), rune);
  }

  fuse(rune: Rune): boolean {
    if (!this.canFuse(rune)) {
      return false;
    }
    const { state, success } = fuseRunes(this.state(), rune, this.random);
    this.save(state);
    this.fusionResult.set({ id: ++this.fusionCount, rune: { element: rune.element, rank: rune.rank + 1 }, success });
    return success;
  }

  canSocket(socket: number): boolean {
    return canSocket(this.state(), socket);
  }

  socket(socket: number): boolean {
    if (!this.canSocket(socket)) {
      return false;
    }
    this.save(socketRuneIn(this.state(), socket));
    return true;
  }

  /** Les deux runes de cette étoile (1 à 5) sont serties. */
  starReady(star: number): boolean {
    return starRunesSet(this.state(), star);
  }

  private add(amount: number): void {
    if (amount > 0) {
      this.save(addHeartShards(this.state(), amount));
    }
  }

  private save(next: HeartForgeState): void {
    this.state.set(next);
    writeStorage(STORAGE_KEY, JSON.stringify(next));
  }
}

function loadState(): HeartForgeState {
  const raw = readStorage(STORAGE_KEY);
  if (raw === null) {
    return EMPTY_HEART_FORGE;
  }
  try {
    const state = parseHeartForgeState(JSON.parse(raw));
    if (state !== null) {
      return state;
    }
  } catch {
    // JSON illisible : traité comme une sauvegarde invalide juste en dessous
  }
  console.warn('Sauvegarde de la Forge du Cœur invalide ignorée');
  return EMPTY_HEART_FORGE;
}
