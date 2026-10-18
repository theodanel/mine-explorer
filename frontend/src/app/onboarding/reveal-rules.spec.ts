import { hintDone, isNewGame, newlyRevealed, parseRevealed, RevealFacts, RevealId } from './reveal-rules';

const START: RevealFacts = {
  itemsForged: 0,
  segmentsPaid: 0,
  pickaxeLevel: 1,
  canForge: false,
  canPaySegment: false,
  skillsOpen: false,
  companionsOpen: false,
  artifactsOpen: false,
  workshopOpen: false,
  adventuresOpen: false,
};
const none = new Set<RevealId>();

describe('Prise en main', () => {
  it("ne présente rien au tout début d'une partie", () => {
    expect(newlyRevealed(START, none)).toEqual([]);
  });

  it('présente la forge dès que le joueur peut forger', () => {
    expect(newlyRevealed({ ...START, canForge: true }, none)).toEqual(['forge']);
  });

  it("présente l'équipement et les missions au premier objet forgé, dans l'ordre de rencontre", () => {
    expect(newlyRevealed({ ...START, itemsForged: 1 }, new Set<RevealId>(['forge']))).toEqual(['equipment', 'missions']);
  });

  it("présente la pioche quand l'or suffit après deux forges, ou dès qu'elle a été payée", () => {
    expect(newlyRevealed({ ...START, canPaySegment: true }, none)).not.toContain('pickaxe');
    expect(newlyRevealed({ ...START, itemsForged: 2, canPaySegment: true }, none)).toContain('pickaxe');
    expect(newlyRevealed({ ...START, segmentsPaid: 1 }, none)).toContain('pickaxe');
  });

  it('garde Auto et Filtres pour quand forger devient une routine', () => {
    expect(newlyRevealed({ ...START, itemsForged: 9 }, none)).not.toContain('forgeTools');
    expect(newlyRevealed({ ...START, itemsForged: 10 }, none)).toContain('forgeTools');
  });

  it("présente l'onglet d'un menu à son ouverture", () => {
    expect(newlyRevealed({ ...START, skillsOpen: true, companionsOpen: true }, none)).toEqual(['skills', 'companions']);
    expect(newlyRevealed({ ...START, artifactsOpen: true }, none)).toEqual(['artifacts']);
  });

  it('oublie la bulle de la forge quand le joueur a déjà forgé', () => {
    expect(hintDone('forge', START)).toBe(false);
    expect(hintDone('forge', { ...START, itemsForged: 1 })).toBe(true);
  });

  it('ne présente pas deux fois le même élément', () => {
    expect(newlyRevealed({ ...START, itemsForged: 1 }, new Set<RevealId>(['forge', 'equipment', 'missions']))).toEqual([]);
  });

  it("ne présente le jeu pas à pas qu'au vrai début d'une partie", () => {
    expect(isNewGame(1, 1)).toBe(true);
    expect(isNewGame(1, 2)).toBe(false);
  });

  it('relit une sauvegarde valide et refuse un élément inconnu', () => {
    expect(parseRevealed(['forge', 'forge', 'missions'])).toEqual(['forge', 'missions']);
    expect(parseRevealed(['forge', 'dragon'])).toBeNull();
    expect(parseRevealed({ forge: true })).toBeNull();
  });
});
