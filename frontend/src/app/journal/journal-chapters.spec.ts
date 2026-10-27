import { chapterAt, chapterDone, chaptersAlreadyDone, FIRST_LOOP, JournalFacts, lifeChapter } from './journal-chapters';

const START: JournalFacts = {
  rocksBroken: 0,
  itemsForged: 0,
  pickaxeLevel: 1,
  piecesWorn: 0,
  divineOfFamily: 0,
  zone: 1,
  formIndex: 0,
  skillPointsSpent: 0,
  companionActive: false,
  workshopUpgrades: 0,
  campLevels: 0,
  abyssRecord: 0,
  astreStage: 0,
  seals: 0,
  phase: 0,
  rebirths: 0,
};

describe('Carnet d’aventure', () => {
  it('compte 13 chapitres pour la 1re boucle, chacun avec son lore, ses objectifs et sa récompense', () => {
    expect(FIRST_LOOP).toHaveLength(13);
    for (const chapter of FIRST_LOOP) {
      expect(chapter.lore.length).toBeGreaterThan(50);
      expect(chapter.objectives.length).toBeGreaterThan(0);
      expect(chapter.shards).toBeGreaterThan(0);
    }
  });

  it('remplit le premier chapitre en cassant 5 filons et en forgeant un objet', () => {
    expect(chapterDone(FIRST_LOOP[0], START)).toBe(false);
    expect(chapterDone(FIRST_LOOP[0], { ...START, rocksBroken: 5, itemsForged: 1 })).toBe(true);
  });

  it('coche d’office les chapitres d’une partie avancée, jusqu’au premier pas encore rempli', () => {
    expect(chaptersAlreadyDone(START)).toBe(0);
    const midGame = { ...START, rocksBroken: 500, itemsForged: 300, pickaxeLevel: 10, piecesWorn: 5, zone: 4, skillPointsSpent: 5, companionActive: true };
    expect(chaptersAlreadyDone(midGame)).toBe(4);
  });

  it('tient une page par vie après la 1re boucle, puis la suite sans fin après la phase 5', () => {
    expect(chapterAt(FIRST_LOOP.length, 1).title).toContain('phase 2');
    expect(lifeChapter(2).objectives.some((objective) => objective.label.includes('sceau 3'))).toBe(true);
    expect(lifeChapter(5).title).toContain('au-delà');
  });
});
