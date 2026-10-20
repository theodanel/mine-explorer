import { ACHIEVEMENTS } from '../balance/achievements';
import { AchievementSnapshot, isValidUnlocked, knownAchievements, newlyMet, titleOf } from './achievement-rules';

const START: AchievementSnapshot = {
  zoneReached: 1,
  zonesCleared: 0,
  itemsForged: 0,
  jackpots: 0,
  abyssRecord: 0,
  setPieces: 0,
  divineSet: 0,
  outfits: 0,
  evolutionForm: 0,
  heartStars: 0,
};

describe('succès', () => {
  it('compte 27 succès aux identifiants uniques, chacun avec un titre', () => {
    expect(ACHIEVEMENTS).toHaveLength(27);
    expect(new Set(ACHIEVEMENTS.map((achievement) => achievement.id)).size).toBe(27);
  });

  it('ne donne rien au début, puis les succès atteints, une seule fois', () => {
    expect(newlyMet([], START)).toEqual([]);
    const later = { ...START, zoneReached: 5, itemsForged: 150 };
    const earned = newlyMet([], later).map((achievement) => achievement.id);
    expect(earned).toEqual(['premiers-pas', 'cinq-zones', 'forge-100']);
    expect(newlyMet(earned, later)).toEqual([]);
  });

  it('retrouve le titre d’un succès', () => {
    expect(titleOf('forge-1000')).toBe('Forgeron');
    expect(titleOf(null)).toBeNull();
    expect(titleOf('inconnu')).toBeNull();
  });

  it('oublie les succès retirés du jeu, refuse une liste illisible', () => {
    expect(isValidUnlocked(['premiers-pas'])).toBe(true);
    expect(isValidUnlocked([42])).toBe(false);
    expect(knownAchievements(['premiers-pas', 'donjon-10'])).toEqual(['premiers-pas']);
  });
});
