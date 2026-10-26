import { computed, inject, Injectable, signal } from '@angular/core';

import { ABYSS_FLOORS_PER_ESSENCES, ECHO_ESSENCES_PER_ROCK, ESSENCES, EssenceId, RuneType } from '../balance/heart-forge';
import type { SlotId } from '../equipment/equipment.model';
import { readStorage, writeStorage } from '../shared/local-storage';
import {
  addEssences,
  canCreateGearRune,
  canGrowGearRune,
  createGearRune,
  echoEssence,
  EMPTY_HEART_FORGE,
  feedAstreWith,
  growGearRune,
  HeartForgeState,
  parseHeartForgeState,
  raiseConstellation,
  removeGearRune,
  spendEssences,
  starReady,
} from './heart-forge-rules';
import { Progression } from '../progression/progression';
import { Rebirth } from '../rebirth/rebirth';
import { astrePower, canRaiseConstellation, constellationNeeds, stageOf } from './astre-rules';

const STORAGE_KEY = 'mine-explorer.forge-du-coeur';

/** L'Astre vient de passer un stade ou un niveau de Constellation, pour le fêter à l'écran. */
export interface ForgeEvent {
  readonly id: number;
  readonly stage: number;
  readonly constellation: number;
}

/**
 * Forge du Cœur : ressources récoltées dans les Échos, qui nourrissent l'Astre du Cœur (ses 5 stades sont les 5 étoiles
 * de la Légende du Cœur du monde) et les runes des châsses d'équipement.
 */
@Injectable({ providedIn: 'root' })
export class HeartForge {
  private readonly rebirth = inject(Rebirth);
  private readonly progression = inject(Progression);
  private readonly state = signal<HeartForgeState>(loadState());
  private readonly lastEvent = signal<ForgeEvent | null>(null);
  private eventCount = 0;

  readonly essences = computed(() => this.state().essences);
  /** Ressources données à l'Astre du Cœur, et son stade (0 à 5). */
  readonly astre = computed(() => this.state().astre);
  readonly astreStage = computed(() => stageOf(this.state().astre));
  /** Niveaux de Constellation allumés (fin de jeu). */
  readonly astreConstellation = computed(() => this.state().constellation);
  /** Ce que demande le niveau de Constellation suivant : Supernova, une renaissance de plus, nourriture et épreuve. */
  readonly constellationNeeds = computed(() =>
    constellationNeeds(this.state().astre, this.state().constellation, this.rebirth.count(), this.progression.zone()),
  );
  /** Multiplicateur de l'Astre dû à la Constellation : ses bonus, sa frappe et sa pluie d'étoiles. */
  readonly astrePower = computed(() => astrePower(this.astreConstellation()));
  /** Runes serties sur l'équipement, par emplacement. */
  readonly gear = computed(() => this.state().gear);
  readonly event = this.lastEvent.asReadonly();
  /** État complet, pour les écrans qui calculent avec les règles. */
  readonly snapshot = this.state.asReadonly();

  /** Un filon d'Écho épuisé : sa ressource, garantie, plus la Mémoire du Cœur de l'arbre des Braises. */
  onEchoRock(zone: number, extra = 0): void {
    const essence = echoEssence(zone);
    if (essence !== null) {
      this.save(addEssences(this.state(), { [essence]: ECHO_ESSENCES_PER_ROCK + extra }));
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

  /** Nourrit l'Astre du Cœur ; rend vrai quand il passe un stade. */
  feedAstre(essence: EssenceId, amount: number): boolean {
    const before = this.astreStage();
    const next = feedAstreWith(this.state(), essence, Math.min(amount, this.state().essences[essence]));
    if (next === this.state()) {
      return false;
    }
    this.save(next);
    if (this.astreStage() > before) {
      this.lastEvent.set({ id: ++this.eventCount, stage: this.astreStage(), constellation: this.astreConstellation() });
      return true;
    }
    return false;
  }

  /** Allume le niveau de Constellation suivant, si tout ce qu'il demande est réuni. */
  raiseConstellation(): boolean {
    if (!canRaiseConstellation(this.constellationNeeds())) {
      return false;
    }
    this.save(raiseConstellation(this.state()));
    this.lastEvent.set({ id: ++this.eventCount, stage: this.astreStage(), constellation: this.astreConstellation() });
    return true;
  }

  /** `open` : châsses ouvertes sur l'emplacement, selon les étoiles et l'Éveil (voir GearRunes). */
  canCreateGearRune(slot: SlotId, socket: number, type: RuneType, open: number): boolean {
    return canCreateGearRune(this.state(), slot, socket, type, open);
  }

  createGearRune(slot: SlotId, socket: number, type: RuneType, open: number): boolean {
    if (!this.canCreateGearRune(slot, socket, type, open)) {
      return false;
    }
    this.save(createGearRune(this.state(), slot, socket, type, open));
    return true;
  }

  canGrowGearRune(slot: SlotId, socket: number): boolean {
    return canGrowGearRune(this.state(), slot, socket);
  }

  growGearRune(slot: SlotId, socket: number): boolean {
    if (!this.canGrowGearRune(slot, socket)) {
      return false;
    }
    this.save(growGearRune(this.state(), slot, socket));
    return true;
  }

  removeGearRune(slot: SlotId, socket: number): void {
    this.save(removeGearRune(this.state(), slot, socket));
  }

  /** L'Astre a atteint le stade de cette étoile (1 à 5). */
  starReady(star: number): boolean {
    return starReady(this.state(), star);
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
