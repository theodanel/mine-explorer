import { computed, inject, Injectable, signal } from '@angular/core';

import { ArtifactId } from '../balance/artifacts';
import { readStorage, writeStorage } from '../shared/local-storage';
import { RANDOM } from '../shared/random';
import { GeodeShards } from '../wallet/geode-shards';
import {
  addArtifact,
  ArtifactFind,
  ArtifactState,
  EMPTY_ARTIFACTS,
  equipArtifact,
  equippedArtifactBonuses,
  isValidArtifactState,
  rollArtifact,
} from './artifact-rules';

const STORAGE_KEY = 'mine-explorer.artifacts';

/** Collection d'artefacts, artefact porté et dernière découverte à montrer au joueur. */
@Injectable({ providedIn: 'root' })
export class Artifacts {
  private readonly random = inject(RANDOM);
  private readonly shards = inject(GeodeShards);
  private readonly state = signal<ArtifactState>(loadState());
  private readonly findsToShow = signal<readonly ArtifactFind[]>([]);
  private readonly unseenCount = signal(0);

  readonly owned = computed(() => this.state().owned);
  readonly equipped = computed(() => this.state().equipped);
  readonly bonuses = computed(() => equippedArtifactBonuses(this.state()));
  readonly foundCount = computed(() => Object.keys(this.owned()).length);
  /** Découverte à afficher, la plus ancienne d'abord ; null quand tout a été vu. */
  readonly pendingFind = computed(() => this.findsToShow()[0] ?? null);
  /** Découvertes depuis la dernière visite de la page Artefacts, pour la pastille du menu. */
  readonly unseen = this.unseenCount.asReadonly();

  /** Tire un artefact au hasard et l'ajoute à la collection. Un doublon au niveau maximum se change en éclats. */
  discover(): ArtifactFind {
    const { state, find } = addArtifact(this.state(), rollArtifact(this.random));
    this.save(state);
    if (find.shards > 0) {
      this.shards.add(find.shards);
    }
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

  equip(id: ArtifactId): void {
    this.save(equipArtifact(this.state(), id));
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
    const value: unknown = JSON.parse(raw);
    if (isValidArtifactState(value)) {
      return value;
    }
  } catch {
    // JSON illisible : traité comme une sauvegarde invalide juste en dessous
  }
  console.warn('Sauvegarde des artefacts invalide ignorée');
  return EMPTY_ARTIFACTS;
}
