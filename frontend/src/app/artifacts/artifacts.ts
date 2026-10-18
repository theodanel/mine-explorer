import { computed, inject, Injectable, signal } from '@angular/core';

import { ARTIFACT_SLOT_FORMS, ArtifactId } from '../balance/artifacts';
import { EVOLUTION_FORMS } from '../balance/balance';
import { Evolution } from '../evolution/evolution';
import { Ores } from '../ores/ores';
import { readStorage, writeStorage } from '../shared/local-storage';
import { RANDOM } from '../shared/random';
import {
  addArtifact,
  ArtifactFind,
  ArtifactState,
  canReforge,
  EMPTY_ARTIFACTS,
  equipArtifact,
  equippedArtifactBonuses,
  openSlotCount,
  parseArtifactState,
  preferredSlot,
  reforge,
  reforgeOreCost,
  reforgeOresEach,
  resolveReforge,
  rollArtifact,
  unequipArtifact,
} from './artifact-rules';

const STORAGE_KEY = 'mine-explorer.artifacts';
/** Rang de la forme qui ouvre chaque emplacement en plus. */
const SLOT_FORM_INDEXES = ARTIFACT_SLOT_FORMS.map((id) => EVOLUTION_FORMS.findIndex((form) => form.id === id));

/** Collection d'artefacts, artefacts portés, réforge et dernière découverte à montrer au joueur. */
@Injectable({ providedIn: 'root' })
export class Artifacts {
  private readonly random = inject(RANDOM);
  private readonly ores = inject(Ores);
  private readonly evolution = inject(Evolution);
  private readonly state = signal<ArtifactState>(loadState());
  private readonly findsToShow = signal<readonly ArtifactFind[]>([]);
  private readonly unseenCount = signal(0);

  readonly owned = computed(() => this.state().owned);
  readonly affixes = computed(() => this.state().affixes);
  readonly tokens = computed(() => this.state().tokens);
  readonly pending = computed(() => this.state().pending);
  /** Emplacements ouverts : 1, puis 2 au Contremaître et 3 à la Légende de la mine. */
  readonly openSlots = computed(() => openSlotCount(this.evolution.index(), SLOT_FORM_INDEXES));
  /** Les 3 emplacements, avec l'artefact porté et la forme qui ouvre ceux encore fermés. */
  readonly slots = computed(() =>
    this.state().slots.map((id, index) => ({
      index,
      id,
      open: index < this.openSlots(),
      unlockLabel: index === 0 ? null : EVOLUTION_FORMS[SLOT_FORM_INDEXES[index - 1]].label,
    })),
  );
  /** Artefact du 1er emplacement : celui affiché dans la case d'artefact de l'équipement. */
  readonly equipped = computed(() => this.state().slots[0]);
  readonly bonuses = computed(() => equippedArtifactBonuses(this.state(), this.openSlots()));
  readonly foundCount = computed(() => Object.keys(this.owned()).length);
  /** Découverte à afficher, la plus ancienne d'abord ; null quand tout a été vu. */
  readonly pendingFind = computed(() => this.findsToShow()[0] ?? null);
  /** Découvertes depuis la dernière visite de la page Artefacts, pour la pastille du menu. */
  readonly unseen = this.unseenCount.asReadonly();

  /** Tire un artefact au hasard et l'ajoute à la collection. Un doublon au niveau maximum donne un jeton de réforge. */
  discover(): ArtifactFind {
    const { state, find } = addArtifact(this.state(), rollArtifact(this.random));
    this.save(state);
    this.findsToShow.update((finds) => [...finds, find]);
    this.unseenCount.update((count) => count + 1);
    return find;
  }

  markSeen(): void {
    this.unseenCount.set(0);
  }

  dismissFind(): void {
    this.findsToShow.update((finds) => finds.slice(1));
  }

  isWorn(id: ArtifactId): boolean {
    return this.state().slots.slice(0, this.openSlots()).includes(id);
  }

  /** Porte l'artefact dans l'emplacement donné, ou dans le premier libre. */
  equip(id: ArtifactId, slot = preferredSlot(this.state(), this.openSlots())): void {
    this.save(equipArtifact(this.state(), id, slot, this.openSlots()));
  }

  unequip(slot: number): void {
    this.save(unequipArtifact(this.state(), slot));
  }

  /** Minerais demandés par la prochaine réforge : null si un jeton la paie, ou s'il n'y a pas assez de minerais. */
  reforgeCost(id: ArtifactId): { readonly each: number; readonly token: boolean; readonly cost: ReturnType<typeof reforgeOreCost> } {
    const each = reforgeOresEach(this.state(), id);
    return { each, token: (this.state().tokens[id] ?? 0) > 0, cost: reforgeOreCost(this.ores.stock(), each) };
  }

  /** Lance une réforge (jeton d'abord, sinon minerais) ; le nouvel effet attend le choix du joueur. */
  reforge(id: ArtifactId): boolean {
    if (!canReforge(this.state(), id)) {
      return false;
    }
    const { token, cost } = this.reforgeCost(id);
    if (!token && (cost === null || !this.ores.spend(cost))) {
      return false;
    }
    this.save(reforge(this.state(), id, this.random, token));
    return true;
  }

  resolveReforge(keep: boolean): void {
    this.save(resolveReforge(this.state(), keep));
  }

  private save(next: ArtifactState): void {
    this.state.set(next);
    writeStorage(STORAGE_KEY, JSON.stringify(next));
  }
}

function loadState(): ArtifactState {
  const raw = readStorage(STORAGE_KEY);
  if (raw === null) {
    return EMPTY_ARTIFACTS;
  }
  try {
    const state = parseArtifactState(JSON.parse(raw));
    if (state !== null) {
      return state;
    }
  } catch {
    // JSON illisible : traité comme une sauvegarde invalide juste en dessous
  }
  console.warn('Sauvegarde des artefacts invalide ignorée');
  return EMPTY_ARTIFACTS;
}
