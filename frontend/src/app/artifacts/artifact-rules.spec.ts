import { ARTIFACT_IDS, ARTIFACT_MAX_LEVEL, ARTIFACT_OVERFLOW_SHARDS, ARTIFACTS } from '../balance/artifacts';
import {
  addArtifact,
  artifactEffects,
  EMPTY_ARTIFACTS,
  equipArtifact,
  equippedArtifactBonuses,
  isValidArtifactState,
  rollArtifact,
} from './artifact-rules';

function sequence(...values: number[]): () => number {
  let index = 0;
  return () => values[index++ % values.length];
}

describe('tirage d\'artefact', () => {
  it('tire surtout des communs', () => {
    expect(ARTIFACTS[rollArtifact(sequence(0, 0))].rarity).toBe('common');
  });

  it('peut tirer un légendaire tout en haut de la table', () => {
    expect(ARTIFACTS[rollArtifact(sequence(0.995, 0))].rarity).toBe('legendary');
  });
});

describe('collection', () => {
  it('ajoute un nouvel artefact au niveau 1 et équipe le premier trouvé', () => {
    const { state, find } = addArtifact(EMPTY_ARTIFACTS, 'moleTooth');
    expect(find).toEqual({ id: 'moleTooth', kind: 'new', level: 1, shards: 0 });
    expect(state.equipped).toBe('moleTooth');
  });

  it('garde l\'artefact porté quand on en trouve un autre', () => {
    const first = addArtifact(EMPTY_ARTIFACTS, 'moleTooth').state;
    expect(addArtifact(first, 'fallenStar').state.equipped).toBe('moleTooth');
  });

  it('fait monter un doublon de niveau, puis le change en éclats au maximum', () => {
    let state = addArtifact(EMPTY_ARTIFACTS, 'rustyCompass').state;
    for (let level = 2; level <= ARTIFACT_MAX_LEVEL; level++) {
      const result = addArtifact(state, 'rustyCompass');
      expect(result.find).toMatchObject({ kind: 'levelUp', level });
      state = result.state;
    }
    expect(addArtifact(state, 'rustyCompass').find).toMatchObject({ kind: 'maxed', shards: ARTIFACT_OVERFLOW_SHARDS });
  });

  it('n\'équipe qu\'un artefact possédé', () => {
    expect(equipArtifact(EMPTY_ARTIFACTS, 'fallenStar')).toBe(EMPTY_ARTIFACTS);
  });
});

describe('effets', () => {
  it('doublent entre le niveau 1 et le niveau maximum', () => {
    expect(artifactEffects('moleTooth', 1).strikePct).toBeCloseTo(0.05);
    expect(artifactEffects('moleTooth', ARTIFACT_MAX_LEVEL).strikePct).toBeCloseTo(0.1);
  });

  it('ne comptent que pour l\'artefact porté', () => {
    expect(equippedArtifactBonuses(EMPTY_ARTIFACTS).strikePct).toBe(0);
    const state = { owned: { moleTooth: 1, fallenStar: 1 }, equipped: 'fallenStar' as const };
    expect(equippedArtifactBonuses(state).strikePct).toBe(0);
    expect(equippedArtifactBonuses(state).goldPct).toBeCloseTo(0.2);
  });

  it('restent modestes : aucun légendaire au maximum ne dépasse +30 % de Frappe', () => {
    for (const id of ARTIFACT_IDS) {
      expect(artifactEffects(id, ARTIFACT_MAX_LEVEL).strikePct).toBeLessThanOrEqual(0.3);
    }
  });
});

describe('sauvegarde', () => {
  it('refuse un artefact inconnu ou un porté non possédé', () => {
    expect(isValidArtifactState({ owned: { moleTooth: 2 }, equipped: 'moleTooth' })).toBe(true);
    expect(isValidArtifactState({ owned: { inventé: 1 }, equipped: null })).toBe(false);
    expect(isValidArtifactState({ owned: {}, equipped: 'moleTooth' })).toBe(false);
    expect(isValidArtifactState({ owned: { moleTooth: 9 }, equipped: null })).toBe(false);
  });
});
