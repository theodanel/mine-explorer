import { computed, Injectable, signal } from '@angular/core';

import { ABYSS_FLOORS_PER_ESSENCES, ECHO_ESSENCES_PER_ROCK, ESSENCES, EssenceId, RuneType } from '../balance/heart-forge';
import type { SlotId } from '../equipment/equipment.model';
import { readStorage, writeStorage } from '../shared/local-storage';
import {
  addEssences,
  canCreate,
  canGrow,
  canSocket,
  createRune,
  echoEssence,
  EMPTY_HEART_FORGE,
  growRune,
  HeartForgeState,
  parseHeartForgeState,
  Rune,
  socketRuneIn,
  spendEssences,
  starRunesSet,
} from './heart-forge-rules';
import { canSetGearRune, removeGearRune, setGearRune } from './gear-runes-rules';

const STORAGE_KEY = 'mine-explorer.forge-du-coeur';

/** Rune tout juste créée ou grandie, pour l'afficher au joueur. */
export interface ForgeEvent {
  readonly id: number;
  readonly kind: 'create' | 'grow';
  readonly rune: Rune;
}

/**
 * Forge du Cœur : ressources récoltées dans les Échos, qui créent des runes puis les font grandir jusqu'au rang 5,
 * avant de les sertir dans l'anneau du Cœur du monde. Les deux runes d'une étoile doivent être serties pour l'éveiller.
 */
@Injectable({ providedIn: 'root' })
export class HeartForge {
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

  /** Paie des ressources ailleurs qu'au Creuset (Éveil des pièces Divin). Faux, sans rien prendre, s'il en manque. */
  spendEssences(cost: Partial<Record<EssenceId, number>>): boolean {
    const next = spendEssences(this.state(), cost);
    if (next === null) {
      return false;
    }
    this.save(next);
    return true;
  }

  /** `stars` : étoiles obtenues, qui révèlent les recettes d'alliance. */
  canCreate(type: RuneType, stars: number): boolean {
    return canCreate(this.state(), type, stars);
  }

  create(type: RuneType, stars: number): boolean {
    if (!this.canCreate(type, stars)) {
      return false;
    }
    this.save(createRune(this.state(), type, stars));
    this.lastEvent.set({ id: ++this.eventCount, kind: 'create', rune: { type, rank: 1 } });
    return true;
  }

  canGrow(rune: Rune): boolean {
    return canGrow(this.state(), rune);
  }

  /** Nourrit une rune de la réserve avec ses ressources : elle passe au rang suivant. */
  grow(rune: Rune): boolean {
    if (!this.canGrow(rune)) {
      return false;
    }
    this.save(growRune(this.state(), rune));
    this.lastEvent.set({ id: ++this.eventCount, kind: 'grow', rune: { type: rune.type, rank: rune.rank + 1 } });
    return true;
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

  /** `socketCount` : châsses ouvertes sur cet emplacement, selon les étoiles et l'Éveil (voir GearRunes). */
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
