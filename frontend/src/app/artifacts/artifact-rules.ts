// Règles pures des artefacts : tirage, doublons et bonus de l'artefact porté.
import {
  ARTIFACT_IDS,
  ARTIFACT_MAX_LEVEL,
  ARTIFACT_OVERFLOW_SHARDS,
  ARTIFACT_RARITY_WEIGHTS,
  ArtifactId,
  ARTIFACTS,
  artifactEffectMultiplier,
} from '../balance/artifacts';
import { BonusId, Bonuses, NO_BONUSES, RARITY_IDS, Rarity } from '../balance/skill-tree';
import type { Random } from '../shared/random';

export interface ArtifactState {
  /** Niveau de chaque artefact trouvé ; absent = jamais trouvé. */
  readonly owned: Readonly<Partial<Record<ArtifactId, number>>>;
  readonly equipped: ArtifactId | null;
}

export const EMPTY_ARTIFACTS: ArtifactState = { owned: {}, equipped: null };

export interface ArtifactFind {
  readonly id: ArtifactId;
  /** new : première découverte ; levelUp : doublon qui fait monter de niveau ; maxed : doublon changé en éclats. */
  readonly kind: 'new' | 'levelUp' | 'maxed';
  readonly level: number;
  readonly shards: number;
}

/** Tire d'abord une rareté selon ses poids, puis un artefact de cette rareté au hasard. */
export function rollArtifact(random: Random): ArtifactId {
  const totalWeight = RARITY_IDS.reduce((sum, rarity) => sum + ARTIFACT_RARITY_WEIGHTS[rarity], 0);
  let threshold = random() * totalWeight;
  let rarity: Rarity = RARITY_IDS[RARITY_IDS.length - 1];
  for (const candidate of RARITY_IDS) {
    threshold -= ARTIFACT_RARITY_WEIGHTS[candidate];
    if (threshold < 0) {
      rarity = candidate;
      break;
    }
  }
  const pool = ARTIFACT_IDS.filter((id) => ARTIFACTS[id].rarity === rarity);
  return pool[Math.floor(random() * pool.length)];
}

export function addArtifact(state: ArtifactState, id: ArtifactId): { state: ArtifactState; find: ArtifactFind } {
  const level = state.owned[id];
  if (level === undefined) {
    // Le premier artefact trouvé s'équipe tout seul : la 6e case ne reste pas vide
    const equipped = state.equipped ?? id;
    return { state: { owned: { ...state.owned, [id]: 1 }, equipped }, find: { id, kind: 'new', level: 1, shards: 0 } };
  }
  if (level >= ARTIFACT_MAX_LEVEL) {
    return { state, find: { id, kind: 'maxed', level, shards: ARTIFACT_OVERFLOW_SHARDS } };
  }
  return {
    state: { ...state, owned: { ...state.owned, [id]: level + 1 } },
    find: { id, kind: 'levelUp', level: level + 1, shards: 0 },
  };
}

export function equipArtifact(state: ArtifactState, id: ArtifactId): ArtifactState {
  return state.owned[id] === undefined ? state : { ...state, equipped: id };
}

/** Effets d'un artefact à un niveau donné. */
export function artifactEffects(id: ArtifactId, level: number): Bonuses {
  const totals: Record<BonusId, number> = { ...NO_BONUSES };
  const multiplier = artifactEffectMultiplier(level);
  for (const [bonus, value] of Object.entries(ARTIFACTS[id].effects) as [BonusId, number][]) {
    totals[bonus] += value * multiplier;
  }
  return totals;
}

/** Bonus de l'artefact porté, ou aucun. */
export function equippedArtifactBonuses(state: ArtifactState): Bonuses {
  const id = state.equipped;
  const level = id === null ? undefined : state.owned[id];
  return id === null || level === undefined ? NO_BONUSES : artifactEffects(id, level);
}

export function isValidArtifactState(value: unknown): value is ArtifactState {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const { owned, equipped } = value as Record<string, unknown>;
  if (typeof owned !== 'object' || owned === null) {
    return false;
  }
  const levelsValid = Object.entries(owned).every(
    ([id, level]) =>
      (ARTIFACT_IDS as readonly string[]).includes(id) &&
      Number.isSafeInteger(level) &&
      (level as number) >= 1 &&
      (level as number) <= ARTIFACT_MAX_LEVEL,
  );
  const equippedValid = equipped === null || (typeof equipped === 'string' && equipped in owned);
  return levelsValid && equippedValid;
}
