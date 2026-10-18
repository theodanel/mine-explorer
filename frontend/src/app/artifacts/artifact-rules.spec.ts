import { ARTIFACT_IDS, ARTIFACT_MAX_LEVEL, ARTIFACTS } from '../balance/artifacts';
import { TIER_IDS, TierId } from '../equipment/equipment.model';
import {
  addArtifact,
  affixValue,
  artifactEffects,
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
} from './artifact-rules';

function sequence(...values: number[]): () => number {
  let index = 0;
  return () => values[index++ % values.length];
}

const withOwned = (owned: Record<string, number>) => ({ ...EMPTY_ARTIFACTS, owned });

describe("tirage d'artefact", () => {
  it('tire surtout des communs', () => {
    expect(ARTIFACTS[rollArtifact(sequence(0, 0))].rarity).toBe('common');
  });

  it('peut tirer un légendaire tout en haut de la table', () => {
    expect(ARTIFACTS[rollArtifact(sequence(0.995, 0))].rarity).toBe('legendary');
  });
});

describe('collection', () => {
  it('ajoute un nouvel artefact au niveau 1 et porte le premier trouvé', () => {
    const { state, find } = addArtifact(EMPTY_ARTIFACTS, 'moleTooth');
    expect(find).toEqual({ id: 'moleTooth', kind: 'new', level: 1 });
    expect(state.slots[0]).toBe('moleTooth');
  });

  it("garde l'artefact porté quand on en trouve un autre", () => {
    const first = addArtifact(EMPTY_ARTIFACTS, 'moleTooth').state;
    expect(addArtifact(first, 'fallenStar').state.slots).toEqual(['moleTooth', null, null]);
  });

  it('fait monter un doublon de niveau, puis le change en réforge gratuite au maximum', () => {
    let state = addArtifact(EMPTY_ARTIFACTS, 'rustyCompass').state;
    for (let level = 2; level <= ARTIFACT_MAX_LEVEL; level++) {
      const result = addArtifact(state, 'rustyCompass');
      expect(result.find).toMatchObject({ kind: 'levelUp', level });
      state = result.state;
    }
    const maxed = addArtifact(state, 'rustyCompass');
    expect(maxed.find).toMatchObject({ kind: 'maxed' });
    expect(maxed.state.tokens.rustyCompass).toBe(1);
  });
});

describe('emplacements', () => {
  it("s'ouvrent au Contremaître (rang 2) puis à la Légende (rang 4)", () => {
    expect([0, 1, 2, 3, 4, 9].map((form) => openSlotCount(form, [2, 4]))).toEqual([1, 1, 2, 2, 3, 3]);
  });

  it("ne portent qu'un artefact possédé, dans un emplacement ouvert, une seule fois", () => {
    const state = withOwned({ moleTooth: 1, fallenStar: 1 });
    expect(equipArtifact(state, 'magmaTear', 0, 3)).toBe(state);
    expect(equipArtifact(state, 'moleTooth', 1, 1)).toBe(state);
    const moved = equipArtifact(equipArtifact(state, 'moleTooth', 0, 2), 'moleTooth', 1, 2);
    expect(moved.slots).toEqual([null, 'moleTooth', null]);
    expect(preferredSlot(moved, 2)).toBe(0);
  });

  it("additionnent les effets des artefacts portés, sans compter les emplacements fermés", () => {
    const state = { ...withOwned({ moleTooth: 1, fallenStar: 1 }), slots: ['moleTooth', 'fallenStar', null] as const };
    expect(equippedArtifactBonuses(state, 1).goldPct).toBe(0);
    expect(equippedArtifactBonuses(state, 2).goldPct).toBeCloseTo(0.2);
    expect(equippedArtifactBonuses(state, 2).strikePct).toBeCloseTo(0.05);
  });
});

describe('effets', () => {
  it('doublent entre le niveau 1 et le niveau maximum', () => {
    expect(artifactEffects('moleTooth', 1).strikePct).toBeCloseTo(0.05);
    expect(artifactEffects('moleTooth', ARTIFACT_MAX_LEVEL).strikePct).toBeCloseTo(0.1);
  });

  it('restent modestes : aucun légendaire au maximum ne dépasse +30 % de Frappe', () => {
    for (const id of ARTIFACT_IDS) {
      expect(artifactEffects(id, ARTIFACT_MAX_LEVEL).strikePct).toBeLessThanOrEqual(0.3);
    }
  });
});

describe('réforge', () => {
  const maxed = withOwned({ moleTooth: ARTIFACT_MAX_LEVEL, fallenStar: 1 });
  const stock = (amounts: Partial<Record<TierId, number>>) =>
    Object.fromEntries(TIER_IDS.map((tier) => [tier, amounts[tier] ?? 0])) as Record<TierId, number>;

  it("n'est possible qu'au niveau maximum", () => {
    expect(canReforge(maxed, 'moleTooth')).toBe(true);
    expect(canReforge(maxed, 'fallenStar')).toBe(false);
  });

  it('coûte 30 minerais de chacun des 3 matériaux les plus abondants, puis 50 % de plus à chaque fois, jusqu’à ×3', () => {
    expect(reforgeOreCost(stock({ stone: 100, copper: 40, iron: 31, wood: 5 }), 30)).toEqual({ stone: 30, copper: 30, iron: 30 });
    expect(reforgeOreCost(stock({ stone: 100, copper: 40, iron: 20 }), 30)).toBeNull();
    let state = maxed;
    const costs = [];
    for (let attempt = 0; attempt < 5; attempt++) {
      costs.push(reforgeOresEach(state, 'moleTooth'));
      state = resolveReforge(reforge(state, 'moleTooth', sequence(0.5), false), false);
    }
    expect(costs).toEqual([30, 45, 68, 90, 90]);
  });

  it("attend le choix du joueur : garder le nouvel effet, ou revenir à l'ancien", () => {
    const rolled = reforge(maxed, 'moleTooth', sequence(0, 0.99), false);
    expect(rolled.pending).toEqual({ id: 'moleTooth', affix: { bonus: 'strikePct', rarity: 'legendary' } });
    expect(canReforge(rolled, 'moleTooth')).toBe(false);
    const kept = resolveReforge(rolled, true);
    expect(kept.affixes.moleTooth).toEqual({ bonus: 'strikePct', rarity: 'legendary' });
    expect(artifactEffects('moleTooth', ARTIFACT_MAX_LEVEL, kept.affixes.moleTooth).strikePct).toBeCloseTo(0.2);
    expect(resolveReforge(rolled, false).affixes.moleTooth).toBeUndefined();
  });

  it('utilise un jeton sans faire monter le prix', () => {
    const withToken = { ...maxed, tokens: { moleTooth: 1 } };
    const rolled = reforge(withToken, 'moleTooth', sequence(0.5), true);
    expect(rolled.tokens.moleTooth).toBe(0);
    expect(reforgeOresEach(rolled, 'moleTooth')).toBe(30);
  });

  it('donne de plus gros effets aux meilleures qualités', () => {
    expect(affixValue({ bonus: 'goldPct', rarity: 'common' })).toBeLessThan(affixValue({ bonus: 'goldPct', rarity: 'legendary' }));
  });
});

describe('sauvegarde', () => {
  it("reprend l'ancienne sauvegarde : l'artefact porté passe dans le 1er emplacement", () => {
    expect(parseArtifactState({ owned: { moleTooth: 2 }, equipped: 'moleTooth' })).toEqual({
      ...EMPTY_ARTIFACTS,
      owned: { moleTooth: 2 },
      slots: ['moleTooth', null, null],
    });
  });

  it('refuse un artefact inconnu, un porté non possédé ou un niveau impossible', () => {
    expect(parseArtifactState({ owned: { inventé: 1 }, equipped: null })).toBeNull();
    expect(parseArtifactState({ owned: {}, equipped: 'moleTooth' })).toBeNull();
    expect(parseArtifactState({ owned: { moleTooth: 9 }, equipped: null })).toBeNull();
    expect(parseArtifactState({ owned: { moleTooth: 1 }, slots: ['fallenStar', null, null] })).toBeNull();
  });

  it('relit une sauvegarde complète', () => {
    const state = resolveReforge(reforge(withOwned({ moleTooth: ARTIFACT_MAX_LEVEL }), 'moleTooth', sequence(0.2), false), true);
    expect(parseArtifactState(JSON.parse(JSON.stringify(state)))).toEqual(state);
  });
});
