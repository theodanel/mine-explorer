import { hintDone, isNewGame, newlyRevealed, parseRevealed, RevealFacts, RevealId } from './reveal-rules';

const START: RevealFacts = {
  rocksBroken: 0,
  itemsForged: 0,
  segmentsPaid: 0,
  pickaxeLevel: 1,
  canForge: false,
  canPaySegment: false,
  zone: 1,
};
const none = new Set<RevealId>();

describe('Dévoilement progressif', () => {
  it("ne montre rien de plus que le filon au tout début d'une partie", () => {
    expect(newlyRevealed(START, none)).toEqual([]);
  });

  it('dévoile la forge dès que le joueur peut forger', () => {
    expect(newlyRevealed({ ...START, rocksBroken: 2, canForge: true }, none)).toEqual(['forge']);
  });

  it("dévoile l'équipement et les missions au premier objet forgé, dans l'ordre de rencontre", () => {
    expect(newlyRevealed({ ...START, itemsForged: 1 }, new Set<RevealId>(['forge']))).toEqual(['equipment', 'missions']);
  });

  it("dévoile la pioche quand l'or suffit après deux forges, et la garde dévoilée une fois payée", () => {
    expect(newlyRevealed({ ...START, canPaySegment: true }, none)).not.toContain('pickaxe');
    expect(newlyRevealed({ ...START, itemsForged: 2, canPaySegment: true }, none)).toContain('pickaxe');
    expect(newlyRevealed({ ...START, segmentsPaid: 1 }, none)).toContain('pickaxe');
  });

  it('garde Auto et Filtres pour quand forger devient une routine', () => {
    expect(newlyRevealed({ ...START, itemsForged: 9 }, none)).not.toContain('forgeTools');
    expect(newlyRevealed({ ...START, itemsForged: 10 }, none)).toContain('forgeTools');
  });

  it('ouvre le menu du bas à la zone 2 et la roue du jour à la zone 3', () => {
    expect(newlyRevealed({ ...START, zone: 2 }, none)).toEqual(['footer']);
    expect(newlyRevealed({ ...START, zone: 3 }, none)).toEqual(['footer', 'lottery']);
  });

  it('oublie la bulle de la forge quand le joueur a déjà forgé', () => {
    expect(hintDone('forge', START)).toBe(false);
    expect(hintDone('forge', { ...START, itemsForged: 1 })).toBe(true);
  });

  it('ne redévoile pas ce qui est déjà là', () => {
    expect(newlyRevealed({ ...START, itemsForged: 1 }, new Set<RevealId>(['forge', 'equipment', 'missions']))).toEqual([]);
  });

  it("ne cache l'interface qu'au vrai début d'une partie", () => {
    expect(isNewGame(1, 1)).toBe(true);
    expect(isNewGame(1, 2)).toBe(false);
  });

  it('relit une sauvegarde valide et refuse un élément inconnu', () => {
    expect(parseRevealed(['forge', 'forge', 'missions'])).toEqual(['forge', 'missions']);
    expect(parseRevealed(['forge', 'dragon'])).toBeNull();
    expect(parseRevealed({ forge: true })).toBeNull();
  });
});
