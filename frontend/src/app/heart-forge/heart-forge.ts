import { computed, inject, Injectable, signal } from '@angular/core';

import { ABYSS_FLOORS_PER_ESSENCES, ECHO_ESSENCES_PER_ROCK, ESSENCES, EssenceId } from '../balance/heart-forge';
import type { SlotId } from '../equipment/equipment.model';
import { readStorage, writeStorage } from '../shared/local-storage';
import { RANDOM } from '../shared/random';
import {
  addEssences,
  brew,
  canBrew,
  canFuse,
  canSocket,
  echoEssence,
  EMPTY_HEART_FORGE,
  fuseRunes,
  HeartForgeState,
  parseHeartForgeState,
  Rune,
  socketRuneIn,
  starRunesSet,
} from './heart-forge-rules';
import { canSetGearRune, removeGearRune, setGearRune } from './gear-runes-rules';

const STORAGE_KEY = 'mine-explorer.forge-du-coeur';

/** Ce que le Creuset ou la dernière fusion a donné, pour l'afficher au joueur. */
export interface ForgeEvent {
  readonly id: number;
  readonly kind: 'brew' | 'fusion';
  readonly rune: Rune;
  readonly success: boolean;
  /** Une recette trouvée pour la première fois. */
  readonly discovery: boolean;
}

/**
 * Forge du Cœur : ressources récoltées dans les Échos, versées au Creuset pour faire des runes, runes fusionnées puis
 * serties dans l'anneau du Cœur du monde. Les deux runes d'une étoile doivent être serties pour l'éveiller.
 */
@Injectable({ providedIn: 'root' })
export class HeartForge {
  private readonly random = inject(RANDOM);
  private readonly state = signal<HeartForgeState>(loadState());
  private readonly lastEvent = signal<ForgeEvent | null>(null);
  private eventCount = 0;

  readonly essences = computed(() => this.state().essences);
  readonly runes = computed(() => this.state().runes);
  readonly sockets = computed(() => this.state().sockets);
  readonly recipes = computed(() => this.state().recipes);
  /** Runes serties sur l'équipement, par emplacement. */
  readonly gear = computed(() => this.state().gear);
  readonly event = this.lastEvent.asReadonly();
  /** État complet, pour les écrans qui calculent avec les règles. */
  readonly snapshot = this.state.asReadonly();

  /** Un filon d'Écho épuisé : sa ressource, garantie. */
  onEchoRock(zone: number): void {
    const essence = echoEssence(zone);
    if (essence !== null) {
      this.save(addEssences(this.state(), { [essence]: ECHO_ESSENCES_PER_ROCK }));
    }
  }

  /** Une descente du Puits sans fond, dès la Légende : une ressource de chaque sorte tous les 25 étages. */
  onAbyssRun(floors: number): number {
    const each = Math.floor(floors / ABYSS_FLOORS_PER_ESSENCES);
    if (each > 0) {
      this.save(addEssences(this.state(), Object.fromEntries(ESSENCES.map((id) => [id, each]))));
    }
    return each;
  }

  canBrew(mix: readonly EssenceId[]): boolean {
    return canBrew(this.state(), mix);
  }

  /** Verse 3 ressources au Creuset ; rend la rune obtenue, ou null si les ressources manquent. */
  brew(mix: readonly [EssenceId, EssenceId, EssenceId]): Rune | null {
    if (!this.canBrew(mix)) {
      return null;
    }
    const known = this.state().recipes;
    const result = brew(this.state(), mix);
    this.save(result.state);
    const rune = { type: result.rune, rank: 1 };
    this.lastEvent.set({ id: ++this.eventCount, kind: 'brew', rune, success: true, discovery: !known.includes(result.rune) });
    return rune;
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
    const result = { type: rune.type, rank: rune.rank + 1 };
    this.lastEvent.set({ id: ++this.eventCount, kind: 'fusion', rune: result, success, discovery: false });
    return success;
  }

  /** `stars` : étoiles déjà obtenues ; seuls les emplacements de la suivante (et d'avant) s'ouvrent. */
  canSocket(socket: number, stars: number): boolean {
    return canSocket(this.state(), socket, stars);
  }

  socket(socket: number, stars: number): boolean {
    if (!this.canSocket(socket, stars)) {
      return false;
    }
    this.save(socketRuneIn(this.state(), socket, stars));
    return true;
  }

  /** `socketCount` : châsses ouvertes par emplacement, selon les étoiles (voir GearRunes). */
  setGearRune(slot: SlotId, socket: number, rune: Rune, socketCount: number): boolean {
    if (!canSetGearRune(this.state(), socket, rune, socketCount)) {
      return false;
    }
    this.save(setGearRune(this.state(), slot, socket, rune, socketCount));
    return true;
  }

  removeGearRune(slot: SlotId, socket: number): void {
    this.save(removeGearRune(this.state(), slot, socket));
  }

  /** Les deux runes de cette étoile (1 à 5) sont serties. */
  starReady(star: number): boolean {
    return starRunesSet(this.state(), star);
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
