import { computed, inject, Injectable, signal } from '@angular/core';

import { Ores } from '../ores/ores';
import { Progression } from '../progression/progression';
import { readStorage, writeStorage } from '../shared/local-storage';
import { GeodeShards } from '../wallet/geode-shards';
import { claimableTiers, EMPTY_PASS, isValidPassState, nextTier, PassState, reachedTiers, rocksBroken } from './progress-pass-rules';

const STORAGE_KEY = 'mine-explorer.passe';

/** Ce que le dernier « Tout récupérer » a donné, pour l'annoncer. */
export interface PassClaim {
  readonly tiers: number;
  readonly shards: number;
}

/**
 * Passe de progression gratuit : une récompense tous les 5 filons, des zones 1 à 20, à récupérer d'un geste.
 * Les paliers atteints se lisent dans la progression de la mine ; seul le nombre de paliers récupérés est sauvegardé.
 */
@Injectable({ providedIn: 'root' })
export class ProgressPass {
  private readonly progression = inject(Progression);
  private readonly shards = inject(GeodeShards);
  private readonly ores = inject(Ores);
  private readonly state = signal<PassState>(loadState());

  readonly claimed = computed(() => this.state().claimed);
  readonly reached = computed(() => {
    const { zone, stage } = this.progression.progress();
    return reachedTiers(zone, stage);
  });
  readonly claimable = computed(() => {
    const { zone, stage } = this.progression.progress();
    return claimableTiers(this.state(), zone, stage);
  });
  /** Prochain palier, et combien de filons il reste à épuiser pour l'atteindre. */
  readonly next = computed(() => {
    const { zone, stage } = this.progression.progress();
    const tier = nextTier(zone, stage);
    return tier === null ? null : { tier, rocksLeft: tier.rocks - rocksBroken(zone, stage) };
  });

  /** Récupère d'un geste tous les paliers atteints. */
  claimAll(): PassClaim | null {
    const tiers = this.claimable();
    if (tiers.length === 0) {
      return null;
    }
    let shards = 0;
    for (const tier of tiers) {
      shards += tier.shards;
      if (tier.ore !== null) {
        this.ores.add(tier.ore.tier, tier.ore.amount);
      }
    }
    this.shards.add(shards);
    this.save({ claimed: this.state().claimed + tiers.length });
    return { tiers: tiers.length, shards };
  }

  private save(next: PassState): void {
    this.state.set(next);
    writeStorage(STORAGE_KEY, JSON.stringify(next));
  }
}

function loadState(): PassState {
  const raw = readStorage(STORAGE_KEY);
  if (raw === null) {
    return EMPTY_PASS;
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (isValidPassState(value)) {
      return value;
    }
  } catch {
    // JSON illisible : traité comme une sauvegarde invalide juste en dessous
  }
  console.warn('Sauvegarde du passe de progression invalide ignorée');
  return EMPTY_PASS;
}
